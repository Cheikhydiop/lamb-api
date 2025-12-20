// src/services/EmailService.ts
import { Service } from 'typedi';
import nodemailer, { Transporter } from 'nodemailer';
import logger from '../utils/logger';
import { User, Bet, Fight, Winning, TransactionType } from '@prisma/client';

// Interface Fighter car elle n'est pas exportée par Prisma
interface Fighter {
  id: string;
  name: string;
  nickname?: string | null;
  stable?: string | null;
  nationality: string;
  wins: number;
  losses: number;
  draws: number;
  isActive: boolean;
}

@Service()
export class EmailService {
  private transporter: Transporter;
  private isConfigured: boolean = false;

  constructor() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Vérifier si la configuration SMTP est disponible
    if (smtpUser && smtpPass) {
      this.isConfigured = true;
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Tester la connexion
      this.testConnection();
    } else {
      logger.warn('SMTP configuration not found. Running in development/log-only mode.');
      this.isConfigured = false;
      // Créer un transporteur factice pour éviter les erreurs
      this.transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.isConfigured) return;

    try {
      await this.transporter.verify();
      logger.info('✅ SMTP connection verified successfully');
    } catch (error: any) {
      logger.error(`❌ SMTP connection failed: ${error.message}`);
      // Ne pas bloquer l'application en cas d'erreur de connexion
      this.isConfigured = false;
    }
  }

  /**
   * Méthode générique pour envoyer un email (sûre)
   * @returns Promise<boolean> True si l'email a été envoyé ou loggé en dev
   */
  async sendEmailSafe(options: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string
  }): Promise<boolean> {
    const isProduction = process.env.NODE_ENV === 'production';
    const emailToSend = options.to;

    // 1. Extraire et logger le code OTP pour le développement
    const extractedCode = this.extractVerificationCode(options.html);
    if (extractedCode) {
      logger.info(`📧 [EMAIL OTP] Pour ${emailToSend}: ${extractedCode}`);
    }

    // 2. Logger les détails en mode développement
    if (!isProduction) {
      logger.info(`📧 [DEV EMAIL] Destinataire: ${emailToSend}, Sujet: "${options.subject}"`);

      if (!this.isConfigured) {
        logger.info(`📧 [DEV EMAIL] Non envoyé (SMTP non configuré). OTP: ${extractedCode || 'N/A'}`);
        return true; // Succès en mode dev sans envoyer
      }
    }

    // 3. Tenter d'envoyer via SMTP si configuré
    if (this.isConfigured) {
      try {
        const mailOptions = {
          from: process.env.FROM_EMAIL || '"Xbeur" <no-reply@xbeur.com>',
          to: emailToSend,
          subject: options.subject,
          html: options.html,
          replyTo: options.replyTo,
        };

        const info = await this.transporter.sendMail(mailOptions);

        if (isProduction) {
          logger.info(`✅ Email envoyé à ${emailToSend} [ID: ${info.messageId}]`);
        } else {
          // En développement, afficher l'URL de prévisualisation si disponible
          const previewText = info.response?.includes('mailtrap')
            ? ` | Preview: ${info.response}`
            : '';
          logger.info(`✅ Email envoyé à ${emailToSend}${previewText}`);
        }

        return true;
      } catch (error: any) {
        logger.error(`❌ Échec d'envoi d'email à ${emailToSend}: ${error.message}`);

        // Fallback: logger l'email dans la console en mode développement
        if (!isProduction) {
          logger.info(`📧 [FALLBACK] Contenu pour ${emailToSend}:`);
          logger.info(`   Sujet: ${options.subject}`);
          logger.info(`   Code OTP: ${extractedCode || 'Non trouvé'}`);
        }

        // En production, on peut choisir de retourner false si l'envoi est critique
        if (isProduction && process.env.EMAIL_STRICT_MODE === 'true') {
          return false;
        }

        // Sinon, on considère que c'est un succès pour ne pas bloquer le flux
        return true;
      }
    }

    // 4. Fallback pour le développementaaa
    if (!isProduction) {
      logger.info(`📧 [MOCK] Email simulé pour ${emailToSend}:`);
      logger.info(`   Sujet: ${options.subject}`);
      logger.info(`   OTP: ${extractedCode || 'N/A'}`);
      return true;
    }

    // 5. En production sans configuration, c'est une erreur
    logger.error('Tentative d\'envoi d\'email en production sans configuration SMTP.');
    return false;
  }

  // Helper pour extraire le code OTP du HTML
  private extractVerificationCode(html: string): string | null {
    const match = html.match(/>\s*(\d{6})\s*</);
    return match ? match[1] : null;
  }

  // ========== MÉTHODES D'ENVOI SPÉCIFIQUES ==========

  // Envoi de code de vérification (version simplifiée)
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const html = this.generateVerificationTemplate(code);
    return this.sendEmailSafe({
      to: email,
      subject: 'Vérification de votre adresse email - Xbeur',
      html,
    });
  }

  private generateVerificationTemplate(code: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur</h1>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">La plateforme de paris sportifs</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; font-size: 24px; margin-top: 0; text-align: center;">Vérification de votre compte</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
            Voici votre code de vérification pour activer votre compte Xbeur :
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #f5f5f5; padding: 20px 40px; border-radius: 8px; border: 2px dashed #4CAF50;">
              <h3 style="color: #333; font-size: 36px; letter-spacing: 10px; margin: 0; font-weight: bold;">${code}</h3>
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 25px;">
            Ce code est valable pendant <strong>15 minutes</strong>
          </p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #4CAF50; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>⚠️ Sécurité :</strong> Ne partagez jamais ce code avec qui que ce soit. 
              L'équipe Xbeur ne vous demandera jamais votre code de vérification par email.
            </p>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            Si vous n'avez pas créé de compte sur Xbeur, veuillez ignorer cet email.
          </p>
          <p style="margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} Xbeur. Tous droits réservés.
          </p>
        </div>
      </div>
    `;
  }

  // Notification de pari accepté
  async sendBetAcceptedNotification(bet: Bet & { creator: User; acceptor: User; fight: Fight }): Promise<boolean> {
    const fighterChoice = bet.chosenFighter === 'A' ? 'Fighter A' : 'Fighter B';
    const amount = Number(bet.amount) / 100;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur</h1>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">Votre pari est maintenant actif !</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
              ✅ PARI ACCEPTÉ
            </div>
          </div>
          
          <h2 style="color: #333; font-size: 22px; margin-top: 0; text-align: center;">Votre pari a trouvé un adversaire</h2>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #f8f9fa;">
            <h3 style="color: #555; font-size: 18px; margin-top: 0; text-align: center;">Détails du pari</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div style="text-align: center;">
                <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Montant</p>
                <p style="color: #333; font-size: 20px; font-weight: bold; margin: 0;">${amount.toFixed(2)} XOF</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Votre choix</p>
                <p style="color: #333; font-size: 20px; font-weight: bold; margin: 0;">${fighterChoice}</p>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Adversaire</p>
              <p style="color: #333; font-size: 16px; font-weight: bold; margin: 0;">
                ${bet.acceptor.name} (${bet.acceptor.phone})
              </p>
            </div>
          </div>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #f0f7ff;">
            <h3 style="color: #555; font-size: 18px; margin-top: 0; text-align: center;">Combat</h3>
            <p style="color: #333; font-size: 18px; font-weight: bold; text-align: center; margin: 10px 0;">
              ${bet.fight.title}
            </p>
            <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
              ${new Date(bet.fight.scheduledAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
            </p>
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 5px;">
              ${bet.fight.location}
            </p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 6px; margin-top: 25px; text-align: center;">
            <p style="color: #2e7d32; font-size: 16px; margin: 0; font-weight: bold;">
              Le résultat sera disponible après le combat. Bonne chance !
            </p>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            Ceci est une notification automatique. Veuillez ne pas répondre à cet email.
          </p>
          <p style="margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} Xbeur. Tous droits réservés.
          </p>
        </div>
      </div>
    `;

    if (!bet.creator.email) {
      logger.warn(`Cannot send bet accepted notification: creator ${bet.creator.id} has no email`);
      return false;
    }

    return this.sendEmailSafe({
      to: bet.creator.email,
      subject: `🎉 Votre pari a été accepté ! - Xbeur`,
      html,
    });
  }

  // Notification de gain
  async sendWinningNotification(winning: Winning & { user: User; bet: Bet & { fight: Fight } }): Promise<boolean> {
    const amount = Number(winning.amount) / 100;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur</h1>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">🎊 Bravo pour votre gain !</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: white; padding: 15px 30px; border-radius: 25px; font-weight: bold; font-size: 20px;">
              🏆 VOUS AVEZ GAGNÉ !
            </div>
          </div>
          
          <h2 style="color: #333; font-size: 24px; margin-top: 0; text-align: center;">Félicitations ${winning.user.name} !</h2>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #fff8e1; border: 3px solid #FFD700; padding: 25px 40px; border-radius: 10px;">
              <p style="color: #666; font-size: 16px; margin: 0 0 10px 0;">Montant gagné</p>
              <p style="color: #333; font-size: 42px; font-weight: bold; margin: 0;">${amount.toFixed(2)} XOF</p>
            </div>
          </div>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #f8f9fa;">
            <h3 style="color: #555; font-size: 18px; margin-top: 0; text-align: center;">Détails du gain</h3>
            
            <div style="margin-top: 15px;">
              <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Combat</p>
              <p style="color: #333; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                ${winning.bet.fight.title}
              </p>
              
              <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Date du pari</p>
              <p style="color: #333; font-size: 16px; margin: 0 0 15px 0;">
                ${new Date(winning.bet.createdAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
              </p>
              
              <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Date du gain</p>
              <p style="color: #333; font-size: 16px; margin: 0;">
                ${new Date(winning.distributedAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
              </p>
            </div>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
            <p style="color: #2e7d32; font-size: 18px; margin: 0; font-weight: bold;">
              🎯 Votre gain a été crédité sur votre portefeuille Xbeur
            </p>
            <p style="color: #2e7d32; font-size: 16px; margin: 10px 0 0 0;">
              Vous pouvez maintenant utiliser cet argent pour de nouveaux paris ou le retirer.
            </p>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            Ceci est une notification automatique. Veuillez ne pas répondre à cet email.
          </p>
          <p style="margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} Xbeur. Tous droits réservés.
          </p>
        </div>
      </div>
    `;

    if (!winning.user.email) {
      logger.warn(`Cannot send winning notification: user ${winning.user.id} has no email`);
      return false;
    }

    return this.sendEmailSafe({
      to: winning.user.email,
      subject: `💰 Félicitations ! Vous avez gagné ${amount.toFixed(2)} XOF - Xbeur`,
      html,
    });
  }

  // Notification de paiement confirmé
  async sendPaymentConfirmedNotification(user: User, amount: bigint, type: TransactionType): Promise<boolean> {
    if (!user.email) {
      logger.warn(`Cannot send payment notification: user ${user.id} has no email`);
      return false;
    }

    const amountFormatted = Number(amount) / 100;
    const typeText = type === 'DEPOSIT' ? 'Dépôt' : 'Retrait';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur</h1>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">Transaction confirmée</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
              ✅ TRANSACTION CONFIRMÉE
            </div>
          </div>
          
          <h2 style="color: #333; font-size: 22px; margin-top: 0; text-align: center;">${typeText} réussi(e)</h2>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #f0f7ff; border: 2px solid #4CAF50; padding: 25px 40px; border-radius: 10px;">
              <p style="color: #666; font-size: 16px; margin: 0 0 10px 0;">Montant</p>
              <p style="color: #333; font-size: 36px; font-weight: bold; margin: 0;">${amountFormatted.toFixed(2)} XOF</p>
            </div>
          </div>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #f8f9fa;">
            <h3 style="color: #555; font-size: 18px; margin-top: 0; text-align: center;">Détails de la transaction</h3>
            
            <div style="margin-top: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666; font-size: 14px;">Type</span>
                <span style="color: #333; font-size: 16px; font-weight: bold;">
                  ${type === 'DEPOSIT' ? '💰 Dépôt' : '💸 Retrait'}
                </span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666; font-size: 14px;">Date</span>
                <span style="color: #333; font-size: 16px;">
                  ${new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
                </span>
              </div>
              
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #666; font-size: 14px;">Statut</span>
                <span style="color: #4CAF50; font-size: 16px; font-weight: bold;">✅ Confirmé</span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 6px; margin-top: 25px; text-align: center;">
            <p style="color: #2e7d32; font-size: 16px; margin: 0; font-weight: bold;">
              ${type === 'DEPOSIT'
        ? 'Votre portefeuille a été crédité avec succès. Prêt pour de nouveaux paris !'
        : 'Votre retrait a été traité avec succès. L\'argent sera disponible sur votre compte sous peu.'
      }
            </p>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            Ceci est une notification automatique. Veuillez ne pas répondre à cet email.
          </p>
          <p style="margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} Xbeur. Tous droits réservés.
          </p>
        </div>
      </div>
    `;

    return this.sendEmailSafe({
      to: user.email,
      subject: `✅ ${typeText} confirmé(e) - Xbeur`,
      html,
    });
  }

  // Notification lorsqu'un utilisateur est taggé dans un pari
  async sendTaggedInBetNotification(
    taggedUser: User,
    bet: Bet & { creator: User; fight: Fight }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur</h1>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">Quelqu'un vous a tagué !</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
              🏷️ VOUS ÊTES TAGUÉ
            </div>
          </div>
          
          <h2 style="color: #333; font-size: 22px; margin-top: 0; text-align: center;">${bet.creator.name} vous a tagué dans un pari</h2>
          <p style="color: #666; font-size: 16px; text-align: center; margin: 15px 0 25px 0;">
            Ils pensent que vous pourriez être intéressé par ce pari ou que vous avez une opinion sur ce combat.
          </p>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #f8f9fa;">
            <h3 style="color: #555; font-size: 18px; margin-top: 0; text-align: center;">Pari tagué</h3>
            
            <div style="margin-top: 15px;">
              <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Créé par</p>
              <p style="color: #333; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">
                ${bet.creator.name}
              </p>
              
              <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Combat</p>
              <p style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">
                ${bet.fight.title}
              </p>
              <p style="color: #666; font-size: 14px; margin: 0;">
                ${new Date(bet.fight.scheduledAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
              </p>
            </div>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center;">
            <p style="color: #1565c0; font-size: 18px; margin: 0; font-weight: bold;">
              👀 Voulez-vous accepter ce pari ?
            </p>
            <p style="color: #1565c0; font-size: 16px; margin: 10px 0 0 0;">
              Connectez-vous à Xbeur pour voir les détails et accepter le défi !
            </p>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            Ceci est une notification automatique. Veuillez ne pas répondre à cet email.
          </p>
          <p style="margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} Xbeur. Tous droits réservés.
          </p>
        </div>
      </div>
    `;

    if (!taggedUser.email) {
      logger.warn(`Cannot send tagged notification: user ${taggedUser.id} has no email`);
      return false;
    }

    return this.sendEmailSafe({
      to: taggedUser.email,
      subject: `🏷️ Vous avez été tagué dans un pari - Xbeur`,
      html,
    });
  }

  // Notification quand un combat est terminé
  async sendFightFinishedNotification(
    user: User,
    fight: Fight & { fighterA: Fighter; fighterB: Fighter },
    winner: 'A' | 'B' | 'DRAW'
  ): Promise<boolean> {
    const winnerName = winner === 'A' ? fight.fighterA.name :
      winner === 'B' ? fight.fighterB.name : 'Match nul';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur</h1>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">Résultats du combat</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #ff9800; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
              🥊 COMBAT TERMINÉ
            </div>
          </div>
          
          <h2 style="color: #333; font-size: 24px; margin-top: 0; text-align: center;">${fight.title}</h2>
          
          <div style="display: flex; justify-content: center; align-items: center; gap: 30px; margin: 30px 0;">
            <div style="text-align: center;">
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; min-width: 150px;">
                <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">${fight.fighterA.name}</p>
                ${winner === 'A' ? '<div style="color: #4CAF50; font-weight: bold; font-size: 24px;">🏆</div>' : ''}
              </div>
            </div>
            
            <div style="text-align: center;">
              <p style="color: #ff9800; font-size: 24px; font-weight: bold; margin: 0;">VS</p>
            </div>
            
            <div style="text-align: center;">
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; min-width: 150px;">
                <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">${fight.fighterB.name}</p>
                ${winner === 'B' ? '<div style="color: #4CAF50; font-weight: bold; font-size: 24px;">🏆</div>' : ''}
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: ${winner === 'DRAW' ? '#ff9800' : '#4CAF50'}; color: white; padding: 15px 30px; border-radius: 25px;">
              <p style="font-size: 20px; font-weight: bold; margin: 0;">
                ${winner === 'DRAW' ? '🤝 MATCH NUL' : `🏆 VAINQUEUR : ${winnerName}`}
              </p>
            </div>
          </div>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #f8f9fa;">
            <h3 style="color: #555; font-size: 18px; margin-top: 0; text-align: center;">Détails du combat</h3>
            
            <div style="margin-top: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666; font-size: 14px;">Lieu</span>
                <span style="color: #333; font-size: 16px; font-weight: bold;">${fight.location}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666; font-size: 14px;">Date</span>
                <span style="color: #333; font-size: 16px;">
                  ${new Date(fight.scheduledAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
                </span>
              </div>
              
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #666; font-size: 14px;">Statut</span>
                <span style="color: #ff9800; font-size: 16px; font-weight: bold;">✅ Terminé</span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 6px; margin-top: 25px; text-align: center;">
            <p style="color: #2e7d32; font-size: 16px; margin: 0; font-weight: bold;">
              📊 Les gains des paris sont en cours de calcul et seront distribués sous peu.
            </p>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            Ceci est une notification automatique. Veuillez ne pas répondre à cet email.
          </p>
          <p style="margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} Xbeur. Tous droits réservés.
          </p>
        </div>
      </div>
    `;

    if (!user.email) {
      logger.warn(`Cannot send fight finished notification: user ${user.id} has no email`);
      return false;
    }

    return this.sendEmailSafe({
      to: user.email,
      subject: `🥊 Combat terminé : ${fight.title} - Xbeur`,
      html,
    });
  }

  // Notification de validation de combat (OTP)
  async sendFightValidationOTP(email: string, code: string, fightTitle: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur - Admin</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #d32f2f; font-size: 22px; margin-top: 0; text-align: center;">Validation de Résultat de Combat</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
            Vous avez demandé la validation du résultat pour le combat : 
            <br><strong>${fightTitle}</strong>
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #f5f5f5; padding: 20px 40px; border-radius: 8px; border: 2px dashed #d32f2f;">
              <h3 style="color: #333; font-size: 36px; letter-spacing: 10px; margin: 0; font-weight: bold;">${code}</h3>
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-bottom: 25px;">
            Ce code est strictement personnel et valable pendant <strong>10 minutes</strong>.
          </p>
          
          <div style="background-color: #fff4e5; padding: 15px; border-radius: 6px; border-left: 4px solid #ff9800; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>⚠️ Sécurité :</strong> Si vous n'êtes pas à l'origine de cette demande, veuillez sécuriser votre compte administrateur immédiatement.
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmailSafe({
      to: email,
      subject: `🚨 CODE DE SÉCURITÉ : Validation de combat - ${fightTitle}`,
      html,
    });
  }

  // Notification pour vérification d'appareil
  async sendDeviceVerificationOTP(
    email: string,
    username: string,
    code: string,
    deviceInfo: any
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur</h1>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">Nouvel appareil détecté</p>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; font-size: 24px; margin-top: 0; text-align: center;">Vérification requise</h2>
          <p>Bonjour ${username},</p>
          <p>Nous avons détecté une connexion depuis un nouvel appareil :</p>
          <ul>
            <li><strong>Appareil :</strong> ${deviceInfo.deviceName || 'Inconnu'}</li>
            <li><strong>Navigateur :</strong> ${deviceInfo.browser || 'Inconnu'}</li>
            <li><strong>OS :</strong> ${deviceInfo.os || 'Inconnu'}</li>
          </ul>
          <p>Pour confirmer qu'il s'agit bien de vous, voici votre code de vérification :</p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #f5f5f5; padding: 20px 40px; border-radius: 8px; border: 2px dashed #4CAF50;">
              <h3 style="color: #333; font-size: 36px; letter-spacing: 10px; margin: 0; font-weight: bold;">${code}</h3>
            </div>
          </div>

          <p>Ce code expire dans 15 minutes.</p>
        </div>
      </div>
    `;

    return this.sendEmailSafe({
      to: email,
      subject: '🔒 Code de vérification nouvel appareil - Xbeur',
      html,
    });
  }

  // Notification de confirmation de connexion
  async sendDeviceConnectionConfirmation(
    email: string,
    name: string,
    deviceInfo: any,
    time: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur</h1>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">Nouvelle connexion détectée</p>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; font-size: 24px; margin-top: 0; text-align: center;">Connexion Confirmée</h2>
          <p>Bonjour ${name},</p>
          <p>Une nouvelle connexion à votre compte a été effectuée avec succès.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📅 Date :</strong> ${time}</p>
            <p style="margin: 5px 0;"><strong>📱 Appareil :</strong> ${deviceInfo.deviceName || 'Inconnu'}</p>
            <p style="margin: 5px 0;"><strong>🌐 Navigateur :</strong> ${deviceInfo.browser || 'Inconnu'}</p>
            <p style="margin: 5px 0;"><strong>💻 OS :</strong> ${deviceInfo.os || 'Inconnu'}</p>
          </div>

          <p>Si c'était vous, vous pouvez ignorer cet email.</p>
          
          <div style="background-color: #fff4e5; padding: 15px; border-radius: 6px; border-left: 4px solid #ff9800; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>⚠️ Sécurité :</strong> Si vous ne reconnaissez pas cette activité, veuillez changer votre mot de passe immédiatement.
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmailSafe({
      to: email,
      subject: 'Connexion à votre compte Xbeur',
      html,
    });
  }

  // Méthode pour envoyer des emails avec pièces jointes
  async sendEmailWithAttachments(options: {
    to: string | string[];
    subject: string;
    html: string;
    attachments?: Array<{
      filename: string;
      path: string;
      contentType?: string;
    }>;
    replyTo?: string;
  }): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Cannot send attachments: SMTP not configured.');
      return false;
    }

    try {
      const fs = await import('fs');
      const attachments = await Promise.all(
        (options.attachments || []).map(async (att) => {
          const content = await fs.promises.readFile(att.path);
          return {
            filename: att.filename,
            content: content.toString('base64'),
            contentType: att.contentType,
          };
        })
      );

      const mailOptions = {
        from: process.env.FROM_EMAIL || '"Xbeur" <no-reply@xbeur.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email with attachments sent successfully: ${info.messageId}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send email with attachments: ${error.message}`);
      return false;
    }
  }
}

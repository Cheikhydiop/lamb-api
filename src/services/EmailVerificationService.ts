// src/services/EmailVerificationService.ts
import { Service } from 'typedi';
import { EmailService } from './EmailService';
import logger from '../utils/logger';
import { BadRequestError } from '../utils/response/errors/bad-request-error';
import { NotFoundError } from '../utils/response/errors/not-found-error';
import { UserRepository } from '../repositories/UserRepository';
import { VerificationStatusResponse } from '../dto/auth/verification-status.dto';
import prisma from '../config/prismaClient';
import { User } from '@prisma/client';

// Dans EmailVerificationService.ts
@Service()
export class EmailVerificationService {
  constructor(
    private emailService: EmailService,
    private userRepository: UserRepository
  ) { }

  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    try {
      logger.info(`📧 [EMAIL VERIFICATION] Début pour ${email} (${userId})`);

      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        logger.error(`❌ [EMAIL VERIFICATION] Utilisateur non trouvé: ${userId}`);
        throw new NotFoundError('Utilisateur non trouvé');
      }

      logger.info(`✅ [EMAIL VERIFICATION] Utilisateur trouvé: ${user.email}`);

      // Créer et envoyer la vérification
      await this.createVerification(user);

      logger.info(`✅ [EMAIL VERIFICATION] Email envoyé avec succès à ${email}`);

    } catch (error: any) {
      logger.error(`❌ [EMAIL VERIFICATION] Échec pour ${email}`, {
        userId,
        email,
        errorName: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack
      });

      // ✅ NE PAS TRANSFORMER LES ERREURS - Les laisser remonter telles quelles
      throw error;
    }
  }

  async createVerification(user: User): Promise<void> {
    try {
      logger.info(`🔐 [CREATE VERIFICATION] Début pour ${user.email}`);

      // Invalider les anciens codes
      await prisma.otpCode.updateMany({
        where: {
          userId: user.id,
          consumed: false
        },
        data: { consumed: true }
      });

      // Générer un nouveau code
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      logger.info(`📝 [CREATE VERIFICATION] Code généré pour ${user.email}`);

      // Créer l'OTP en base
      const otpCode = await prisma.otpCode.create({
        data: {
          code,
          purpose: 'EMAIL_VERIFICATION',
          expiresAt,
          consumed: false,
          userId: user.id,
        }
      });

      logger.info(`✅ [CREATE VERIFICATION] OTP créé: ${otpCode.id}`);

      if (!user.email) {
        throw new Error('User email is required for verification');
      }
      // ⚠️ POINT CRITIQUE : Envoyer l'email
      const emailSent = await this.emailService.sendVerificationCode(user.email, code);

      if (!emailSent) {
        logger.warn(`⚠️ [CREATE VERIFICATION] Email non envoyé (mode dev ou erreur silencieuse)`);
        // En mode dev, on continue quand même
        // En prod, vous pourriez vouloir throw une erreur
      }

      logger.info(`✅ [CREATE VERIFICATION] Terminé pour ${user.email}`);

    } catch (error: any) {
      logger.error(`❌ [CREATE VERIFICATION] Échec pour ${user.email}`, {
        userId: user.id,
        email: user.email,
        errorName: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack
      });

      // ✅ Laisser remonter l'erreur d'origine
      throw error;
    }
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async verifyOTP(email: string, code: string, purpose: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return false;

    const otp = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code,
        purpose: purpose as any,
        consumed: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otp) return false;

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumed: true }
    });

    return true;
  }
}

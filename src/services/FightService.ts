import { PrismaClient, Prisma, FightStatus, Winner, TransactionStatus, TransactionType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { EmailService } from './EmailService';
import {
  CreateDayEventDTO,
  CreateFightDTO,
  UpdateFightStatusDTO,
  ValidateFightResultDTO,
  ListFightsDTO,
  ListDayEventsDTO,
  UpdateDayEventDTO
} from '../dto/fight.dto';
import { BetService } from './BetService';
import { WebSocketService } from './WebSocketService';
import { NotificationService } from './NotificationService';
import logger from '../utils/logger';
import { addHours } from 'date-fns';

export class FightService {
  private readonly COMMISSION_PERCENTAGE = 10;
  private prisma: PrismaClient;
  private betService: BetService;
  private webSocketService?: WebSocketService;
  private notificationService?: NotificationService;
  private emailService: EmailService;

  constructor(
    prisma?: PrismaClient,
    betService?: BetService,
    webSocketService?: WebSocketService,
    emailService?: EmailService
  ) {
    this.prisma = prisma || new PrismaClient();
    // BetService constructor accepts optional WebSocketService
    if (betService) {
      this.betService = betService;
    } else if (webSocketService) {
      this.betService = new BetService(this.prisma, webSocketService);
    } else {
      // BetService requires WebSocketService - throw error if not provided
      throw new Error('FightService requires either betService or webSocketService');
    }
    this.webSocketService = webSocketService;
    this.emailService = emailService || new EmailService();
    // Initialize NotificationService for DB persistence + WebSocket
    if (webSocketService) {
      this.notificationService = new NotificationService(this.prisma, webSocketService);
    }
  }

  async requestFightValidationOTP(adminId: string, fightId: string) {
    try {
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId }
      });

      if (!admin || !admin.email) {
        throw new Error('Administrateur non trouvé ou sans email');
      }

      const fight = await this.prisma.fight.findUnique({
        where: { id: fightId }
      });

      if (!fight) {
        throw new Error('Combat non trouvé');
      }

      // Générer OTP (6 chiffres)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalider les anciens codes de validation pour cet admin
      await this.prisma.otpCode.updateMany({
        where: {
          userId: adminId,
          purpose: 'FIGHT_RESULT_VALIDATION',
          consumed: false
        },
        data: { consumed: true }
      });

      // Créer le nouveau code
      await this.prisma.otpCode.create({
        data: {
          code,
          purpose: 'FIGHT_RESULT_VALIDATION',
          expiresAt,
          userId: adminId
        }
      });

      // En DEV, logger le code pour faciliter les tests
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔓 [DEV] OTP Code pour validation:', code);
      }

      // Envoyer l'email
      try {
        await this.emailService.sendFightValidationOTP(admin.email, code, fight.title);
      } catch (e) {
        logger.warn('Erreur envoi email OTP (ignoré en dev):', e);
      }

      return { success: true, message: 'OTP envoyé avec succès' };
    } catch (error: any) {
      logger.error('Erreur lors de la demande d\'OTP de validation:', error);
      throw error;
    }
  }


  // ========== COMBATS INDIVIDUELS ==========


  async createFight(data: CreateFightDTO) {
    try {
      // Vérifier que les deux lutteurs existent et sont actifs
      const fighters = await this.prisma.fighter.findMany({
        where: {
          id: { in: [data.fighterAId, data.fighterBId] },
          status: 'ACTIVE'
        }
      });

      if (fighters.length !== 2) {
        throw new Error('Un ou plusieurs lutteurs sont invalides ou inactifs');
      }

      // Vérifier que les deux lutteurs sont différents
      if (data.fighterAId === data.fighterBId) {
        throw new Error('Un lutteur ne peut pas combattre contre lui-même');
      }

      const fight = await this.prisma.fight.create({
        data: {
          title: data.title,
          description: data.description,
          location: data.location,
          scheduledAt: new Date(data.scheduledAt),
          fighterAId: data.fighterAId,
          fighterBId: data.fighterBId,
          status: FightStatus.SCHEDULED
        },
        include: {
          fighterA: true,
          fighterB: true
        }
      });

      logger.info(`Combat créé: ${fight.id} - ${fight.title}`);
      return fight;
    } catch (error: any) {
      logger.error('Erreur lors de la création du combat:', error);
      throw error;
    }
  }

  async getFight(fightId: string) {
    try {
      const fight = await this.prisma.fight.findUnique({
        where: { id: fightId },
        include: {
          fighterA: true,
          fighterB: true,
          dayEvent: true,
          result: true,
          bets: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              },
              acceptor: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            },
            where: {
              OR: [
                { status: 'PENDING' },
                { status: 'ACCEPTED' }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        }
      });

      if (!fight) {
        throw new Error('Combat non trouvé');
      }

      return fight;
    } catch (error: any) {
      logger.error(`Erreur lors de la récupération du combat ${fightId}:`, error);
      throw error;
    }
  }

  async listFights(filters: ListFightsDTO) {
    try {
      const {
        status,
        fighterId,
        fromDate,
        toDate,
        limit = 20,
        offset = 0
      } = filters;

      const where: Prisma.FightWhereInput = {};

      if (status) {
        where.status = status as FightStatus;
      }

      if (fighterId) {
        where.OR = [
          { fighterAId: fighterId },
          { fighterBId: fighterId }
        ];
      }

      if (fromDate || toDate) {
        where.scheduledAt = {};
        if (fromDate) where.scheduledAt.gte = new Date(fromDate);
        if (toDate) where.scheduledAt.lte = new Date(toDate);
      }

      const [fights, total] = await Promise.all([
        this.prisma.fight.findMany({
          where,
          include: {
            fighterA: true,
            fighterB: true,
            dayEvent: true,
            result: true
          },
          take: limit,
          skip: offset,
          orderBy: { scheduledAt: 'desc' }
        }),
        this.prisma.fight.count({ where })
      ]);

      return {
        fights,
        total,
        limit,
        offset
      };
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des combats:', error);
      throw error;
    }
  }

  async getUpcomingFights(limit: number = 10) {
    try {
      const now = new Date();

      return await this.prisma.fight.findMany({
        where: {
          status: FightStatus.SCHEDULED,
          scheduledAt: { gt: now }
        },
        include: {
          fighterA: true,
          fighterB: true,
          dayEvent: true,
          _count: {
            select: {
              bets: true
            }
          }
        },
        take: limit,
        orderBy: { scheduledAt: 'asc' }
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des prochains combats:', error);
      throw error;
    }
  }

  async getPopularFights(limit: number = 10) {
    try {
      const now = new Date();

      return await this.prisma.fight.findMany({
        where: {
          status: FightStatus.SCHEDULED,
          scheduledAt: { gt: now }
        },
        include: {
          fighterA: true,
          fighterB: true,
          dayEvent: true,
          _count: {
            select: {
              bets: true
            }
          }
        },
        take: limit,
        orderBy: {
          bets: {
            _count: 'desc'
          }
        }
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des combats populaires:', error);
      throw error;
    }
  }

  async updateFightStatus(fightId: string, data: UpdateFightStatusDTO) {
    try {
      const fight = await this.prisma.fight.findUnique({
        where: { id: fightId },
        include: {
          fighterA: true,
          fighterB: true,
          dayEvent: true
        }
      });

      if (!fight) {
        throw new Error('Combat non trouvé');
      }

      // Validation des transitions de statut
      const validTransitions: Record<FightStatus, FightStatus[]> = {
        [FightStatus.SCHEDULED]: [FightStatus.ONGOING, FightStatus.CANCELLED, FightStatus.POSTPONED],
        [FightStatus.ONGOING]: [FightStatus.FINISHED, FightStatus.CANCELLED],
        [FightStatus.FINISHED]: [],
        [FightStatus.CANCELLED]: [],
        [FightStatus.POSTPONED]: [FightStatus.SCHEDULED, FightStatus.CANCELLED]
      };

      const currentStatus = fight.status as FightStatus;
      const newStatus = data.status as FightStatus;

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Transition de statut invalide: ${currentStatus} -> ${newStatus}`);
      }

      const updatedFight = await this.prisma.fight.update({
        where: { id: fightId },
        data: {
          status: newStatus,
          ...(newStatus === FightStatus.ONGOING && { startedAt: new Date() }),
          ...(newStatus === FightStatus.FINISHED && { endedAt: new Date() })
        },
        include: {
          fighterA: true,
          fighterB: true,
          dayEvent: true
        }
      });

      // Notifications
      let notificationMessage = '';
      let notificationTitle = '';

      switch (newStatus) {
        case FightStatus.ONGOING:
          notificationTitle = 'Combat en cours !';
          notificationMessage = `Le combat "${fight.title}" entre ${fight.fighterA.name} et ${fight.fighterB.name} a commencé !`;

          // Annuler et rembourser les paris en attente (car le combat a commencé)
          const pendingBets = await this.prisma.bet.findMany({
            where: {
              fightId: fightId,
              status: 'PENDING'
            },
            include: { creator: true }
          });

          if (pendingBets.length > 0) {
            logger.info(`Combat commencé : ${pendingBets.length} paris en attente à annuler.`);
            for (const bet of pendingBets) {
              try {
                await this.cancelPendingBet(bet);
                logger.info(`Pari en attente ${bet.id} annulé (début du combat)`);
              } catch (e) {
                logger.error(`Erreur annulation auto pari ${bet.id}:`, e);
              }
            }
          }
          break;
        case FightStatus.FINISHED:
          notificationTitle = 'Combat terminé';
          notificationMessage = `Le combat "${fight.title}" est terminé. Attendez les résultats.`;
          break;
        case FightStatus.CANCELLED:
          notificationTitle = 'Combat annulé';
          notificationMessage = `Le combat "${fight.title}" a été annulé.`;
          await this.refundAllBetsForFight(fightId);
          break;
      }

      if (notificationMessage) {
        await this.notifyFightParticipants(fightId, 'FIGHT_STATUS_CHANGE', notificationMessage);
      }

      // Notification WebSocket
      if (this.webSocketService && this.webSocketService.isInitialized()) {
        this.webSocketService.broadcastFightUpdate(fightId, {
          fightId: fightId,
          status: newStatus as any,
          timestamp: new Date().toISOString()
        });
      }

      logger.info(`Statut du combat mis à jour: ${fightId} -> ${newStatus}`);
      return updatedFight;
    } catch (error: any) {
      logger.error(`Erreur lors de la mise à jour du statut du combat ${fightId}:`, error);
      throw error;
    }
  }

  async validateFightResult(adminId: string, data: ValidateFightResultDTO) {
    try {
      logger.info(`Validation du résultat pour le combat ${data.fightId}, winner: ${data.winner}`);

      // 0. Vérifier la sécurité (Mot de passe et OTP)
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId }
      });

      if (!admin) {
        throw new Error('Administrateur non trouvé');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(data.password, admin.password);
      if (!isPasswordValid) {
        throw new Error('Mot de passe administrateur incorrect');
      }

      // Vérifier l'OTP
      const otp = await this.prisma.otpCode.findFirst({
        where: {
          userId: adminId,
          code: data.otpCode,
          purpose: 'FIGHT_RESULT_VALIDATION',
          consumed: false,
          expiresAt: { gt: new Date() }
        }
      });

      if (!otp) {
        throw new Error('Code OTP invalide ou expiré');
      }

      // Marquer l'OTP comme consommé
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumed: true, consumedAt: new Date() }
      });

      // 1. Valider le combat
      const fight = await this.prisma.fight.findUnique({
        where: { id: data.fightId },
        include: {
          fighterA: true,
          fighterB: true,
          result: true
        }
      });

      if (!fight) {
        throw new Error('Combat non trouvé');
      }

      if (fight.status !== FightStatus.FINISHED) {
        throw new Error('Le combat doit être terminé avant de valider le résultat');
      }

      if (fight.result) {
        throw new Error('Résultat déjà validé pour ce combat');
      }

      // 2. Créer le résultat
      const result = await this.prisma.$transaction(async (prisma) => {
        return await prisma.fightResult.create({
          data: {
            fightId: data.fightId,
            winner: data.winner as Winner,
            victoryMethod: data.victoryMethod,
            round: data.round,
            duration: data.duration ? parseInt(data.duration) : null,
            notes: data.notes,
            validatedAt: new Date(),
            adminId
          }
        });
      }, {
        maxWait: 10000,
        timeout: 15000
      });

      // 3. Récupérer les paris
      const bets = await this.prisma.bet.findMany({
        where: {
          fightId: data.fightId,
          status: 'ACCEPTED'
        },
        include: {
          creator: true,
          acceptor: true
        }
      });

      logger.info(`${bets.length} paris à traiter pour le combat ${data.fightId}`);

      // 4. Traiter chaque pari
      let settledCount = 0;
      const errors: string[] = [];

      for (const bet of bets) {
        try {
          logger.info(`Traitement du pari ${bet.id}, montant: ${bet.amount}`);

          // Traiter le pari directement
          await this.processSingleBet(bet, data.winner as 'A' | 'B' | 'DRAW');
          settledCount++;
          logger.info(`Pari ${bet.id} traité avec succès`);

        } catch (error: any) {
          const errorMsg = `Pari ${bet.id}: ${error.message}`;
          errors.push(errorMsg);
          logger.error(errorMsg, error);
        }
      }

      // 5. Mettre à jour les statistiques des lutteurs
      await this.updateFighterStatsAfterSettlement(fight, data.winner);

      // 6. Annuler et rembourser les paris en attente (non acceptés)
      const pendingBets = await this.prisma.bet.findMany({
        where: {
          fightId: data.fightId,
          status: 'PENDING'
        },
        include: {
          creator: true
        }
      });

      logger.info(`${pendingBets.length} paris en attente à annuler pour le combat ${data.fightId}`);

      let cancelledCount = 0;
      for (const bet of pendingBets) {
        try {
          await this.cancelPendingBet(bet);
          cancelledCount++;
          logger.info(`Pari en attente ${bet.id} annulé et remboursé`);
        } catch (error: any) {
          logger.error(`Erreur annulation pari en attente ${bet.id}:`, error);
          // On continue pour traiter les autres
        }
      }

      logger.info(`Annulation terminée: ${cancelledCount}/${pendingBets.length} paris en attente traités`);

      // 7. Notification WebSocket pour le résultat
      if (this.webSocketService && this.webSocketService.isInitialized()) {
        this.webSocketService.broadcastSystemAlert({
          type: 'FIGHT_RESULT',
          title: 'Résultat de combat !',
          message: `Le résultat du combat "${fight.title}" a été validé.`,
          severity: 'INFO',
          data: {
            fightId: data.fightId,
            winner: data.winner,
            victoryMethod: data.victoryMethod
          }
        });
      }

      return {
        success: true,
        result,
        settledBets: settledCount,
        totalBets: bets.length,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error: any) {
      logger.error('Erreur lors de la validation du résultat:', error);
      throw error;
    }
  }

  private async processSingleBet(bet: any, winner: 'A' | 'B' | 'DRAW'): Promise<void> {
    try {
      if (winner === 'DRAW') {
        await this.handleDrawBet(bet);
      } else {
        await this.handleWinnerBet(bet, winner);
      }
    } catch (error: any) {
      logger.error(`Erreur traitement pari ${bet.id}:`, error);
      throw error;
    }
  }

  private async cancelPendingBet(bet: any): Promise<void> {
    try {
      const betAmountBigInt = BigInt(Math.floor(Number(bet.amount)));

      await this.prisma.$transaction(async (tx) => {
        // Rembourser le créateur
        await tx.wallet.update({
          where: { userId: bet.creatorId },
          data: {
            balance: { increment: betAmountBigInt },
            lockedBalance: { decrement: betAmountBigInt }
          }
        });

        // Mettre à jour le statut du pari
        await tx.bet.update({
          where: { id: bet.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date()
          }
        });

        // Historique transaction
        await tx.transaction.create({
          data: {
            type: TransactionType.BET_REFUND,
            amount: betAmountBigInt,
            userId: bet.creatorId,
            status: TransactionStatus.CONFIRMED,
            notes: `Remboursement fin de combat - Pari ${bet.id}`
          }
        });

        // Notification DB
        await tx.notification.create({
          data: {
            userId: bet.creatorId,
            type: 'BET_CANCELLED' as any,
            title: 'Pari annulé et remboursé',
            message: `Votre pari de ${bet.amount} F a été annulé car le combat est terminé sans avoir été accepté.`,
          }
        });
      });

      // Notification (sauvegarde DB + WebSocket)
      if (this.notificationService) {
        try {
          await this.notificationService.sendNotification({
            userId: bet.creatorId,
            type: 'BET_CANCELLED' as any,
            title: 'Pari remboursé',
            message: `Votre pari de ${bet.amount} F a été annulé (combat terminé).`,
            data: { betId: bet.id, reason: 'FIGHT_FINISHED' }
          });
        } catch (wsError) {
          logger.warn(`Erreur envoi notif pour pari ${bet.id}:`, wsError);
        }
      }

    } catch (error: any) {
      logger.error(`Erreur cancelPendingBet pour pari ${bet.id}:`, error);
      throw error;
    }
  }


  // Remplacez les méthodes handleWinnerBet et handleDrawBet par celles-ci :

  // Remplacez les méthodes handleWinnerBet et handleDrawBet par celles-ci :

  private async handleDrawBet(bet: any): Promise<void> {
    try {
      const betAmount = Number(bet.amount);
      const betAmountBigInt = BigInt(Math.floor(betAmount));

      // Mettre à jour le créateur
      await this.prisma.wallet.update({
        where: { userId: bet.creatorId },
        data: {
          balance: { increment: betAmountBigInt },
          lockedBalance: { decrement: betAmountBigInt }
        }
      });

      // Transaction pour créateur
      await this.prisma.transaction.create({
        data: {
          type: TransactionType.BET_REFUND,
          amount: betAmountBigInt,
          userId: bet.creatorId,
          status: TransactionStatus.CONFIRMED,
          notes: `Remboursement match nul - Pari ${bet.id}`
        }
      });

      // Même chose pour l'accepteur si présent
      if (bet.acceptorId) {
        await this.prisma.wallet.update({
          where: { userId: bet.acceptorId },
          data: {
            balance: { increment: betAmountBigInt },
            lockedBalance: { decrement: betAmountBigInt }
          }
        });

        await this.prisma.transaction.create({
          data: {
            type: TransactionType.BET_REFUND,
            amount: betAmountBigInt,
            userId: bet.acceptorId,
            status: TransactionStatus.CONFIRMED,
            notes: `Remboursement match nul - Pari ${bet.id}`
          }
        });

        // Notification pour l'accepteur (sauvegarde DB + WebSocket)
        if (this.notificationService) {
          await this.notificationService.sendNotification({
            userId: bet.acceptorId,
            type: 'BET_REFUNDED' as any,
            title: 'Pari remboursé',
            message: `Votre pari de ${betAmount} F sur le combat a été remboursé (match nul).`,
            data: { betId: bet.id, reason: 'DRAW' }
          });
        }
      }

      // Notification pour le créateur (sauvegarde DB + WebSocket)
      if (this.notificationService) {
        await this.notificationService.sendNotification({
          userId: bet.creatorId,
          type: 'BET_REFUNDED' as any,
          title: 'Pari remboursé',
          message: `Votre pari de ${betAmount} F sur le combat a été remboursé (match nul).`,
          data: { betId: bet.id, reason: 'DRAW' }
        });
      }

      // Mettre à jour le pari
      await this.prisma.bet.update({
        where: { id: bet.id },
        data: {
          status: 'REFUNDED',
          settledAt: new Date()
        }
      });

      logger.info(`Pari ${bet.id} remboursé (match nul)`);
    } catch (error: any) {
      logger.error(`Erreur handleDrawBet pour pari ${bet.id}:`, error);
      throw error;
    }
  }

  private async handleWinnerBet(bet: any, winner: 'A' | 'B'): Promise<void> {
    try {
      const isCreatorWinner = bet.chosenFighter === winner;
      const winnerId = isCreatorWinner ? bet.creatorId : bet.acceptorId;
      const loserId = isCreatorWinner ? bet.acceptorId : bet.creatorId;

      if (!winnerId) {
        throw new Error('Gagnant non trouvé');
      }

      const betAmount = Number(bet.amount);
      const totalPot = betAmount * 2;
      const commission = totalPot * (this.COMMISSION_PERCENTAGE / 100);
      const winAmount = totalPot - commission;

      const betAmountBigInt = BigInt(Math.floor(betAmount));
      const winAmountBigInt = BigInt(Math.floor(winAmount));
      const commissionBigInt = BigInt(Math.floor(commission));

      logger.info(`Traitement gain - Pari: ${bet.id}, Gagnant: ${winnerId}, Montant: ${winAmount}, Commission: ${commission}`);

      // Mettre à jour le perdant
      if (loserId) {
        await this.prisma.wallet.update({
          where: { userId: loserId },
          data: {
            lockedBalance: { decrement: betAmountBigInt },
            totalLost: { increment: betAmountBigInt }
          }
        });
        logger.info(`Wallet perdant ${loserId} mis à jour`);
      }

      // Mettre à jour le gagnant
      await this.prisma.wallet.update({
        where: { userId: winnerId },
        data: {
          balance: { increment: winAmountBigInt },
          lockedBalance: { decrement: betAmountBigInt },
          totalWon: { increment: winAmountBigInt }
        }
      });
      logger.info(`Wallet gagnant ${winnerId} mis à jour`);

      logger.info(`Wallet gagnant ${winnerId} mis à jour`);

      // Notification pour le gagnant (sauvegarde DB + WebSocket)
      if (this.notificationService) {
        await this.notificationService.sendNotification({
          userId: winnerId,
          type: 'BET_WON' as any,  // NotificationType.BET_WON si l'enum l'a
          title: 'Vous avez gagné !',
          message: `Félicitations ! Vous avez remporté ${winAmount} F sur votre pari.`,
          data: { betId: bet.id, amount: winAmount }
        });
      }

      // Envoi explicite de l'événement BET_WON pour mise à jour structurée
      if (this.webSocketService && this.webSocketService.isInitialized()) {
        this.webSocketService.broadcastBetUpdate({
          betId: bet.id,
          fightId: bet.fightId,
          userId: winnerId,
          amount: betAmount,
          chosenFighter: bet.chosenFighter,
          status: 'WON',
          timestamp: new Date().toISOString()
        });
      }

      // Notification pour le perdant (sauvegarde DB + WebSocket)
      if (loserId && this.notificationService) {
        await this.notificationService.sendNotification({
          userId: loserId,
          type: 'BET_LOST' as any,
          title: 'Pari perdu',
          message: `Désolé, votre pari de ${betAmount} F est perdant.`,
          data: { betId: bet.id }
        });
      }

      // Envoi explicite de l'événement BET_LOST
      if (loserId && this.webSocketService && this.webSocketService.isInitialized()) {
        this.webSocketService.broadcastBetUpdate({
          betId: bet.id,
          fightId: bet.fightId,
          userId: loserId,
          amount: betAmount,
          chosenFighter: bet.chosenFighter,
          status: 'LOST',
          timestamp: new Date().toISOString()
        });
      }

      // Créer la transaction de gain
      const winTransaction = await this.prisma.transaction.create({
        data: {
          type: TransactionType.BET_WIN,
          amount: winAmountBigInt,
          userId: winnerId,
          status: TransactionStatus.CONFIRMED,
          notes: `Gain du pari ${bet.id}`
        }
      });
      logger.info(`Transaction de gain créée: ${winTransaction.id}`);

      // Créer la transaction de commission (nécessaire pour le modèle Commission)
      const commissionTransaction = await this.prisma.transaction.create({
        data: {
          type: TransactionType.COMMISSION,
          amount: commissionBigInt,
          userId: 'system', // ID système pour les commissions
          status: TransactionStatus.CONFIRMED,
          notes: `Commission sur pari ${bet.id}`
        }
      });
      logger.info(`Transaction de commission créée: ${commissionTransaction.id}`);

      // Enregistrer la commission dans le modèle Commission
      await this.prisma.commission.create({
        data: {
          betId: bet.id,
          amount: commissionBigInt,
          type: 'BET',
          percentage: this.COMMISSION_PERCENTAGE,
          transactionId: commissionTransaction.id
        }
      });
      logger.info(`Commission enregistrée: ${commission} (${this.COMMISSION_PERCENTAGE}%)`);

      // Créer le winning
      await this.prisma.winning.create({
        data: {
          userId: winnerId,
          betId: bet.id,
          amount: BigInt(Math.floor(totalPot)),
          netAmount: winAmountBigInt,
          commission: commissionBigInt,
          transactionId: winTransaction.id
        }
      });
      logger.info(`Winning créé pour l'utilisateur ${winnerId}`);

      // Mettre à jour le pari
      await this.prisma.bet.update({
        where: { id: bet.id },
        data: {
          status: isCreatorWinner ? 'WON' : 'LOST',
          actualWin: winAmountBigInt,
          settledAt: new Date()
        }
      });
      logger.info(`Pari ${bet.id} marqué comme réglé (${isCreatorWinner ? 'Créateur gagnant' : 'Accepteur gagnant'})`);

    } catch (error: any) {
      logger.error(`Erreur handleWinnerBet pour pari ${bet.id}:`, error);
      throw error;
    }
  }
  private async updateFighterStatsAfterSettlement(fight: any, winner: string): Promise<void> {
    try {
      if (winner === Winner.A) {
        await this.prisma.fighter.update({
          where: { id: fight.fighterAId },
          data: {
            wins: { increment: 1 },
            totalFights: { increment: 1 }
          }
        });
        await this.prisma.fighter.update({
          where: { id: fight.fighterBId },
          data: {
            losses: { increment: 1 },
            totalFights: { increment: 1 }
          }
        });
      } else if (winner === Winner.B) {
        await this.prisma.fighter.update({
          where: { id: fight.fighterBId },
          data: {
            wins: { increment: 1 },
            totalFights: { increment: 1 }
          }
        });
        await this.prisma.fighter.update({
          where: { id: fight.fighterAId },
          data: {
            losses: { increment: 1 },
            totalFights: { increment: 1 }
          }
        });
      } else if (winner === Winner.DRAW) {
        await this.prisma.fighter.update({
          where: { id: fight.fighterAId },
          data: {
            draws: { increment: 1 },
            totalFights: { increment: 1 }
          }
        });
        await this.prisma.fighter.update({
          where: { id: fight.fighterBId },
          data: {
            draws: { increment: 1 },
            totalFights: { increment: 1 }
          }
        });
      }
    } catch (error: any) {
      logger.error(`Erreur lors de la mise à jour des statistiques des lutteurs:`, error);
    }
  }

  async updateFight(fightId: string, data: UpdateDayEventDTO & { order?: number; scheduledTime?: string }) {
    try {
      const fight = await this.prisma.fight.findUnique({
        where: { id: fightId }
      });

      if (!fight) {
        throw new Error('Combat non trouvé');
      }

      const updatedFight = await this.prisma.fight.update({
        where: { id: fightId },
        data: {
          ...(data.order && { order: data.order }),
          ...(data.scheduledTime && { scheduledAt: new Date(data.scheduledTime) })
          // Note: fighterAId and fighterBId are not in UpdateDayEventDTO
        },
        include: {
          fighterA: true,
          fighterB: true,
          dayEvent: true
        }
      });

      logger.info(`Combat mis à jour: ${fightId}`);
      return updatedFight;
    } catch (error: any) {
      logger.error(`Erreur lors de la mise à jour du combat ${fightId}:`, error);
      throw error;
    }
  }

  async deleteFight(fightId: string) {
    try {
      const fight = await this.prisma.fight.findUnique({
        where: { id: fightId }
      });

      if (!fight) {
        throw new Error('Combat non trouvé');
      }

      // Rembourser tous les paris avant suppression
      await this.refundAllBetsForFight(fightId);

      await this.prisma.fight.delete({
        where: { id: fightId }
      });

      logger.info(`Combat supprimé: ${fightId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Erreur lors de la suppression du combat ${fightId}:`, error);
      throw error;
    }
  }

  // ========== JOURNÉES DE LUTTE ==========

  async createDayEvent(data: CreateDayEventDTO) {
    try {
      // Validation pour 5 combats
      if (!data.fights || data.fights.length !== 5) {
        throw new Error('Une journée de lutte doit avoir exactement 5 combats');
      }

      const fighterIds = data.fights.flatMap(f => [f.fighterAId, f.fighterBId]);
      const uniqueFighters = new Set(fighterIds);

      if (uniqueFighters.size !== 10) {
        throw new Error('Chaque lutteur ne doit combattre qu\'une seule fois dans la journée (10 lutteurs attendus)');
      }

      const eventDate = new Date(data.date);
      const now = new Date();

      if (eventDate <= now) {
        throw new Error('La date de la journée doit être dans le futur');
      }

      const orders = data.fights.map(f => f.order);
      const uniqueOrders = new Set(orders);
      if (uniqueOrders.size !== 5 || Math.min(...orders) !== 1 || Math.max(...orders) !== 5) {
        throw new Error('Les combats doivent être numérotés de 1 à 5 sans répétition');
      }

      // 1. Créez la journée
      const dayEvent = await this.prisma.dayEvent.create({
        data: {
          title: data.title,
          slug: this.generateSlug(data.title),
          date: eventDate,
          location: data.location,
          description: data.description,
          bannerImage: data.bannerImage,
          status: 'SCHEDULED',
          isFeatured: data.isFeatured || false
        }
      });

      // 2. Créez les combats un par un
      const fights = [];
      for (const fightData of data.fights) {
        // Heure simple basée sur l'ordre
        const fightDateTime = new Date(eventDate);
        const baseHour = 20;
        const hourIncrement = fightData.order - 1; // 20:00, 21:00, 22:00...
        fightDateTime.setHours(baseHour + hourIncrement, 0, 0, 0);

        const fight = await this.prisma.fight.create({
          data: {
            dayEventId: dayEvent.id,
            fighterAId: fightData.fighterAId,
            fighterBId: fightData.fighterBId,
            title: `Combat ${fightData.order}`,
            location: data.location,
            order: fightData.order,
            scheduledAt: fightDateTime,
            status: FightStatus.SCHEDULED
          },
          include: {
            fighterA: true,
            fighterB: true
          }
        });
        fights.push(fight);
      }

      logger.info(`Journée créée: ${dayEvent.id} - ${dayEvent.title}`);
      return { ...dayEvent, fights };

    } catch (error: any) {
      logger.error('Erreur lors de la création de la journée:', error);
      throw error;
    }
  }

  async getDayEvent(eventId: string) {
    try {
      const dayEvent = await this.prisma.dayEvent.findUnique({
        where: { id: eventId },
        include: {
          fights: {
            include: {
              fighterA: true,
              fighterB: true,
              result: true,
              _count: {
                select: {
                  bets: {
                    where: {
                      OR: [
                        { status: 'PENDING' },
                        { status: 'ACCEPTED' }
                      ]
                    }
                  }
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!dayEvent) {
        throw new Error('Journée non trouvée');
      }

      return dayEvent;
    } catch (error: any) {
      logger.error(`Erreur lors de la récupération de la journée ${eventId}:`, error);
      throw error;
    }
  }

  async listDayEvents(filters: ListDayEventsDTO) {
    try {
      const { status, fromDate, toDate, limit = 20, offset = 0 } = filters;

      const where: Prisma.DayEventWhereInput = {};

      if (status) {
        where.status = status as any;
      }

      if (fromDate || toDate) {
        where.date = {};
        if (fromDate) where.date.gte = new Date(fromDate);
        if (toDate) where.date.lte = new Date(toDate);
      }

      const [events, total] = await Promise.all([
        this.prisma.dayEvent.findMany({
          where,
          include: {
            fights: {
              include: {
                fighterA: true,
                fighterB: true
              },
              orderBy: { order: 'asc' }
            },
            _count: {
              select: {
                fights: true
              }
            }
          },
          take: limit,
          skip: offset,
          orderBy: { date: 'desc' }
        }),
        this.prisma.dayEvent.count({ where })
      ]);

      return {
        events,
        total,
        limit,
        offset
      };
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des journées:', error);
      throw error;
    }
  }

  async getUpcomingDayEvents(limit: number = 10) {
    try {
      const now = new Date();

      return await this.prisma.dayEvent.findMany({
        where: {
          status: 'SCHEDULED',
          date: { gt: now }
        },
        include: {
          fights: {
            include: {
              fighterA: true,
              fighterB: true
            },
            orderBy: { order: 'asc' }
          }
        },
        take: limit,
        orderBy: { date: 'asc' }
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des journées à venir:', error);
      throw error;
    }
  }

  async getCurrentDayEvent() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await this.prisma.dayEvent.findFirst({
        where: {
          date: {
            gte: today,
            lt: tomorrow
          },
          status: 'SCHEDULED'
        },
        include: {
          fights: {
            include: {
              fighterA: true,
              fighterB: true,
              result: true,
              _count: {
                select: {
                  bets: {
                    where: {
                      OR: [
                        { status: 'PENDING' },
                        { status: 'ACCEPTED' }
                      ]
                    }
                  }
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });
    } catch (error: any) {
      logger.error('Erreur lors de la récupération de la journée actuelle:', error);
      throw error;
    }
  }

  async updateDayEvent(eventId: string, data: UpdateDayEventDTO) {
    try {
      const dayEvent = await this.prisma.dayEvent.findUnique({
        where: { id: eventId }
      });

      if (!dayEvent) {
        throw new Error('Journée non trouvée');
      }

      const updatedEvent = await this.prisma.dayEvent.update({
        where: { id: eventId },
        data: {
          title: data.title,
          date: data.date ? new Date(data.date) : undefined,
          location: data.location,
          description: data.description,
          bannerImage: data.bannerImage,
          isFeatured: data.isFeatured,
          status: data.status as any
        },
        include: {
          fights: {
            include: {
              fighterA: true,
              fighterB: true
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      logger.info(`Journée mise à jour: ${eventId}`);
      return updatedEvent;
    } catch (error: any) {
      logger.error(`Erreur lors de la mise à jour de la journée ${eventId}:`, error);
      throw error;
    }
  }

  async deleteDayEvent(eventId: string) {
    try {
      const dayEvent = await this.prisma.dayEvent.findUnique({
        where: { id: eventId },
        include: {
          fights: {
            include: {
              bets: {
                where: {
                  OR: [
                    { status: 'PENDING' },
                    { status: 'ACCEPTED' }
                  ]
                }
              }
            }
          }
        }
      });

      if (!dayEvent) {
        throw new Error('Journée non trouvée');
      }

      // Rembourser tous les paris de tous les combats de la journée
      for (const fight of dayEvent.fights) {
        for (const bet of fight.bets) {
          await this.betService.cancelBet(bet.id, bet.creatorId, true);
        }
      }

      await this.prisma.dayEvent.delete({
        where: { id: eventId }
      });

      logger.info(`Journée supprimée: ${eventId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Erreur lors de la suppression de la journée ${eventId}:`, error);
      throw error;
    }
  }

  async expirePastFights(): Promise<number> {
    try {
      const now = new Date();
      const twentyFourHoursAgo = addHours(now, -24);

      const expiredFights = await this.prisma.fight.findMany({
        where: {
          status: FightStatus.FINISHED,
          result: null,
          OR: [
            { startedAt: { lt: twentyFourHoursAgo } },
            {
              dayEvent: {
                date: { lt: twentyFourHoursAgo }
              }
            }
          ]
        },
        include: {
          bets: {
            where: { status: 'ACCEPTED' }
          }
        }
      });

      let expiredCount = 0;

      for (const fight of expiredFights) {
        await this.prisma.fightResult.create({
          data: {
            fightId: fight.id,
            winner: Winner.DRAW,
            victoryMethod: 'EXPIRED',
            notes: 'Résultat automatique après 24h sans validation',
            validatedAt: now,
            adminId: 'system'
          }
        });

        for (const bet of fight.bets) {
          await this.betService.settleBet(bet.id, Winner.DRAW);
        }

        expiredCount++;
        logger.info(`Combat expiré: ${fight.id} - Match nul automatique`);
      }

      return expiredCount;
    } catch (error: any) {
      logger.error('Erreur lors de l\'expiration des combats:', error);
      throw error;
    }
  }

  // ========== MÉTHODES PRIVÉES ==========

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }

  private async refundAllBetsForFight(fightId: string): Promise<void> {
    try {
      const bets = await this.prisma.bet.findMany({
        where: {
          fightId: fightId,
          status: { in: ['PENDING', 'ACCEPTED'] }
        }
      });

      for (const bet of bets) {
        await this.betService.cancelBet(bet.id, bet.creatorId, true);
      }
    } catch (error: any) {
      logger.error(`Erreur lors du remboursement des paris du combat ${fightId}:`, error);
      throw error;
    }
  }

  private async notifyAllUsers(type: string, title: string, message: string) {
    try {
      logger.info(`Notification globale: ${title} - ${message}`);
      // Implémentez ici la logique de notification (email, push, etc.)
    } catch (error: any) {
      logger.error('Erreur lors de la notification globale:', error);
    }
  }

  private async notifyFightParticipants(fightId: string, type: string, message: string) {
    try {
      const bets = await this.prisma.bet.findMany({
        where: { fightId },
        select: { creatorId: true, acceptorId: true },
        distinct: ['creatorId', 'acceptorId']
      });

      const userIds = new Set<string>();
      bets.forEach(bet => {
        if (bet.creatorId) userIds.add(bet.creatorId);
        if (bet.acceptorId) userIds.add(bet.acceptorId);
      });

      // Créer des notifications pour tous les utilisateurs concernés
      const notifications = Array.from(userIds).map(userId =>
        this.prisma.notification.create({
          data: {
            userId,
            type: type as any,
            title: 'Mise à jour combat',
            message
          }
        })
      );

      await Promise.all(notifications);

      // Notification WebSocket pour chaque utilisateur
      if (this.webSocketService && this.webSocketService.isInitialized()) {
        userIds.forEach(userId => {
          this.webSocketService!.broadcastNotification({
            type: 'FIGHT_FINISHED', // Défaut, on peut ajuster selon 'type'
            title: 'Mise à jour combat',
            message,
            timestamp: new Date().toISOString()
          }, userId);
        });
      }
    } catch (error: any) {
      logger.error(`Erreur lors de la notification des participants du combat ${fightId}:`, error);
    }
  }
}
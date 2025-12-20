import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { addMinutes, addHours, isBefore } from 'date-fns';
import logger from '../utils/logger';

@Service()
export class CleanupService {
  constructor(private prisma: PrismaClient) {
    this.setupCronJobs();
  }

  private setupCronJobs() {
    // Toutes les 5 minutes : expirer les fenêtres d'annulation
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.expireCancellationWindows();
      } catch (error) {
        logger.error('Error in cancellation window cleanup:', error);
      }
    });

    // Toutes les heures : expirer les paris non acceptés
    cron.schedule('0 * * * *', async () => {
      try {
        await this.expirePendingBets();
      } catch (error) {
        logger.error('Error in pending bets cleanup:', error);
      }
    });

    // Tous les jours à minuit : nettoyer les anciennes sessions
    cron.schedule('0 0 * * *', async () => {
      try {
        await this.cleanupOldSessions();
        await this.cleanupOldNotifications();
        await this.cleanupOldAuditLogs();
      } catch (error) {
        logger.error('Error in daily cleanup:', error);
      }
    });

    logger.info('Cron jobs initialized for cleanup service');
  }

  async expireCancellationWindows() {
    const now = new Date();
    const twentyMinutesAgo = addMinutes(now, -20);

    // Trouver les paris avec fenêtre d'annulation expirée
    const bets = await this.prisma.bet.findMany({
      where: {
        status: 'PENDING',
        canCancelUntil: {
          lt: now,
          not: null
        }
      },
      include: {
        creator: true
      }
    });

    let updatedCount = 0;

    for (const bet of bets) {
      // Marquer la fenêtre comme expirée
      await this.prisma.bet.update({
        where: { id: bet.id },
        data: { canCancelUntil: null }
      });

      // Note: Notification type CANCELLATION_WINDOW_EXPIRED not in schema, using SYSTEM_MAINTENANCE
      // TODO: Add CANCELLATION_WINDOW_EXPIRED to NotificationType enum if needed
      logger.info(`Cancellation window expired for bet ${bet.id}`);

      updatedCount++;
    }

    if (updatedCount > 0) {
      logger.info(`Expired cancellation windows for ${updatedCount} bets`);
    }

    return updatedCount;
  }

  async expirePendingBets() {
    const now = new Date();

    // Trouver les combats qui vont bientôt commencer
    const upcomingFights = await this.prisma.fight.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: addHours(now, 1), // Commence dans moins d'une heure
          gt: now
        }
      },
      include: {
        bets: {
          where: {
            status: 'PENDING'
          }
        }
      }
    });

    let expiredCount = 0;

    for (const fight of upcomingFights) {
      for (const bet of fight.bets) {
        // Libérer les fonds bloqués
        await this.prisma.wallet.update({
          where: { userId: bet.creatorId },
          data: { lockedBalance: { decrement: BigInt(bet.amount.toString()) } }
        });

        // Marquer comme annulé (EXPIRED n'existe pas dans BetStatus)
        await this.prisma.bet.update({
          where: { id: bet.id },
          data: {
            status: 'CANCELLED',
            canCancelUntil: null,
            cancelReason: 'Pari non accepté avant le début du combat'
          }
        });

        // Note: BET_EXPIRED not in NotificationType, using BET_REFUNDED
        await this.prisma.notification.create({
          data: {
            userId: bet.creatorId,
            type: 'BET_REFUNDED',
            title: 'Pari expiré',
            message: `Votre pari sur "${fight.title}" a expiré car il n'a pas été accepté avant le combat.`,
          }
        });

        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info(`Expired ${expiredCount} pending bets before fights`);
    }

    return expiredCount;
  }

  async cleanupOldSessions() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { updatedAt: { lt: thirtyDaysAgo } }
        ]
      }
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} old sessions`);
    }

    return result.count;
  }

  async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        isRead: true
      }
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} old notifications`);
    }

    return result.count;
  }

  async cleanupOldAuditLogs() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo }
      }
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} old audit logs`);
    }

    return result.count;
  }

  async cleanupExpiredOTPs() {
    const result = await this.prisma.otpCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired OTPs`);
    }

    return result.count;
  }

  async getCleanupStats() {
    const now = new Date();

    const stats = await this.prisma.$queryRaw<Array<{
      pending_cancellation_bets: bigint;
      expired_pending_bets: bigint;
      expired_sessions: bigint;
      old_notifications: bigint;
      old_audit_logs: bigint;
      expired_otps: bigint;
    }>>`
      SELECT 
        (SELECT COUNT(*) FROM bets WHERE status = 'PENDING' AND canCancelUntil < NOW()) as pending_cancellation_bets,
        (SELECT COUNT(*) FROM bets WHERE status = 'PENDING' AND expiresAt < NOW()) as expired_pending_bets,
        (SELECT COUNT(*) FROM sessions WHERE expiresAt < NOW() OR updatedAt < NOW() - INTERVAL '30 days') as expired_sessions,
        (SELECT COUNT(*) FROM notifications WHERE createdAt < NOW() - INTERVAL '30 days' AND isRead = true) as old_notifications,
        (SELECT COUNT(*) FROM audit_logs WHERE createdAt < NOW() - INTERVAL '90 days') as old_audit_logs,
        (SELECT COUNT(*) FROM otp_codes WHERE expiresAt < NOW()) as expired_otps
    `;

    return stats[0];
  }
}
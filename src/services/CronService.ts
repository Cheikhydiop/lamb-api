import { Service, Container } from 'typedi';
import cron from 'node-cron';
import { PrismaClient, TransactionStatus } from '@prisma/client';
import logger from '../utils/logger';
import { WebSocketService } from './WebSocketService';
import { addMinutes, isBefore } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';

@Service()
export class CronService {
    private prisma: PrismaClient;
    private webSocketService: WebSocketService;

    constructor() {
        this.prisma = Container.get(PrismaClient);
        this.webSocketService = Container.get(WebSocketService);
    }

    public init() {
        logger.info('Initializing Cron Service...');

        // Run every minute
        cron.schedule('* * * * *', async () => {
            try {
                await this.handleExpiredBets();
            } catch (error) {
                logger.error('Error in cron job:', error);
            }
        });

        logger.info('Cron Service initialized');
    }

    /**
     * Cancel pending bets for fights that are starting soon (< 30 mins) or have started
     */
    private async handleExpiredBets() {
        const now = new Date();
        const thirtyMinutesFromNow = addMinutes(now, 30);

        // Find bets that are PENDING and associated with fights that are starting soon or started
        // Actually, we should cancel bets if the fight is less than 30 mins away, because they can't be accepted anymore.

        // 1. Find fights that are starting within the next 30 mins or have passed
        // We look for bets directly to avoid complex fight queries if no bets exist
        const expiredBets = await this.prisma.bet.findMany({
            where: {
                status: 'PENDING',
                fight: {
                    OR: [
                        { scheduledAt: { lte: thirtyMinutesFromNow } }, // Fight scheduled <= 30 mins from now (includes past)
                    ]
                }
            },
            include: {
                fight: true,
                creator: true
            },
            take: 50 // Process in batches to avoid overwhelming
        });

        if (expiredBets.length === 0) return;

        logger.info(`Found ${expiredBets.length} expired pending bets to cancel`);

        for (const bet of expiredBets) {
            try {
                await this.cancelExpiredBet(bet.id, bet.creatorId, bet.amount as unknown as Decimal);
            } catch (error) {
                logger.error(`Failed to cancel expired bet ${bet.id}:`, error);
            }
        }
    }

    private async cancelExpiredBet(betId: string, creatorId: string, amount: Decimal) {
        await this.prisma.$transaction(async (tx) => {
            // 1. Update bet status
            const bet = await tx.bet.update({
                where: { id: betId },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date()
                }
            });

            // 2. Refund creator
            const amountBigInt = BigInt(Math.floor(Number(amount)));
            await tx.wallet.update({
                where: { userId: creatorId },
                data: {
                    balance: { increment: amountBigInt },
                    lockedBalance: { decrement: amountBigInt }
                }
            });

            // 3. Create refund transaction
            await tx.transaction.create({
                data: {
                    type: 'BET_REFUND',
                    amount: Number(amount),
                    userId: creatorId,
                    status: TransactionStatus.CONFIRMED, // Use Enum
                    notes: `Expiration du pari ${betId} (début du combat)`
                }
            });

            // 4. Notify user via WS
            if (this.webSocketService) {
                this.webSocketService.broadcastNotification({
                    type: 'BET_CANCELLED' as any, // Cast to any to bypass strict type check if enum incomplete
                    title: 'Pari expiré',
                    message: `Votre pari de ${amount} FCFA a été annulé car le combat commence bientôt.`,
                    timestamp: new Date().toISOString()
                }, creatorId);

                // Push wallet update
                const wallet = await tx.wallet.findUnique({ where: { userId: creatorId } });
                if (wallet) {
                    this.webSocketService.broadcastWalletUpdate({
                        userId: creatorId,
                        balance: Number(wallet.balance),
                        lockedBalance: Number(wallet.lockedBalance),
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        logger.info(`Expired bet ${betId} cancelled and refunded`);
    }
}

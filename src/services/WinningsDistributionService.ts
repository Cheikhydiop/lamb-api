import { Service } from 'typedi';
import { PrismaClient, Bet, BetStatus, Winner, NotificationType } from '@prisma/client';
import { NotificationService } from './NotificationService';
import logger from '../utils/logger';

interface WinningsCalculation {
    userId: string;
    betId: string;
    originalAmount: bigint;
    winAmount: bigint;
    status: BetStatus;
}

interface DistributionResult {
    totalPot: bigint;
    commission: bigint;
    distributedAmount: bigint;
    winningBetsCount: number;
    losingBetsCount: number;
    processedBets: WinningsCalculation[];
    duration: number;
}

@Service()
export class WinningsDistributionService {
    private readonly WINNER_PERCENTAGE = 0.95; // 95% du pot pour les gagnants
    private readonly DRAW_REFUND_PERCENTAGE = 0.975; // 97.5% de remboursement
    private readonly COMMISSION_PERCENTAGE = 0.05; // 5% de commission
    private readonly PROCESSING_TIMEOUT = 60000; // 60 secondes

    constructor(
        private prisma: PrismaClient,
        private notificationService: NotificationService
    ) { }

    /**
     * Distribuer les gains pour un combat
     * Transaction atomique avec timeout de 60 secondes
     */
    async distributeWinnings(fightId: string, winner: Winner): Promise<DistributionResult> {
        const startTime = Date.now();

        try {
            logger.info(`Starting winnings distribution for fight ${fightId}, winner: ${winner}`);

            // Récupérer tous les paris du combat
            const bets = await this.prisma.bet.findMany({
                where: {
                    fightId,
                    status: 'ACCEPTED'
                }
            });

            if (bets.length === 0) {
                logger.info(`No bets to process for fight ${fightId}`);
                return {
                    totalPot: BigInt(0),
                    commission: BigInt(0),
                    distributedAmount: BigInt(0),
                    winningBetsCount: 0,
                    losingBetsCount: 0,
                    processedBets: [],
                    duration: Date.now() - startTime
                };
            }

            // Calculer les montants
            const calculations = this.calculateWinnings(bets, winner);

            // Exécuter la distribution dans une transaction atomique
            const result = await this.prisma.$transaction(async (tx) => {
                // Marquer le combat comme en cours de distribution
                await tx.fight.update({
                    where: { id: fightId },
                    data: {
                        distributionStatus: 'PROCESSING',
                        winner
                    }
                });

                // Traiter chaque pari
                for (const calc of calculations.processedBets) {
                    // Mettre à jour le statut du pari
                    await tx.bet.update({
                        where: { id: calc.betId },
                        data: {
                            status: calc.status,
                            actualWin: calc.winAmount > 0 ? calc.winAmount : null,
                            settledAt: new Date()
                        }
                    });

                    // Unlock the locked balance for this bet
                    await tx.wallet.update({
                        where: { userId: calc.userId },
                        data: {
                            lockedBalance: { decrement: calc.originalAmount }
                        }
                    });

                    // Créditer le wallet si gain ou remboursement
                    if (calc.winAmount > 0) {
                        await tx.wallet.update({
                            where: { userId: calc.userId },
                            data: {
                                balance: { increment: calc.winAmount },
                                totalWon: calc.status === 'WON' ? { increment: calc.winAmount } : undefined,
                                totalLost: calc.status === 'LOST' ? { increment: calc.originalAmount } : undefined
                            }
                        });

                        // Créer une transaction
                        const transaction = await tx.transaction.create({
                            data: {
                                type: calc.status === 'WON' ? 'BET_WIN' : 'BET_REFUND',
                                amount: calc.winAmount,
                                userId: calc.userId,
                                status: 'CONFIRMED',
                                notes: `${calc.status === 'WON' ? 'Gain' : 'Remboursement'} du pari sur le combat ${fightId}`
                            }
                        });
                    } else if (calc.status === 'LOST') {
                        // Update totalLost for losers
                        await tx.wallet.update({
                            where: { userId: calc.userId },
                            data: {
                                totalLost: { increment: calc.originalAmount }
                            }
                        });
                    }
                }

                // Enregistrer la commission
                if (calculations.commission > 0) {
                    const commissionTransaction = await tx.transaction.create({
                        data: {
                            type: 'COMMISSION',
                            amount: calculations.commission,
                            userId: calculations.processedBets[0]?.userId || 'system',
                            status: 'CONFIRMED',
                            notes: `Commission pour le combat ${fightId}`
                        }
                    });

                    await tx.commission.create({
                        data: {
                            type: 'BET',
                            fightId,
                            amount: calculations.commission,
                            percentage: this.COMMISSION_PERCENTAGE * 100,
                            transactionId: commissionTransaction.id
                        }
                    });
                }

                // Marquer le combat comme distribué
                await tx.fight.update({
                    where: { id: fightId },
                    data: {
                        distributionStatus: 'COMPLETED',
                        distributedAt: new Date()
                    }
                });

                return calculations;
            }, {
                timeout: this.PROCESSING_TIMEOUT,
                isolationLevel: 'Serializable'
            });

            const duration = Date.now() - startTime;

            // Logger performance
            if (duration > this.PROCESSING_TIMEOUT) {
                logger.warn(`Distribution took longer than 60s: ${duration}ms for fight ${fightId}`);
            } else {
                logger.info(`Distribution completed in ${duration}ms for fight ${fightId}`);
            }

            // Envoyer les notifications (asynchrone, ne bloque pas)
            this.sendNotifications(result.processedBets, fightId).catch(err => {
                logger.error('Error sending notifications:', err);
            });

            return {
                ...result,
                duration
            };

        } catch (error) {
            logger.error(`Error distributing winnings for fight ${fightId}:`, error);

            // Marquer comme échoué
            await this.prisma.fight.update({
                where: { id: fightId },
                data: { distributionStatus: 'FAILED' }
            }).catch(err => logger.error('Error marking distribution as failed:', err));

            throw error;
        }
    }

    /**
     * Calculer les gains selon le résultat
     */
    private calculateWinnings(bets: Bet[], winner: Winner): {
        totalPot: bigint;
        commission: bigint;
        distributedAmount: bigint;
        winningBetsCount: number;
        losingBetsCount: number;
        processedBets: WinningsCalculation[];
    } {
        const totalPot = bets.reduce((sum, bet) => sum + BigInt(bet.amount.toString()), BigInt(0));

        if (winner === 'DRAW') {
            return this.calculateDrawScenario(bets, totalPot);
        } else {
            return this.calculateWinnerScenario(bets, totalPot, winner);
        }
    }

    /**
     * Scénario victoire: 95% du pot pour les gagnants
     */
    private calculateWinnerScenario(bets: Bet[], totalPot: bigint, winner: Winner): {
        totalPot: bigint;
        commission: bigint;
        distributedAmount: bigint;
        winningBetsCount: number;
        losingBetsCount: number;
        processedBets: WinningsCalculation[];
    } {
        // Filtrer les paris gagnants et perdants
        const winningBets = bets.filter(bet =>
            (winner === 'A' && bet.chosenFighter === 'A') ||
            (winner === 'B' && bet.chosenFighter === 'B')
        );
        const losingBets = bets.filter(bet => !winningBets.includes(bet));

        // Calculer la commission (5% du pot total)
        const commission = (totalPot * BigInt(Math.floor(this.COMMISSION_PERCENTAGE * 100))) / BigInt(100);

        // Montant distribuable (95% du pot)
        const distributedAmount = totalPot - commission;

        // Calculer le pot des gagnants
        const winningPot = winningBets.reduce((sum, bet) => sum + BigInt(bet.amount.toString()), BigInt(0));

        const processedBets: WinningsCalculation[] = [];

        // Si personne n'a gagné (tous ont parié sur le perdant), la commission prend tout
        if (winningBets.length === 0) {
            losingBets.forEach(bet => {
                processedBets.push({
                    userId: bet.creatorId,
                    betId: bet.id,
                    originalAmount: BigInt(bet.amount.toString()),
                    winAmount: BigInt(0),
                    status: 'LOST'
                });
            });

            return {
                totalPot,
                commission: totalPot, // Toute la mise devient commission
                distributedAmount: BigInt(0),
                winningBetsCount: 0,
                losingBetsCount: losingBets.length,
                processedBets
            };
        }

        // Distribuer proportionnellement aux gagnants
        winningBets.forEach(bet => {
            // Gain = (mise / pot gagnants) × montant distribuable
            const betAmount = BigInt(bet.amount.toString());
            const winAmount = (betAmount * distributedAmount) / winningPot;

            processedBets.push({
                userId: bet.creatorId,
                betId: bet.id,
                originalAmount: betAmount,
                winAmount,
                status: 'WON'
            });
        });

        // Marquer les perdants
        losingBets.forEach(bet => {
            processedBets.push({
                userId: bet.creatorId,
                betId: bet.id,
                originalAmount: BigInt(bet.amount.toString()),
                winAmount: BigInt(0),
                status: 'LOST'
            });
        });

        return {
            totalPot,
            commission,
            distributedAmount,
            winningBetsCount: winningBets.length,
            losingBetsCount: losingBets.length,
            processedBets
        };
    }

    /**
     * Scénario match nul: 97.5% de remboursement pour tous
     */
    private calculateDrawScenario(bets: Bet[], totalPot: bigint): {
        totalPot: bigint;
        commission: bigint;
        distributedAmount: bigint;
        winningBetsCount: number;
        losingBetsCount: number;
        processedBets: WinningsCalculation[];
    } {
        // Commission de 2.5% (100% - 97.5%)
        const refundPercentage = BigInt(Math.floor(this.DRAW_REFUND_PERCENTAGE * 100));
        const commission = totalPot - (totalPot * refundPercentage / BigInt(100));

        const processedBets: WinningsCalculation[] = bets.map(bet => {
            // Remboursement = mise × 97.5%
            const betAmount = BigInt(bet.amount.toString());
            const refundAmount = (betAmount * refundPercentage) / BigInt(100);

            return {
                userId: bet.creatorId,
                betId: bet.id,
                originalAmount: betAmount,
                winAmount: refundAmount,
                status: 'REFUNDED' as BetStatus
            };
        });

        const distributedAmount = processedBets.reduce((sum, calc) => sum + calc.winAmount, BigInt(0));

        return {
            totalPot,
            commission,
            distributedAmount,
            winningBetsCount: 0,
            losingBetsCount: 0,
            processedBets
        };
    }

    /**
     * Envoyer les notifications aux parieurs
     */
    private async sendNotifications(calculations: WinningsCalculation[], fightId: string): Promise<void> {
        const notifications = calculations.map(calc => {
            let type: NotificationType;
            let title: string;
            let message: string;

            switch (calc.status) {
                case 'WON':
                    type = 'BET_WON';
                    title = '🎉 Pari gagné !';
                    message = `Félicitations ! Vous avez gagné ${Number(calc.winAmount).toLocaleString()} FCFA`;
                    break;
                case 'LOST':
                    type = 'BET_LOST';
                    title = 'Pari perdu';
                    message = `Votre pari de ${Number(calc.originalAmount).toLocaleString()} FCFA n'a pas gagné`;
                    break;
                case 'REFUNDED':
                    type = 'BET_REFUNDED';
                    title = 'Match nul - Remboursement';
                    message = `Vous avez été remboursé ${Number(calc.winAmount).toLocaleString()} FCFA (97.5% de votre mise)`;
                    break;
                default:
                    return null;
            }

            return this.notificationService.sendNotification({
                userId: calc.userId,
                type,
                title,
                message,
                data: {
                    betId: calc.betId,
                    fightId,
                    amount: Number(calc.winAmount),
                    originalAmount: Number(calc.originalAmount)
                }
            });
        }).filter(Boolean);

        await Promise.allSettled(notifications);
    }

    /**
     * Obtenir les statistiques de commission
     */
    async getCommissionStats(startDate?: Date, endDate?: Date) {
        const where: any = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const commissions = await this.prisma.commission.findMany({
            where,
            include: {
                fight: {
                    select: {
                        title: true,
                        scheduledAt: true
                    }
                }
            },
            orderBy: { deductedAt: 'desc' }
        });

        const totalCommission = commissions.reduce((sum, c) => sum + c.amount, BigInt(0));

        return {
            total: Number(totalCommission),
            count: commissions.length,
            commissions: commissions.map(c => ({
                ...c,
                amount: Number(c.amount)
            }))
        };
    }
}

import { Request, Response } from 'express';
import { Service } from 'typedi';
import { TransactionService } from '../services/TransactionService';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

@Service()
export class WalletController {
    constructor(
        private transactionService: TransactionService,
        private prisma: PrismaClient
    ) { }

    /**
     * Get wallet balance
     * GET /api/v1/wallet/balance
     */
    async getBalance(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Non authentifié'
                });
            }

            const wallet = await this.transactionService.getWalletBalance(userId);

            return res.json({
                success: true,
                data: {
                    balance: Number(wallet.balance),
                    lockedBalance: Number(wallet.lockedBalance),
                    totalWon: Number(wallet.totalWon),
                    totalLost: Number(wallet.totalLost)
                }
            });
        } catch (error: any) {
            logger.error('Error getting wallet balance:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors de la récupération du solde'
            });
        }
    }

    /**
     * Initiate deposit
     * POST /api/v1/wallet/deposit
     */
    async deposit(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Non authentifié'
                });
            }

            const { amount, provider, phoneNumber } = req.body;

            // Validation
            if (!amount || !provider || !phoneNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Montant, provider et numéro de téléphone requis'
                });
            }

            const amountBigInt = BigInt(amount);

            // Validate amount
            const MIN_DEPOSIT = BigInt(500);
            const MAX_DEPOSIT = BigInt(1000000);

            if (amountBigInt < MIN_DEPOSIT) {
                return res.status(400).json({
                    success: false,
                    error: `Montant minimum: ${MIN_DEPOSIT} FCFA`
                });
            }

            if (amountBigInt > MAX_DEPOSIT) {
                return res.status(400).json({
                    success: false,
                    error: `Montant maximum: ${MAX_DEPOSIT} FCFA`
                });
            }

            // Initiate deposit
            const result = await this.transactionService.deposit(userId, {
                amount: amountBigInt,
                provider,
                phoneNumber
            });

            return res.json({
                success: true,
                data: {
                    transactionId: result.id,
                    externalRef: result.externalRef,
                    message: result.message || 'Dépôt initié avec succès. Veuillez confirmer sur votre téléphone.',
                    requiresUserAction: result.requiresUserAction,
                    status: result.status
                }
            });
        } catch (error: any) {
            logger.error('Error initiating deposit:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors du dépôt'
            });
        }
    }

    /**
     * Initiate withdrawal
     * POST /api/v1/wallet/withdraw
     */
    async withdraw(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Non authentifié'
                });
            }

            const { amount, provider, phoneNumber } = req.body;

            // Validation
            if (!amount || !provider || !phoneNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Montant, provider et numéro de téléphone requis'
                });
            }

            const amountBigInt = BigInt(amount);

            // Validate amount
            const MIN_WITHDRAWAL = BigInt(1000);
            const MAX_WITHDRAWAL = BigInt(500000);

            if (amountBigInt < MIN_WITHDRAWAL) {
                return res.status(400).json({
                    success: false,
                    error: `Montant minimum: ${MIN_WITHDRAWAL} FCFA`
                });
            }

            if (amountBigInt > MAX_WITHDRAWAL) {
                return res.status(400).json({
                    success: false,
                    error: `Montant maximum: ${MAX_WITHDRAWAL} FCFA`
                });
            }

            // Initiate withdrawal
            const result = await this.transactionService.withdrawal(userId, {
                amount: amountBigInt,
                provider,
                phoneNumber
            });

            return res.json({
                success: true,
                data: {
                    transactionId: result.id,
                    externalRef: result.externalRef,
                    message: result.message || 'Retrait en cours de traitement.',
                    status: result.status
                }
            });
        } catch (error: any) {
            logger.error('Error initiating withdrawal:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors du retrait'
            });
        }
    }

    /**
     * Get transaction history
     * GET /api/v1/wallet/transactions
     */
    async getTransactions(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Non authentifié'
                });
            }

            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;

            const transactions = await this.transactionService.listTransactions(userId, {
                limit,
                offset
            });

            // Convert BigInt to number for JSON serialization
            const serializedTransactions = transactions.map(tx => ({
                ...tx,
                amount: Number(tx.amount)
            }));

            return res.json({
                success: true,
                data: serializedTransactions
            });
        } catch (error: any) {
            logger.error('Error getting transactions:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors de la récupération des transactions'
            });
        }
    }
}

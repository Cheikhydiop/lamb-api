import { Request, Response, NextFunction } from 'express';
import { Service } from 'typedi';
import { TransactionService } from '../services/TransactionService';
import logger from '../utils/logger';

@Service()
export class TransactionController {
  constructor(private transactionService: TransactionService) { }

  async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      logger.info(`Creating transaction for user: ${userId}`);
      const transaction = await this.transactionService.createTransaction(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction,
      });
    } catch (error) {
      logger.error('Create transaction error', error);
      next(error);
    }
  }

  async withdrawal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      logger.info(`Withdrawal initiated for user: ${userId}`);
      const transaction = await this.transactionService.withdrawal(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Withdrawal initiated successfully',
        data: transaction,
      });
    } catch (error) {
      logger.error('Withdrawal error', error);
      next(error);
    }
  }

  async confirmTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const transactionId = req.params.transactionId;
      logger.info(`Admin confirming transaction: ${transactionId}`);
      const transaction = await this.transactionService.confirmTransaction({
        transactionId,
        externalRef: req.body.externalRef,
        status: req.body.status,
      });
      res.json({
        success: true,
        message: 'Transaction confirmed',
        data: transaction,
      });
    } catch (error) {
      logger.error('Confirm transaction error', error);
      next(error);
    }
  }

  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const transactions = await this.transactionService.listTransactions(userId, req.query as any);
      res.json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions,
      });
    } catch (error) {
      logger.error('List transactions error', error);
      next(error);
    }
  }

  async getTransactionById(req: Request, res: Response, next: NextFunction) {
    try {
      const transactionId = req.params.transactionId;
      const transaction = await this.transactionService.getTransactionById(transactionId);
      res.json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: transaction,
      });
    } catch (error) {
      logger.error('Get transaction error', error);
      next(error);
    }
  }

  async getWalletBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const wallet = await this.transactionService.getWalletBalance(userId);
      res.json({
        success: true,
        message: 'Wallet balance retrieved',
        data: wallet,
      });
    } catch (error) {
      logger.error('Get wallet balance error', error);
      next(error);
    }
  }
}

import { Router } from 'express';
import { Container } from 'typedi';
import { TransactionController } from '../controllers/transaction.controller';
import { CreateTransactionDTO, WithdrawalDTO, ListTransactionsDTO } from '../dto/transaction.dto';
import { validateRequest } from '../middlewares/validation.middleware';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';
import { AuditMiddleware, AuditAction, AuditResourceType, AuditSeverity } from '../middlewares/AuditMiddleware';

const router = Router();

// Create transaction
router.post('/', requireAuth, validateRequest(CreateTransactionDTO), (req, res, next) => {
  const auditMiddleware = Container.get(AuditMiddleware);
  auditMiddleware.auditTokenPurchase()(req, res, (err) => {
    if (err) return next(err);
    const transactionController = Container.get(TransactionController);
    transactionController.createTransaction(req, res, next);
  });
});

// Withdrawal
router.post('/withdrawal', requireAuth, validateRequest(WithdrawalDTO), (req, res, next) => {
  const auditMiddleware = Container.get(AuditMiddleware);
  auditMiddleware.auditWithdrawal()(req, res, (err) => {
    if (err) return next(err);
    const transactionController = Container.get(TransactionController);
    transactionController.withdrawal(req, res, next);
  });
});

// Confirm transaction (admin only)
router.post('/:transactionId/confirm', requireAdmin, (req, res, next) => {
  const auditMiddleware = Container.get(AuditMiddleware);
  auditMiddleware.auditAdminAction(AuditAction.SYSTEM_CONFIG_UPDATE, AuditResourceType.TRANSACTION, AuditSeverity.HIGH)(req, res, (err) => {
    if (err) return next(err);
    const transactionController = Container.get(TransactionController);
    transactionController.confirmTransaction(req, res, next);
  });
});

// List transactions
router.get('/', requireAuth, validateRequest(ListTransactionsDTO), (req, res, next) => {
  const transactionController = Container.get(TransactionController);
  transactionController.listTransactions(req, res, next);
});

// Get wallet balance
router.get('/wallet/balance', requireAuth, (req, res, next) => {
  const transactionController = Container.get(TransactionController);
  transactionController.getWalletBalance(req, res, next);
});

// Get transaction by ID
router.get('/:transactionId', requireAuth, (req, res, next) => {
  const transactionController = Container.get(TransactionController);
  transactionController.getTransactionById(req, res, next);
});

export default router;

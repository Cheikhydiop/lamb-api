import { Router } from 'express';
import { Container } from 'typedi';
import { TransactionController } from '../controllers/transaction.controller';
import { CreateTransactionDTO, WithdrawalDTO, ListTransactionsDTO } from '../dto/transaction.dto';
import { validateRequest } from '../middlewares/validation.middleware';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';
import { AuditMiddleware, AuditAction, AuditResourceType, AuditSeverity } from '../middlewares/AuditMiddleware';

const router = Router();
const transactionController = Container.get(TransactionController);
const auditMiddleware = Container.get(AuditMiddleware);

// Create transaction
router.post('/', requireAuth, validateRequest(CreateTransactionDTO), auditMiddleware.auditTokenPurchase(), (req, res, next) =>
  transactionController.createTransaction(req, res, next)
);

// Withdrawal
router.post('/withdrawal', requireAuth, validateRequest(WithdrawalDTO), auditMiddleware.auditWithdrawal(), (req, res, next) =>
  transactionController.withdrawal(req, res, next)
);

// Confirm transaction (admin only)
router.post('/:transactionId/confirm', requireAdmin, auditMiddleware.auditAdminAction(AuditAction.SYSTEM_CONFIG_UPDATE, AuditResourceType.TRANSACTION, AuditSeverity.HIGH), (req, res, next) =>
  transactionController.confirmTransaction(req, res, next)
);

// List transactions
router.get('/', requireAuth, validateRequest(ListTransactionsDTO), (req, res, next) =>
  transactionController.listTransactions(req, res, next)
);

// Get wallet balance
router.get('/wallet/balance', requireAuth, (req, res, next) =>
  transactionController.getWalletBalance(req, res, next)
);

// Get transaction by ID
router.get('/:transactionId', requireAuth, (req, res, next) =>
  transactionController.getTransactionById(req, res, next)
);

export default router;

import { Router } from 'express';
import { Container } from 'typedi';
import { TransactionController } from '../controllers/transaction.controller';
import { CreateTransactionDTO, WithdrawalDTO, ListTransactionsDTO } from '../dto/transaction.dto';
import { validateRequest } from '../middlewares/validation.middleware';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';
import { AuditMiddleware, AuditAction, AuditResourceType, AuditSeverity } from '../middlewares/AuditMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management
 */

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a transaction (Buy Tokens)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [DEPOSIT, WITHDRAWAL]
 *     responses:
 *       201:
 *         description: Transaction created
 */
// Create transaction
router.post('/', requireAuth, validateRequest(CreateTransactionDTO), (req, res, next) => {
  const auditMiddleware = Container.get(AuditMiddleware);
  auditMiddleware.auditTokenPurchase()(req, res, (err) => {
    if (err) return next(err);
    const transactionController = Container.get(TransactionController);
    transactionController.createTransaction(req, res, next);
  });
});

/**
 * @swagger
 * /api/transactions/withdrawal:
 *   post:
 *     summary: Request withdrawal
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Withdrawal requested
 */
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

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: List transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of transactions
 */
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

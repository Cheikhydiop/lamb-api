"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const typedi_1 = require("typedi");
const transaction_controller_1 = require("../controllers/transaction.controller");
const transaction_dto_1 = require("../dto/transaction.dto");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const AuditMiddleware_1 = require("../middlewares/AuditMiddleware");
const router = (0, express_1.Router)();
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
router.post('/', authMiddleware_1.requireAuth, (0, validation_middleware_1.validateRequest)(transaction_dto_1.CreateTransactionDTO), (req, res, next) => {
    const auditMiddleware = typedi_1.Container.get(AuditMiddleware_1.AuditMiddleware);
    auditMiddleware.auditTokenPurchase()(req, res, (err) => {
        if (err)
            return next(err);
        const transactionController = typedi_1.Container.get(transaction_controller_1.TransactionController);
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
router.post('/withdrawal', authMiddleware_1.requireAuth, (0, validation_middleware_1.validateRequest)(transaction_dto_1.WithdrawalDTO), (req, res, next) => {
    const auditMiddleware = typedi_1.Container.get(AuditMiddleware_1.AuditMiddleware);
    auditMiddleware.auditWithdrawal()(req, res, (err) => {
        if (err)
            return next(err);
        const transactionController = typedi_1.Container.get(transaction_controller_1.TransactionController);
        transactionController.withdrawal(req, res, next);
    });
});
// Confirm transaction (admin only)
router.post('/:transactionId/confirm', authMiddleware_1.requireAdmin, (req, res, next) => {
    const auditMiddleware = typedi_1.Container.get(AuditMiddleware_1.AuditMiddleware);
    auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.SYSTEM_CONFIG_UPDATE, AuditMiddleware_1.AuditResourceType.TRANSACTION, AuditMiddleware_1.AuditSeverity.HIGH)(req, res, (err) => {
        if (err)
            return next(err);
        const transactionController = typedi_1.Container.get(transaction_controller_1.TransactionController);
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
// ⚠️ IMPORTANT: Routes statiques AVANT routes dynamiques
// List transactions
router.get('/', authMiddleware_1.requireAuth, (0, validation_middleware_1.validateRequest)(transaction_dto_1.ListTransactionsDTO), (req, res, next) => {
    const transactionController = typedi_1.Container.get(transaction_controller_1.TransactionController);
    transactionController.listTransactions(req, res, next);
});
// Alias /history pour rétrocompatibilité avec ancien frontend
// TODO: Supprimer après que Vercel ait redéployé le nouveau frontend
router.get('/history', authMiddleware_1.requireAuth, (0, validation_middleware_1.validateRequest)(transaction_dto_1.ListTransactionsDTO), (req, res, next) => {
    const transactionController = typedi_1.Container.get(transaction_controller_1.TransactionController);
    transactionController.listTransactions(req, res, next);
});
// Get wallet balance
router.get('/wallet/balance', authMiddleware_1.requireAuth, (req, res, next) => {
    const transactionController = typedi_1.Container.get(transaction_controller_1.TransactionController);
    transactionController.getWalletBalance(req, res, next);
});
// Get transaction by ID - DOIT ÊTRE EN DERNIER
// Sinon '/history' serait traité comme un ID
router.get('/:transactionId', authMiddleware_1.requireAuth, (req, res, next) => {
    const transactionController = typedi_1.Container.get(transaction_controller_1.TransactionController);
    transactionController.getTransactionById(req, res, next);
});
exports.default = router;

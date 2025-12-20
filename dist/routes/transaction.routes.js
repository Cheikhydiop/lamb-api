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
const transactionController = typedi_1.Container.get(transaction_controller_1.TransactionController);
const auditMiddleware = typedi_1.Container.get(AuditMiddleware_1.AuditMiddleware);
// Create transaction
router.post('/', authMiddleware_1.requireAuth, (0, validation_middleware_1.validateRequest)(transaction_dto_1.CreateTransactionDTO), auditMiddleware.auditTokenPurchase(), (req, res, next) => transactionController.createTransaction(req, res, next));
// Withdrawal
router.post('/withdrawal', authMiddleware_1.requireAuth, (0, validation_middleware_1.validateRequest)(transaction_dto_1.WithdrawalDTO), auditMiddleware.auditWithdrawal(), (req, res, next) => transactionController.withdrawal(req, res, next));
// Confirm transaction (admin only)
router.post('/:transactionId/confirm', authMiddleware_1.requireAdmin, auditMiddleware.auditAdminAction(AuditMiddleware_1.AuditAction.SYSTEM_CONFIG_UPDATE, AuditMiddleware_1.AuditResourceType.TRANSACTION, AuditMiddleware_1.AuditSeverity.HIGH), (req, res, next) => transactionController.confirmTransaction(req, res, next));
// List transactions
router.get('/', authMiddleware_1.requireAuth, (0, validation_middleware_1.validateRequest)(transaction_dto_1.ListTransactionsDTO), (req, res, next) => transactionController.listTransactions(req, res, next));
// Get wallet balance
router.get('/wallet/balance', authMiddleware_1.requireAuth, (req, res, next) => transactionController.getWalletBalance(req, res, next));
// Get transaction by ID
router.get('/:transactionId', authMiddleware_1.requireAuth, (req, res, next) => transactionController.getTransactionById(req, res, next));
exports.default = router;

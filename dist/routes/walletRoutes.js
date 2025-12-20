"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const typedi_1 = __importDefault(require("typedi"));
const WalletController_1 = require("../controllers/WalletController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management
 */
/**
 * @swagger
 * /api/v1/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 */
router.get('/balance', authMiddleware_1.requireAuth, (req, res) => {
    const walletController = typedi_1.default.get(WalletController_1.WalletController);
    walletController.getBalance(req, res);
});
/**
 * @swagger
 * /api/v1/wallet/deposit:
 *   post:
 *     summary: Initiate a deposit
 *     tags: [Wallet]
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
 *               - provider
 *             properties:
 *               amount:
 *                 type: number
 *               provider:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deposit initiated
 */
router.post('/deposit', authMiddleware_1.requireAuth, (req, res) => {
    const walletController = typedi_1.default.get(WalletController_1.WalletController);
    walletController.deposit(req, res);
});
/**
 * @swagger
 * /api/v1/wallet/withdraw:
 *   post:
 *     summary: Initiate a withdrawal
 *     tags: [Wallet]
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
 *               - provider
 *             properties:
 *               amount:
 *                 type: number
 *               provider:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal initiated
 */
router.post('/withdraw', authMiddleware_1.requireAuth, (req, res) => {
    const walletController = typedi_1.default.get(WalletController_1.WalletController);
    walletController.withdraw(req, res);
});
/**
 * @swagger
 * /api/v1/wallet/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction history
 */
router.get('/transactions', authMiddleware_1.requireAuth, (req, res) => {
    const walletController = typedi_1.default.get(WalletController_1.WalletController);
    walletController.getTransactions(req, res);
});
exports.default = router;

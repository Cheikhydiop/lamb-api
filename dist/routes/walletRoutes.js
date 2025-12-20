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
const walletController = typedi_1.default.get(WalletController_1.WalletController);
/**
 * @route   GET /api/v1/wallet/balance
 * @desc    Get user wallet balance
 * @access  Private
 */
router.get('/balance', authMiddleware_1.requireAuth, (req, res) => walletController.getBalance(req, res));
/**
 * @route   POST /api/v1/wallet/deposit
 * @desc    Initiate a deposit
 * @access  Private
 */
router.post('/deposit', authMiddleware_1.requireAuth, (req, res) => walletController.deposit(req, res));
/**
 * @route   POST /api/v1/wallet/withdraw
 * @desc    Initiate a withdrawal
 * @access  Private
 */
router.post('/withdraw', authMiddleware_1.requireAuth, (req, res) => walletController.withdraw(req, res));
/**
 * @route   GET /api/v1/wallet/transactions
 * @desc    Get transaction history
 * @access  Private
 */
router.get('/transactions', authMiddleware_1.requireAuth, (req, res) => walletController.getTransactions(req, res));
exports.default = router;

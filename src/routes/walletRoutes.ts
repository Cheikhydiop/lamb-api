import { Router } from 'express';
import Container from 'typedi';
import { WalletController } from '../controllers/WalletController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
const walletController = Container.get(WalletController);

/**
 * @route   GET /api/v1/wallet/balance
 * @desc    Get user wallet balance
 * @access  Private
 */
router.get(
    '/balance',
    requireAuth,
    (req, res) => walletController.getBalance(req, res)
);

/**
 * @route   POST /api/v1/wallet/deposit
 * @desc    Initiate a deposit
 * @access  Private
 */
router.post(
    '/deposit',
    requireAuth,
    (req, res) => walletController.deposit(req, res)
);

/**
 * @route   POST /api/v1/wallet/withdraw
 * @desc    Initiate a withdrawal
 * @access  Private
 */
router.post(
    '/withdraw',
    requireAuth,
    (req, res) => walletController.withdraw(req, res)
);

/**
 * @route   GET /api/v1/wallet/transactions
 * @desc    Get transaction history
 * @access  Private
 */
router.get(
    '/transactions',
    requireAuth,
    (req, res) => walletController.getTransactions(req, res)
);

export default router;

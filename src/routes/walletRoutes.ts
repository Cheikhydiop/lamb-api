import { Router } from 'express';
import Container from 'typedi';
import { WalletController } from '../controllers/WalletController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

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
router.get(
    '/balance',
    requireAuth,
    (req, res) => {
        const walletController = Container.get(WalletController);
        walletController.getBalance(req, res);
    }
);

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
router.post(
    '/deposit',
    requireAuth,
    (req, res) => {
        const walletController = Container.get(WalletController);
        walletController.deposit(req, res);
    }
);

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
router.post(
    '/withdraw',
    requireAuth,
    (req, res) => {
        const walletController = Container.get(WalletController);
        walletController.withdraw(req, res);
    }
);

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
router.get(
    '/transactions',
    requireAuth,
    (req, res) => {
        const walletController = Container.get(WalletController);
        walletController.getTransactions(req, res);
    }
);

export default router;

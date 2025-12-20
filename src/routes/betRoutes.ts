// src/routes/betRoutes.ts
import express from 'express';
import BetController from '../controllers/BetController';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { body, param, query } from 'express-validator';
import { BetStatus } from '@prisma/client';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = express.Router();

// ==================== ROUTES PUBLIQUES ====================

/**
 * @swagger
 * tags:
 *   name: Bets
 *   description: Betting management
 */

/**
 * @swagger
 * /api/bets/{betId}:
 *   get:
 *     summary: Get bet details
 *     tags: [Bets]
 *     parameters:
 *       - in: path
 *         name: betId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bet details
 *       404:
 *         description: Bet not found
 */
// Obtenir les détails d'un pari
router.get(
  '/:betId',
  [
    param('betId')
      .notEmpty().withMessage('ID du pari requis')
      .isString().withMessage('ID du pari doit être une chaîne')
  ],
  validateRequest,
  asyncHandler(BetController.getBet)
);

/**
 * @swagger
 * /api/bets:
 *   get:
 *     summary: List bets with filters
 *     tags: [Bets]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, COMPLETED, CANCELLED]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of bets
 */
// Liste des paris avec filtres
router.get(
  '/',
  [
    query('userId')
      .optional()
      .isString().withMessage('ID de l\'utilisateur doit être une chaîne'),
    query('fightId')
      .optional()
      .isString().withMessage('ID du combat doit être une chaîne'),
    query('dayEventId')
      .optional()
      .isString().withMessage('ID de la journée doit être une chaîne'),
    query('status')
      .optional()
      .isIn(Object.values(BetStatus)).withMessage(`Statut invalide. Valeurs acceptées: ${Object.values(BetStatus).join(', ')}`),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 }).withMessage('Offset doit être un entier positif')
  ],
  validateRequest,
  asyncHandler(BetController.listBets)
);

/**
 * @swagger
 * /api/bets/available/{fightId}:
 *   get:
 *     summary: Get available bets for a fight
 *     tags: [Bets]
 *     parameters:
 *       - in: path
 *         name: fightId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available bets
 */
// Obtenir les paris disponibles pour un combat
router.get(
  '/available/:fightId',
  [
    param('fightId')
      .notEmpty().withMessage('ID du combat requis')
      .isString().withMessage('ID du combat doit être une chaîne')
  ],
  validateRequest,
  asyncHandler(BetController.getAvailableBets)
);


// Obtenir les paris en attente (PENDING)
router.get(
  '/status/pending',
  [
    query('userId')
      .optional()
      .isString().withMessage('ID de l\'utilisateur doit être une chaîne'),
    query('fightId')
      .optional()
      .isString().withMessage('ID du combat doit être une chaîne'),
    query('dayEventId')
      .optional()
      .isString().withMessage('ID de la journée doit être une chaîne'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 }).withMessage('Offset doit être un entier positif')
  ],
  validateRequest,
  asyncHandler(BetController.getPendingBets)
);

// ==================== ROUTES UTILISATEUR AUTHENTIFIÉ ====================

/**
 * @swagger
 * /api/bets/my-bets:
 *   get:
 *     summary: Get my bets
 *     tags: [Bets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of my bets
 */
// Obtenir mes paris (créés et acceptés) - Doit être AVANT /:betId
router.get(
  '/my-bets',
  requireAuth,
  asyncHandler(BetController.getMyBets)
);

// Obtenir les paris actifs d'un utilisateur - Doit être AVANT /:betId
router.get(
  '/active',
  requireAuth,
  asyncHandler(BetController.getActiveBets)
);

// Obtenir les statistiques de paris - Doit être AVANT /:betId
router.get(
  '/stats',
  requireAuth,
  asyncHandler(BetController.getBetStats)
);

/**
 * @swagger
 * /api/bets:
 *   post:
 *     summary: Create a new bet
 *     tags: [Bets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fightId
 *               - chosenFighter
 *               - amount
 *             properties:
 *               fightId:
 *                 type: string
 *               chosenFighter:
 *                 type: string
 *                 enum: [A, B]
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bet created
 */
// Créer un nouveau pari
router.post(
  '/',
  requireAuth,
  [
    body('fightId')
      .notEmpty().withMessage('ID du combat requis')
      .isString().withMessage('ID du combat doit être une chaîne'),
    body('chosenFighter')
      .notEmpty().withMessage('Choix du combattant requis')
      .isIn(['A', 'B']).withMessage('Le choix doit être A ou B'),
    body('amount')
      .notEmpty().withMessage('Montant requis')
      .isFloat({ min: 1 }).withMessage('Montant doit être un nombre positif')
  ],
  validateRequest,
  asyncHandler(BetController.createBet)
);

/**
 * @swagger
 * /api/bets/{betId}/accept:
 *   post:
 *     summary: Accept a bet
 *     tags: [Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: betId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bet accepted
 */
// Accepter un pari
router.post(
  '/:betId/accept',
  requireAuth,
  [
    param('betId')
      .notEmpty().withMessage('ID du pari requis')
      .isString().withMessage('ID du pari doit être une chaîne')
  ],
  validateRequest,
  asyncHandler(BetController.acceptBet)
);

/**
 * @swagger
 * /api/bets/{betId}:
 *   delete:
 *     summary: Cancel a bet
 *     tags: [Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: betId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bet cancelled
 */
// Annuler un pari
router.delete(
  '/:betId',
  requireAuth,
  [
    param('betId')
      .notEmpty().withMessage('ID du pari requis')
      .isString().withMessage('ID du pari doit être une chaîne')
  ],
  validateRequest,
  asyncHandler(BetController.cancelBet)
);


// ==================== ROUTES ADMIN ====================

// Régler un pari (admin seulement)
router.post(
  '/:betId/settle',
  requireAuth,
  requireAdmin,
  [
    param('betId')
      .notEmpty().withMessage('ID du pari requis')
      .isString().withMessage('ID du pari doit être une chaîne'),
    body('winner')
      .notEmpty().withMessage('Vainqueur requis')
      .isIn(['A', 'B', 'DRAW']).withMessage('Vainqueur invalide. Valeurs acceptées: A, B, DRAW')
  ],
  validateRequest,
  asyncHandler(BetController.settleBet)
);

// Vérifier et expirer les paris (admin seulement)
router.post(
  '/expire-check',
  requireAuth,
  requireAdmin,
  asyncHandler(BetController.checkExpiredBets)
);

// ==================== ROUTES DE TEST ====================

// Route de test (développement uniquement)
if (process.env.NODE_ENV === 'development') {
  router.get('/test', (req, res) => {
    res.json({
      success: true,
      message: 'API des paris fonctionnelle',
      timestamp: new Date().toISOString()
    });
  });
}

export default router;
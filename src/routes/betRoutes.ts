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

// Obtenir mes paris (créés et acceptés)
router.get(
  '/my-bets',
  requireAuth,
  asyncHandler(BetController.getMyBets)
);

// Obtenir les paris actifs d'un utilisateur
router.get(
  '/active',
  requireAuth,
  asyncHandler(BetController.getActiveBets)
);

// Obtenir les statistiques de paris
router.get(
  '/stats',
  requireAuth,
  asyncHandler(BetController.getBetStats)
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
// src/routes/fightRoutes.ts
import express from 'express';
import FightController from '../controllers/FightController';
import { requireAuth, requireAdmin, requireRole } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { body, param, query } from 'express-validator';
import { FightStatus, Winner } from '@prisma/client';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = express.Router();

// ==================== ROUTES PUBLIQUES ====================

/**
 * @swagger
 * tags:
 *   - name: Fights
 *     description: Fight management
 *   - name: DayEvents
 *     description: Day Event management
 */

// ==================== ROUTES JOURNÉES DE LUTTE (PUBLIQUES) ====================
// DOIT ÊTRE AVANT /:fightId pour ne pas être interprété comme un ID

/**
 * @swagger
 * /api/fights/day-events:
 *   get:
 *     summary: List day events
 *     tags: [DayEvents]
 *     responses:
 *       200:
 *         description: List of day events
 */
// Liste des journées avec filtres
router.get(
  '/day-events',
  asyncHandler(FightController.listDayEvents)
);

/**
 * @swagger
 * /api/fights/day-events/upcoming:
 *   get:
 *     summary: Get upcoming day events
 *     tags: [DayEvents]
 *     responses:
 *       200:
 *         description: List of upcoming day events
 */
// Obtenir les journées à venir
router.get(
  '/day-events/upcoming',
  asyncHandler(FightController.getUpcomingDayEvents)
);

/**
 * @swagger
 * /api/fights/day-events/current:
 *   get:
 *     summary: Get current day event
 *     tags: [DayEvents]
 *     responses:
 *       200:
 *         description: Current day event details
 */
// Obtenir la journée actuelle
router.get(
  '/day-events/current',
  asyncHandler(FightController.getCurrentDayEvent)
);

/**
 * @swagger
 * /api/fights/day-events/{eventId}:
 *   get:
 *     summary: Get day event details
 *     tags: [DayEvents]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Day event details
 */
// Obtenir les détails d'une journée
router.get(
  '/day-events/:eventId',
  [
    param('eventId')
      .notEmpty().withMessage('ID de la journée requis')
      .isString().withMessage('ID de la journée doit être une chaîne')
  ],
  validateRequest,
  asyncHandler(FightController.getDayEvent)
);


// ==================== ROUTES COMBATS ====================

/**
 * @swagger
 * /api/fights/upcoming:
 *   get:
 *     summary: Get upcoming fights
 *     tags: [Fights]
 *     responses:
 *       200:
 *         description: List of upcoming fights
 */
// Obtenir les prochains combats
router.get(
  '/upcoming',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limite doit être entre 1 et 50')
  ],
  validateRequest,
  asyncHandler(FightController.getUpcomingFights)
);

// Obtenir les combats populaires
router.get(
  '/popular',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limite doit être entre 1 et 50')
  ],
  validateRequest,
  asyncHandler(FightController.getPopularFights)
);

/**
 * @swagger
 * /api/fights:
 *   get:
 *     summary: List fights with filters
 *     tags: [Fights]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ONGOING, COMPLETED, CANCELLED]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of fights
 */
// Liste des combats avec filtres
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(Object.values(FightStatus)).withMessage(`Statut invalide. Valeurs acceptées: ${Object.values(FightStatus).join(', ')}`),
    query('fighterId')
      .optional()
      .isString().withMessage('ID du combattant doit être une chaîne'),
    query('fromDate')
      .optional()
      .isISO8601().withMessage('Date de début doit être au format ISO8601'),
    query('toDate')
      .optional()
      .isISO8601().withMessage('Date de fin doit être au format ISO8601'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 }).withMessage('Offset doit être un entier positif')
  ],
  validateRequest,
  asyncHandler(FightController.listFights)
);

/**
 * @swagger
 * /api/fights/{fightId}:
 *   get:
 *     summary: Get fight details
 *     tags: [Fights]
 *     parameters:
 *       - in: path
 *         name: fightId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fight details
 *       404:
 *         description: Fight not found
 */
// Obtenir les détails d'un combat
router.get(
  '/:fightId',
  [
    param('fightId')
      .notEmpty().withMessage('ID du combat requis')
      .isString().withMessage('ID du combat doit être une chaîne')
  ],
  validateRequest,
  asyncHandler(FightController.getFight)
);

// ==================== ROUTES ADMIN (COMBATS) ====================

// Créer un nouveau combat (Admin seulement)
router.post(
  '/',
  requireAuth,
  requireAdmin,
  [
    body('title')
      .notEmpty().withMessage('Titre requis')
      .isString().withMessage('Titre doit être une chaîne')
      .isLength({ min: 3, max: 100 }).withMessage('Titre doit contenir entre 3 et 100 caractères'),
    body('description')
      .optional()
      .isString().withMessage('Description doit être une chaîne')
      .isLength({ max: 500 }).withMessage('Description ne doit pas dépasser 500 caractères'),
    body('location')
      .notEmpty().withMessage('Lieu requis')
      .isString().withMessage('Lieu doit être une chaîne')
      .isLength({ max: 100 }).withMessage('Lieu ne doit pas dépasser 100 caractères'),
    body('scheduledAt')
      .notEmpty().withMessage('Date prévue requise')
      .isISO8601().withMessage('Date doit être au format ISO8601'),
    body('fighterAId')
      .notEmpty().withMessage('ID du combattant A requis')
      .isString().withMessage('ID du combattant A doit être une chaîne'),
    body('fighterBId')
      .notEmpty().withMessage('ID du combattant B requis')
      .isString().withMessage('ID du combattant B doit être une chaîne')
  ],
  validateRequest,
  asyncHandler(FightController.createFight)
);

// Mettre à jour le statut d'un combat (Admin seulement)
router.patch(
  '/:fightId/status',
  requireAuth,
  requireAdmin,
  [
    param('fightId')
      .notEmpty().withMessage('ID du combat requis')
      .isString().withMessage('ID du combat doit être une chaîne'),
    body('status')
      .notEmpty().withMessage('Statut requis')
      .isIn(Object.values(FightStatus)).withMessage(`Statut invalide. Valeurs acceptées: ${Object.values(FightStatus).join(', ')}`)
  ],
  validateRequest,
  asyncHandler(FightController.updateFightStatus)
);

// Valider le résultat d'un combat (Admin seulement)
router.post(
  '/:fightId/validate-result',
  requireAuth,
  requireAdmin,
  [
    param('fightId')
      .notEmpty().withMessage('ID du combat requis')
      .isString().withMessage('ID du combat doit être une chaîne'),
    body('winner')
      .notEmpty().withMessage('Vainqueur requis')
      .isIn(Object.values(Winner)).withMessage(`Vainqueur invalide. Valeurs acceptées: ${Object.values(Winner).join(', ')}`),
    body('victoryMethod')
      .optional()
      .isString().withMessage('Méthode de victoire doit être une chaîne')
      .isLength({ max: 50 }).withMessage('Méthode de victoire ne doit pas dépasser 50 caractères'),
    body('notes')
      .optional()
      .isString().withMessage('Notes doivent être une chaîne')
      .isLength({ max: 500 }).withMessage('Notes ne doivent pas dépasser 500 caractères'),
    body('password')
      .notEmpty().withMessage('Mot de passe administrateur requis pour confirmation'),
    body('otpCode')
      .notEmpty().withMessage('Code OTP requis pour confirmation')
      .isLength({ min: 6, max: 6 }).withMessage('Le code OTP doit comporter 6 chiffres')
  ],
  validateRequest,
  asyncHandler(FightController.validateFightResult)
);

// Demander un OTP pour la validation d'un résultat
router.post(
  '/:fightId/request-validation-otp',
  requireAuth,
  requireAdmin,
  [
    param('fightId')
      .notEmpty().withMessage('ID du combat requis')
      .isString().withMessage('ID du combat doit être une chaîne')
  ],
  validateRequest,
  asyncHandler(FightController.requestFightValidationOTP)
);

// Expirer automatiquement les combats passés (Admin seulement)
router.post(
  '/expire-past',
  requireAuth,
  requireAdmin,
  asyncHandler(FightController.expirePastFights)
);

// ==================== ROUTES JOURNÉES DE LUTTE (ADMIN) ====================

// Créer une nouvelle journée (Admin seulement)
router.post(
  '/day-events',
  requireAuth,
  requireAdmin,
  asyncHandler(FightController.createDayEvent)
);

// Mettre à jour une journée (Admin seulement)
router.put(
  '/day-events/:eventId',
  requireAuth,
  requireAdmin,
  asyncHandler(FightController.updateDayEvent)
);

// Supprimer une journée (Admin seulement)
router.delete(
  '/day-events/:eventId',
  requireAuth,
  requireAdmin,
  asyncHandler(FightController.deleteDayEvent)
);

// ==================== ROUTES DE TEST ====================

// Route de test (développement uniquement)
if (process.env.NODE_ENV === 'development') {
  router.get('/test', (req, res) => {
    res.json({
      success: true,
      message: 'API des combats fonctionnelle',
      timestamp: new Date().toISOString()
    });
  });
}

export default router;
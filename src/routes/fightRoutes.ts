// src/routes/fightRoutes.ts
import express from 'express';
import FightController from '../controllers/FightController';
import { requireAuth, requireAdmin, requireRole } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { body, param, query } from 'express-validator';
import { FightStatus, Winner } from '@prisma/client';

const router = express.Router();

// ==================== ROUTES PUBLIQUES ====================

// Obtenir les détails d'un combat
router.get(
  '/:fightId',
  [
    param('fightId')
      .notEmpty().withMessage('ID du combat requis')
      .isString().withMessage('ID du combat doit être une chaîne')
  ],
  validateRequest,
  FightController.getFight
);

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
  FightController.listFights
);

// Obtenir les prochains combats
router.get(
  '/upcoming',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limite doit être entre 1 et 50')
  ],
  validateRequest,
  FightController.getUpcomingFights
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
  FightController.getPopularFights
);

// ==================== ROUTES ADMIN (COMBATS) ====================

// Créer un nouveau combat (Admin seulement)
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
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
  FightController.createFight
);

// Mettre à jour le statut d'un combat (Admin seulement)
router.patch(
  '/:fightId/status',
  requireAuth,
  requireRole('ADMIN'),
  [
    param('fightId')
      .notEmpty().withMessage('ID du combat requis')
      .isString().withMessage('ID du combat doit être une chaîne'),
    body('status')
      .notEmpty().withMessage('Statut requis')
      .isIn(Object.values(FightStatus)).withMessage(`Statut invalide. Valeurs acceptées: ${Object.values(FightStatus).join(', ')}`)
  ],
  validateRequest,
  FightController.updateFightStatus
);

// Valider le résultat d'un combat (Admin seulement)
router.post(
  '/:fightId/validate-result',
  requireAuth,
  requireRole('ADMIN'),
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
  FightController.validateFightResult
);

// Demander un OTP pour la validation d'un résultat
router.post(
  '/:fightId/request-validation-otp',
  requireAuth,
  requireRole('ADMIN'),
  [
    param('fightId')
      .notEmpty().withMessage('ID du combat requis')
      .isString().withMessage('ID du combat doit être une chaîne')
  ],
  validateRequest,
  FightController.requestFightValidationOTP
);

// Expirer automatiquement les combats passés (Admin seulement)
router.post(
  '/expire-past',
  requireAuth,
  requireRole('ADMIN'),
  FightController.expirePastFights
);

// ==================== ROUTES JOURNÉES DE LUTTE (PUBLIQUES) ====================

// Obtenir les détails d'une journée
router.get(
  '/day-events/:eventId',
  [
    param('eventId')
      .notEmpty().withMessage('ID de la journée requis')
      .isString().withMessage('ID de la journée doit être une chaîne')
  ],
  validateRequest,
  FightController.getDayEvent
);

// Liste des journées avec filtres
router.get(
  '/day-events',
  FightController.listDayEvents
);

// Obtenir les journées à venir
router.get(
  '/day-events/upcoming',
  FightController.getUpcomingDayEvents
);

// Obtenir la journée actuelle
router.get(
  '/day-events/current',
  FightController.getCurrentDayEvent
);

// ==================== ROUTES JOURNÉES DE LUTTE (ADMIN) ====================

// Créer une nouvelle journée (Admin seulement)
router.post(
  '/day-events',
  requireAuth,
  requireRole('ADMIN'),
  FightController.createDayEvent
);

// Mettre à jour une journée (Admin seulement)
router.put(
  '/day-events/:eventId',
  requireAuth,
  requireRole('ADMIN'),
  FightController.updateDayEvent
);

// Supprimer une journée (Admin seulement)
router.delete(
  '/day-events/:eventId',
  requireAuth,
  requireRole('ADMIN'),
  FightController.deleteDayEvent
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
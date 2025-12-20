"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/fightRoutes.ts
const express_1 = __importDefault(require("express"));
const FightController_1 = __importDefault(require("../controllers/FightController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validateRequest_1 = require("../middlewares/validateRequest");
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// ==================== ROUTES PUBLIQUES ====================
// Obtenir les détails d'un combat
router.get('/:fightId', [
    (0, express_validator_1.param)('fightId')
        .notEmpty().withMessage('ID du combat requis')
        .isString().withMessage('ID du combat doit être une chaîne')
], validateRequest_1.validateRequest, FightController_1.default.getFight);
// Liste des combats avec filtres
router.get('/', [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(client_1.FightStatus)).withMessage(`Statut invalide. Valeurs acceptées: ${Object.values(client_1.FightStatus).join(', ')}`),
    (0, express_validator_1.query)('fighterId')
        .optional()
        .isString().withMessage('ID du combattant doit être une chaîne'),
    (0, express_validator_1.query)('fromDate')
        .optional()
        .isISO8601().withMessage('Date de début doit être au format ISO8601'),
    (0, express_validator_1.query)('toDate')
        .optional()
        .isISO8601().withMessage('Date de fin doit être au format ISO8601'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
    (0, express_validator_1.query)('offset')
        .optional()
        .isInt({ min: 0 }).withMessage('Offset doit être un entier positif')
], validateRequest_1.validateRequest, FightController_1.default.listFights);
// Obtenir les prochains combats
router.get('/upcoming', [
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('Limite doit être entre 1 et 50')
], validateRequest_1.validateRequest, FightController_1.default.getUpcomingFights);
// Obtenir les combats populaires
router.get('/popular', [
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('Limite doit être entre 1 et 50')
], validateRequest_1.validateRequest, FightController_1.default.getPopularFights);
// ==================== ROUTES ADMIN (COMBATS) ====================
// Créer un nouveau combat (Admin seulement)
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), [
    (0, express_validator_1.body)('title')
        .notEmpty().withMessage('Titre requis')
        .isString().withMessage('Titre doit être une chaîne')
        .isLength({ min: 3, max: 100 }).withMessage('Titre doit contenir entre 3 et 100 caractères'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString().withMessage('Description doit être une chaîne')
        .isLength({ max: 500 }).withMessage('Description ne doit pas dépasser 500 caractères'),
    (0, express_validator_1.body)('location')
        .notEmpty().withMessage('Lieu requis')
        .isString().withMessage('Lieu doit être une chaîne')
        .isLength({ max: 100 }).withMessage('Lieu ne doit pas dépasser 100 caractères'),
    (0, express_validator_1.body)('scheduledAt')
        .notEmpty().withMessage('Date prévue requise')
        .isISO8601().withMessage('Date doit être au format ISO8601'),
    (0, express_validator_1.body)('fighterAId')
        .notEmpty().withMessage('ID du combattant A requis')
        .isString().withMessage('ID du combattant A doit être une chaîne'),
    (0, express_validator_1.body)('fighterBId')
        .notEmpty().withMessage('ID du combattant B requis')
        .isString().withMessage('ID du combattant B doit être une chaîne')
], validateRequest_1.validateRequest, FightController_1.default.createFight);
// Mettre à jour le statut d'un combat (Admin seulement)
router.patch('/:fightId/status', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), [
    (0, express_validator_1.param)('fightId')
        .notEmpty().withMessage('ID du combat requis')
        .isString().withMessage('ID du combat doit être une chaîne'),
    (0, express_validator_1.body)('status')
        .notEmpty().withMessage('Statut requis')
        .isIn(Object.values(client_1.FightStatus)).withMessage(`Statut invalide. Valeurs acceptées: ${Object.values(client_1.FightStatus).join(', ')}`)
], validateRequest_1.validateRequest, FightController_1.default.updateFightStatus);
// Valider le résultat d'un combat (Admin seulement)
router.post('/:fightId/validate-result', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), [
    (0, express_validator_1.param)('fightId')
        .notEmpty().withMessage('ID du combat requis')
        .isString().withMessage('ID du combat doit être une chaîne'),
    (0, express_validator_1.body)('winner')
        .notEmpty().withMessage('Vainqueur requis')
        .isIn(Object.values(client_1.Winner)).withMessage(`Vainqueur invalide. Valeurs acceptées: ${Object.values(client_1.Winner).join(', ')}`),
    (0, express_validator_1.body)('victoryMethod')
        .optional()
        .isString().withMessage('Méthode de victoire doit être une chaîne')
        .isLength({ max: 50 }).withMessage('Méthode de victoire ne doit pas dépasser 50 caractères'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString().withMessage('Notes doivent être une chaîne')
        .isLength({ max: 500 }).withMessage('Notes ne doivent pas dépasser 500 caractères'),
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage('Mot de passe administrateur requis pour confirmation'),
    (0, express_validator_1.body)('otpCode')
        .notEmpty().withMessage('Code OTP requis pour confirmation')
        .isLength({ min: 6, max: 6 }).withMessage('Le code OTP doit comporter 6 chiffres')
], validateRequest_1.validateRequest, FightController_1.default.validateFightResult);
// Demander un OTP pour la validation d'un résultat
router.post('/:fightId/request-validation-otp', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), [
    (0, express_validator_1.param)('fightId')
        .notEmpty().withMessage('ID du combat requis')
        .isString().withMessage('ID du combat doit être une chaîne')
], validateRequest_1.validateRequest, FightController_1.default.requestFightValidationOTP);
// Expirer automatiquement les combats passés (Admin seulement)
router.post('/expire-past', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), FightController_1.default.expirePastFights);
// ==================== ROUTES JOURNÉES DE LUTTE (PUBLIQUES) ====================
// Obtenir les détails d'une journée
router.get('/day-events/:eventId', [
    (0, express_validator_1.param)('eventId')
        .notEmpty().withMessage('ID de la journée requis')
        .isString().withMessage('ID de la journée doit être une chaîne')
], validateRequest_1.validateRequest, FightController_1.default.getDayEvent);
// Liste des journées avec filtres
router.get('/day-events', FightController_1.default.listDayEvents);
// Obtenir les journées à venir
router.get('/day-events/upcoming', FightController_1.default.getUpcomingDayEvents);
// Obtenir la journée actuelle
router.get('/day-events/current', FightController_1.default.getCurrentDayEvent);
// ==================== ROUTES JOURNÉES DE LUTTE (ADMIN) ====================
// Créer une nouvelle journée (Admin seulement)
router.post('/day-events', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), FightController_1.default.createDayEvent);
// Mettre à jour une journée (Admin seulement)
router.put('/day-events/:eventId', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), FightController_1.default.updateDayEvent);
// Supprimer une journée (Admin seulement)
router.delete('/day-events/:eventId', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('ADMIN'), FightController_1.default.deleteDayEvent);
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
exports.default = router;

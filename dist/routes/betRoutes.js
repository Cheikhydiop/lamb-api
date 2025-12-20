"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/betRoutes.ts
const express_1 = __importDefault(require("express"));
const BetController_1 = __importDefault(require("../controllers/BetController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validateRequest_1 = require("../middlewares/validateRequest");
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// ==================== ROUTES PUBLIQUES ====================
// Obtenir les détails d'un pari
router.get('/:betId', [
    (0, express_validator_1.param)('betId')
        .notEmpty().withMessage('ID du pari requis')
        .isString().withMessage('ID du pari doit être une chaîne')
], validateRequest_1.validateRequest, BetController_1.default.getBet);
// Liste des paris avec filtres
router.get('/', [
    (0, express_validator_1.query)('userId')
        .optional()
        .isString().withMessage('ID de l\'utilisateur doit être une chaîne'),
    (0, express_validator_1.query)('fightId')
        .optional()
        .isString().withMessage('ID du combat doit être une chaîne'),
    (0, express_validator_1.query)('dayEventId')
        .optional()
        .isString().withMessage('ID de la journée doit être une chaîne'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(client_1.BetStatus)).withMessage(`Statut invalide. Valeurs acceptées: ${Object.values(client_1.BetStatus).join(', ')}`),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
    (0, express_validator_1.query)('offset')
        .optional()
        .isInt({ min: 0 }).withMessage('Offset doit être un entier positif')
], validateRequest_1.validateRequest, BetController_1.default.listBets);
// Obtenir les paris disponibles pour un combat
router.get('/available/:fightId', [
    (0, express_validator_1.param)('fightId')
        .notEmpty().withMessage('ID du combat requis')
        .isString().withMessage('ID du combat doit être une chaîne')
], validateRequest_1.validateRequest, BetController_1.default.getAvailableBets);
// Obtenir les paris en attente (PENDING)
router.get('/status/pending', [
    (0, express_validator_1.query)('userId')
        .optional()
        .isString().withMessage('ID de l\'utilisateur doit être une chaîne'),
    (0, express_validator_1.query)('fightId')
        .optional()
        .isString().withMessage('ID du combat doit être une chaîne'),
    (0, express_validator_1.query)('dayEventId')
        .optional()
        .isString().withMessage('ID de la journée doit être une chaîne'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limite doit être entre 1 et 100'),
    (0, express_validator_1.query)('offset')
        .optional()
        .isInt({ min: 0 }).withMessage('Offset doit être un entier positif')
], validateRequest_1.validateRequest, BetController_1.default.getPendingBets);
// ==================== ROUTES UTILISATEUR AUTHENTIFIÉ ====================
// Créer un nouveau pari
router.post('/', authMiddleware_1.requireAuth, [
    (0, express_validator_1.body)('fightId')
        .notEmpty().withMessage('ID du combat requis')
        .isString().withMessage('ID du combat doit être une chaîne'),
    (0, express_validator_1.body)('chosenFighter')
        .notEmpty().withMessage('Choix du combattant requis')
        .isIn(['A', 'B']).withMessage('Le choix doit être A ou B'),
    (0, express_validator_1.body)('amount')
        .notEmpty().withMessage('Montant requis')
        .isFloat({ min: 1 }).withMessage('Montant doit être un nombre positif')
], validateRequest_1.validateRequest, BetController_1.default.createBet);
// Accepter un pari
router.post('/:betId/accept', authMiddleware_1.requireAuth, [
    (0, express_validator_1.param)('betId')
        .notEmpty().withMessage('ID du pari requis')
        .isString().withMessage('ID du pari doit être une chaîne')
], validateRequest_1.validateRequest, BetController_1.default.acceptBet);
// Annuler un pari
router.delete('/:betId', authMiddleware_1.requireAuth, [
    (0, express_validator_1.param)('betId')
        .notEmpty().withMessage('ID du pari requis')
        .isString().withMessage('ID du pari doit être une chaîne')
], validateRequest_1.validateRequest, BetController_1.default.cancelBet);
// Obtenir mes paris (créés et acceptés)
router.get('/my-bets', authMiddleware_1.requireAuth, BetController_1.default.getMyBets);
// Obtenir les paris actifs d'un utilisateur
router.get('/active', authMiddleware_1.requireAuth, BetController_1.default.getActiveBets);
// Obtenir les statistiques de paris
router.get('/stats', authMiddleware_1.requireAuth, BetController_1.default.getBetStats);
// ==================== ROUTES ADMIN ====================
// Régler un pari (admin seulement)
router.post('/:betId/settle', authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, [
    (0, express_validator_1.param)('betId')
        .notEmpty().withMessage('ID du pari requis')
        .isString().withMessage('ID du pari doit être une chaîne'),
    (0, express_validator_1.body)('winner')
        .notEmpty().withMessage('Vainqueur requis')
        .isIn(['A', 'B', 'DRAW']).withMessage('Vainqueur invalide. Valeurs acceptées: A, B, DRAW')
], validateRequest_1.validateRequest, BetController_1.default.settleBet);
// Vérifier et expirer les paris (admin seulement)
router.post('/expire-check', authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, BetController_1.default.checkExpiredBets);
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
exports.default = router;

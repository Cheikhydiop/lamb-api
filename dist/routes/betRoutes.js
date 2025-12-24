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
const asyncHandler_1 = require("../middlewares/asyncHandler");
const router = express_1.default.Router();
// ==================== ROUTES PUBLIQUES ====================
/**
 * @swagger
 * tags:
 *   name: Bets
 *   description: Betting management
 */
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
], validateRequest_1.validateRequest, (0, asyncHandler_1.asyncHandler)(BetController_1.default.listBets));
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
router.get('/available/:fightId', [
    (0, express_validator_1.param)('fightId')
        .notEmpty().withMessage('ID du combat requis')
        .isString().withMessage('ID du combat doit être une chaîne')
], validateRequest_1.validateRequest, (0, asyncHandler_1.asyncHandler)(BetController_1.default.getAvailableBets));
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
], validateRequest_1.validateRequest, (0, asyncHandler_1.asyncHandler)(BetController_1.default.getPendingBets));
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
router.get('/my-bets', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(BetController_1.default.getMyBets));
// Obtenir les paris actifs d'un utilisateur - Doit être AVANT /:betId
router.get('/active', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(BetController_1.default.getActiveBets));
// Obtenir les statistiques de paris - Doit être AVANT /:betId
router.get('/stats', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(BetController_1.default.getBetStats));
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
// Obtenir les détails d'un pari - Doit être APRÉS les autres routes GET spécifiques
router.get('/:betId', [
    (0, express_validator_1.param)('betId')
        .notEmpty().withMessage('ID du pari requis')
        .isString().withMessage('ID du pari doit être une chaîne')
], validateRequest_1.validateRequest, (0, asyncHandler_1.asyncHandler)(BetController_1.default.getBet));
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
], validateRequest_1.validateRequest, (0, asyncHandler_1.asyncHandler)(BetController_1.default.createBet));
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
router.post('/:betId/accept', authMiddleware_1.requireAuth, [
    (0, express_validator_1.param)('betId')
        .notEmpty().withMessage('ID du pari requis')
        .isString().withMessage('ID du pari doit être une chaîne')
], validateRequest_1.validateRequest, (0, asyncHandler_1.asyncHandler)(BetController_1.default.acceptBet));
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
router.delete('/:betId', authMiddleware_1.requireAuth, [
    (0, express_validator_1.param)('betId')
        .notEmpty().withMessage('ID du pari requis')
        .isString().withMessage('ID du pari doit être une chaîne')
], validateRequest_1.validateRequest, (0, asyncHandler_1.asyncHandler)(BetController_1.default.cancelBet));
// ==================== ROUTES ADMIN ====================
// Régler un pari (admin seulement)
router.post('/:betId/settle', authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, [
    (0, express_validator_1.param)('betId')
        .notEmpty().withMessage('ID du pari requis')
        .isString().withMessage('ID du pari doit être une chaîne'),
    (0, express_validator_1.body)('winner')
        .notEmpty().withMessage('Vainqueur requis')
        .isIn(['A', 'B', 'DRAW']).withMessage('Vainqueur invalide. Valeurs acceptées: A, B, DRAW')
], validateRequest_1.validateRequest, (0, asyncHandler_1.asyncHandler)(BetController_1.default.settleBet));
// Vérifier et expirer les paris (admin seulement)
router.post('/expire-check', authMiddleware_1.requireAuth, authMiddleware_1.requireAdmin, (0, asyncHandler_1.asyncHandler)(BetController_1.default.checkExpiredBets));
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

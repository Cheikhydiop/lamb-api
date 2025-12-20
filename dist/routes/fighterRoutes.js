"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const fighter_dto_1 = require("../dto/fighter.dto");
const FighterController_1 = __importDefault(require("../controllers/FighterController"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Fighters
 *   description: Fighter management
 */
/**
 * @swagger
 * /api/fighters:
 *   get:
 *     summary: List all fighters
 *     tags: [Fighters]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of fighters
 */
// List fighters
router.get('/', (0, validation_middleware_1.validateRequest)(fighter_dto_1.ListFightersDTO), FighterController_1.default.listFighters);
/**
 * @swagger
 * /api/fighters/search:
 *   get:
 *     summary: Search fighters
 *     tags: [Fighters]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
// Search fighters
router.get('/search', (req, res) => { FighterController_1.default.searchFighters(req, res); });
/**
 * @swagger
 * /api/fighters/top:
 *   get:
 *     summary: Get top performing fighters
 *     tags: [Fighters]
 *     responses:
 *       200:
 *         description: List of top fighters
 */
// Get top fighters
router.get('/top', FighterController_1.default.getTopFighters);
/**
 * @swagger
 * /api/fighters/{fighterId}:
 *   get:
 *     summary: Get fighter details
 *     tags: [Fighters]
 *     parameters:
 *       - in: path
 *         name: fighterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fighter details
 *       404:
 *         description: Fighter not found
 */
// Get fighter by ID
router.get('/:fighterId', FighterController_1.default.getFighterById);
/**
 * @swagger
 * /api/fighters/{fighterId}/stats:
 *   get:
 *     summary: Get fighter statistics
 *     tags: [Fighters]
 *     parameters:
 *       - in: path
 *         name: fighterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fighter statistics
 */
// Get fighter stats
router.get('/:fighterId/stats', FighterController_1.default.getFighterStats);
/**
 * @swagger
 * /api/fighters:
 *   post:
 *     summary: Create a new fighter (Admin)
 *     tags: [Fighters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fighter created
 *       403:
 *         description: Admin access required
 */
// Create fighter (admin only)
router.post('/', authMiddleware_1.requireAdmin, (0, validation_middleware_1.validateRequest)(fighter_dto_1.CreateFighterDTO), FighterController_1.default.createFighter);
// Update fighter (admin only)
router.patch('/:fighterId', authMiddleware_1.requireAdmin, (0, validation_middleware_1.validateRequest)(fighter_dto_1.UpdateFighterDTO), FighterController_1.default.updateFighter);
// Delete fighter (admin only)
router.delete('/:fighterId', authMiddleware_1.requireAdmin, FighterController_1.default.deleteFighter);
exports.default = router;

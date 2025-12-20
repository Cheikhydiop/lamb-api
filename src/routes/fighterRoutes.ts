import { Router } from 'express';
import { validateRequest } from '../middlewares/validation.middleware';
import { requireAdmin } from '../middlewares/authMiddleware';
import { CreateFighterDTO, UpdateFighterDTO, ListFightersDTO } from '../dto/fighter.dto';
import FighterController from '../controllers/FighterController';

const router = Router();

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
router.get('/',
  validateRequest(ListFightersDTO),
  FighterController.listFighters
);

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
router.get('/search',
  (req, res) => { FighterController.searchFighters(req, res); }
);

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
router.get('/top',
  FighterController.getTopFighters
);

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
router.get('/:fighterId',
  FighterController.getFighterById
);

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
router.get('/:fighterId/stats',
  FighterController.getFighterStats
);

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
router.post('/',
  requireAdmin,
  validateRequest(CreateFighterDTO),
  FighterController.createFighter
);

// Update fighter (admin only)
router.patch('/:fighterId',
  requireAdmin,
  validateRequest(UpdateFighterDTO),
  FighterController.updateFighter
);

// Delete fighter (admin only)
router.delete('/:fighterId',
  requireAdmin,
  FighterController.deleteFighter
);

export default router;
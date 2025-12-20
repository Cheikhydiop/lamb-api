import { Router } from 'express';
import { validateRequest } from '../middlewares/validation.middleware';
import { requireAdmin } from '../middlewares/authMiddleware';
import { CreateFighterDTO, UpdateFighterDTO, ListFightersDTO } from '../dto/fighter.dto';
import FighterController from '../controllers/FighterController';

const router = Router();

// List fighters
router.get('/',
  validateRequest(ListFightersDTO),
  FighterController.listFighters
);

// Search fighters
router.get('/search',
  (req, res) => { FighterController.searchFighters(req, res); }
);

// Get top fighters
router.get('/top',
  FighterController.getTopFighters
);

// Get fighter by ID
router.get('/:fighterId',
  FighterController.getFighterById
);

// Get fighter stats
router.get('/:fighterId/stats',
  FighterController.getFighterStats
);

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
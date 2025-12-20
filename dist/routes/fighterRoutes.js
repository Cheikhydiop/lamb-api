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
// List fighters
router.get('/', (0, validation_middleware_1.validateRequest)(fighter_dto_1.ListFightersDTO), FighterController_1.default.listFighters);
// Search fighters
router.get('/search', FighterController_1.default.searchFighters);
// Get top fighters
router.get('/top', FighterController_1.default.getTopFighters);
// Get fighter by ID
router.get('/:fighterId', FighterController_1.default.getFighterById);
// Get fighter stats
router.get('/:fighterId/stats', FighterController_1.default.getFighterStats);
// Create fighter (admin only)
router.post('/', authMiddleware_1.requireAdmin, (0, validation_middleware_1.validateRequest)(fighter_dto_1.CreateFighterDTO), FighterController_1.default.createFighter);
// Update fighter (admin only)
router.patch('/:fighterId', authMiddleware_1.requireAdmin, (0, validation_middleware_1.validateRequest)(fighter_dto_1.UpdateFighterDTO), FighterController_1.default.updateFighter);
// Delete fighter (admin only)
router.delete('/:fighterId', authMiddleware_1.requireAdmin, FighterController_1.default.deleteFighter);
exports.default = router;

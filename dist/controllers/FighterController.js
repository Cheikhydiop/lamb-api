"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const asyncHandler_1 = require("../middlewares/asyncHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const FighterService_1 = require("../services/FighterService");
const client_1 = require("@prisma/client");
// Instanciation manuelle comme dans AuthController
const prisma = new client_1.PrismaClient();
const fighterService = new FighterService_1.FighterService(prisma);
class FighterController {
    /**
     * GET /api/fighters/search
     * Recherche de lutteurs
     */
    // Dans FighterController.ts
    static searchFighters(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Vérifier si le paramètre 'query' est présent
                const { query } = req.query;
                if (!query || typeof query !== 'string') {
                    return res.status(400).json({
                        success: false,
                        message: "Paramètre de recherche requis"
                    });
                }
                const limit = req.query.limit
                    ? parseInt(req.query.limit)
                    : 20;
                const fighters = yield fighterService.searchFighters(query, limit);
                return res.status(200).json({
                    success: true,
                    data: fighters
                });
            }
            catch (error) {
                logger_1.default.error('Erreur dans searchFighters:', error);
                return res.status(500).json({
                    success: false,
                    message: "Erreur serveur"
                });
            }
        });
    }
}
_a = FighterController;
/**
 * GET /api/fighters
 * Récupération de la liste des lutteurs
 */
FighterController.listFighters = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = {
            search: req.query.search,
            status: req.query.status,
            stable: req.query.stable,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0,
            orderBy: req.query.orderBy || 'name',
            orderDirection: req.query.orderDirection || 'asc'
        };
        const result = yield fighterService.listFighters(filters);
        res.status(200).json({
            success: true,
            data: result.fighters,
            pagination: {
                total: result.total,
                limit: result.limit,
                offset: result.offset,
                hasMore: result.offset + result.limit < result.total
            }
        });
    }
    catch (error) {
        logger_1.default.error('Erreur lors de la récupération des lutteurs:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la récupération des lutteurs'
        });
    }
}));
/**
 * GET /api/fighters/:fighterId
 * Récupération d'un lutteur par son ID
 */
FighterController.getFighterById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fighterId } = req.params;
        if (!fighterId) {
            res.status(400).json({
                success: false,
                message: 'ID du lutteur requis'
            });
            return;
        }
        const fighter = yield fighterService.getFighter(fighterId);
        res.status(200).json({
            success: true,
            data: fighter
        });
    }
    catch (error) {
        logger_1.default.error('Erreur lors de la récupération du lutteur:', error);
        res.status(404).json({
            success: false,
            message: error.message || 'Lutteur non trouvé'
        });
    }
}));
/**
 * POST /api/fighters
 * Création d'un nouveau lutteur
 */
FighterController.createFighter = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fighter = yield fighterService.createFighter(req.body);
        res.status(201).json({
            success: true,
            message: 'Lutteur créé avec succès',
            data: fighter
        });
    }
    catch (error) {
        logger_1.default.error('Erreur lors de la création du lutteur:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de la création du lutteur'
        });
    }
}));
/**
 * PATCH /api/fighters/:fighterId
 * Mise à jour d'un lutteur
 */
FighterController.updateFighter = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fighterId } = req.params;
        const fighter = yield fighterService.updateFighter(fighterId, req.body);
        res.status(200).json({
            success: true,
            message: 'Lutteur mis à jour avec succès',
            data: fighter
        });
    }
    catch (error) {
        logger_1.default.error('Erreur lors de la mise à jour du lutteur:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de la mise à jour du lutteur'
        });
    }
}));
/**
 * DELETE /api/fighters/:fighterId
 * Suppression d'un lutteur
 */
FighterController.deleteFighter = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fighterId } = req.params;
        yield fighterService.deleteFighter(fighterId);
        res.status(200).json({
            success: true,
            message: 'Lutteur supprimé avec succès'
        });
    }
    catch (error) {
        logger_1.default.error('Erreur lors de la suppression du lutteur:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de la suppression du lutteur'
        });
    }
}));
/**
 * GET /api/fighters/top
 * Récupération des meilleurs lutteurs
 */
FighterController.getTopFighters = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const fighters = yield fighterService.getTopFighters(limit);
        res.status(200).json({
            success: true,
            data: fighters
        });
    }
    catch (error) {
        logger_1.default.error('Erreur lors de la récupération des top lutteurs:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur'
        });
    }
}));
/**
 * GET /api/fighters/:fighterId/stats
 * Récupération des statistiques d'un lutteur
 */
FighterController.getFighterStats = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fighterId } = req.params;
        const stats = yield fighterService.getFighterStats(fighterId);
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.default.error('Erreur lors de la récupération des stats:', error);
        res.status(404).json({
            success: false,
            message: error.message || 'Stats non trouvées'
        });
    }
}));
exports.default = FighterController;

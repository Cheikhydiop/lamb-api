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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const asyncHandler_1 = require("../middlewares/asyncHandler");
const ServiceContainer_1 = require("../container/ServiceContainer");
class BetController {
    static get services() {
        return ServiceContainer_1.ServiceContainer.getInstance();
    }
}
_a = BetController;
/**
 * POST /api/bets
 * Créer un nouveau pari
 */
BetController.createBet = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'Non authentifié'
        });
        return;
    }
    const { fightId, amount, chosenFighter } = req.body;
    if (!fightId || !amount || !chosenFighter) {
        res.status(400).json({
            success: false,
            message: 'Données invalides: fightId, amount et chosenFighter sont requis'
        });
        return;
    }
    if (!['A', 'B'].includes(chosenFighter)) {
        res.status(400).json({
            success: false,
            message: 'chosenFighter doit être "A" ou "B"'
        });
        return;
    }
    const betData = {
        fightId,
        amount: BigInt(amount),
        chosenFighter: chosenFighter
    };
    const bet = yield _a.services.betService.createBet(userId, betData);
    res.status(201).json({
        success: true,
        message: 'Pari créé avec succès',
        data: bet
    });
}));
/**
 * POST /api/bets/:betId/accept
 * Accepter un pari
 */
BetController.acceptBet = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const { betId } = req.params;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'Non authentifié'
        });
        return;
    }
    if (!betId) {
        res.status(400).json({
            success: false,
            message: 'ID du pari requis'
        });
        return;
    }
    const bet = yield _a.services.betService.acceptBet(userId, betId);
    res.status(200).json({
        success: true,
        message: 'Pari accepté avec succès',
        data: bet
    });
}));
/**
 * DELETE /api/bets/:betId
 * Annuler un pari
 */
BetController.cancelBet = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const { betId } = req.params;
    const isAdmin = ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === 'ADMIN';
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'Non authentifié'
        });
        return;
    }
    if (!betId) {
        res.status(400).json({
            success: false,
            message: 'ID du pari requis'
        });
        return;
    }
    const bet = yield _a.services.betService.cancelBet(betId, userId, isAdmin);
    res.status(200).json({
        success: true,
        message: 'Pari annulé avec succès',
        data: bet
    });
}));
/**
 * GET /api/bets/:betId
 * Obtenir les détails d'un pari
 */
BetController.getBet = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { betId } = req.params;
    if (!betId) {
        res.status(400).json({
            success: false,
            message: 'ID du pari requis'
        });
        return;
    }
    const bet = yield _a.services.betService.getBet(betId);
    res.status(200).json({
        success: true,
        data: bet
    });
}));
/**
 * GET /api/bets
 * Liste des paris avec filtres
 */
BetController.listBets = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.query.userId;
    const fightId = req.query.fightId;
    const dayEventId = req.query.dayEventId;
    const status = req.query.status;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const result = yield _a.services.betService.listBets({
        userId,
        fightId,
        dayEventId,
        status,
        limit,
        offset
    });
    res.status(200).json({
        success: true,
        data: result.bets,
        pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            hasMore: result.offset + result.limit < result.total
        }
    });
}));
BetController.getPendingBets = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.query.userId;
    const fightId = req.query.fightId;
    const dayEventId = req.query.dayEventId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const result = yield _a.services.betService.getPendingBets({
        userId,
        fightId,
        dayEventId,
        limit,
        offset
    });
    res.status(200).json({
        success: true,
        data: result.bets,
        pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            hasMore: result.offset + result.limit < result.total
        }
    });
}));
/**
 * GET /api/bets/available/:fightId
 * Obtenir les paris disponibles pour un combat
 */
BetController.getAvailableBets = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fightId } = req.params;
    if (!fightId) {
        res.status(400).json({
            success: false,
            message: 'ID du combat requis'
        });
        return;
    }
    const bets = yield _a.services.betService.getAvailableBets(fightId);
    res.status(200).json({
        success: true,
        data: bets
    });
}));
/**
 * GET /api/bets/my-bets
 * Obtenir mes paris (créés et acceptés)
 */
BetController.getMyBets = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'Non authentifié'
        });
        return;
    }
    const bets = yield _a.services.betService.getUserBets(userId);
    res.status(200).json({
        success: true,
        data: bets
    });
}));
/**
 * GET /api/bets/active
 * Obtenir les paris actifs d'un utilisateur
 */
BetController.getActiveBets = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'Non authentifié'
        });
        return;
    }
    const bets = yield _a.services.betService.getActiveBetsForUser(userId);
    res.status(200).json({
        success: true,
        data: bets
    });
}));
/**
 * GET /api/bets/stats
 * Obtenir les statistiques de paris d'un utilisateur
 */
BetController.getBetStats = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'Non authentifié'
        });
        return;
    }
    const stats = yield _a.services.betService.getBetStats(userId);
    res.status(200).json({
        success: true,
        data: stats
    });
}));
/**
 * POST /api/bets/:betId/settle
 * Régler un pari (admin seulement)
 */
BetController.settleBet = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
    const { betId } = req.params;
    const { winner } = req.body;
    if (!isAdmin) {
        res.status(403).json({
            success: false,
            message: 'Accès interdit: administrateur requis'
        });
        return;
    }
    if (!betId || !winner) {
        res.status(400).json({
            success: false,
            message: 'betId et winner sont requis'
        });
        return;
    }
    if (!['A', 'B', 'DRAW'].includes(winner)) {
        res.status(400).json({
            success: false,
            message: 'winner doit être "A", "B" ou "DRAW"'
        });
        return;
    }
    const bet = yield _a.services.betService.settleBet(betId, winner);
    res.status(200).json({
        success: true,
        message: 'Pari réglé avec succès',
        data: bet
    });
}));
/**
 * POST /api/bets/expire-check
 * Vérifier et expirer les paris (tâche cron/admin)
 */
BetController.checkExpiredBets = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
    if (!isAdmin) {
        res.status(403).json({
            success: false,
            message: 'Accès interdit: administrateur requis'
        });
        return;
    }
    const expiredPending = yield _a.services.betService.expirePendingBetsBeforeFight();
    res.status(200).json({
        success: true,
        message: 'Vérification des paris expirés effectuée',
        data: {
            expiredPendingBets: expiredPending
        }
    });
}));
exports.default = BetController;

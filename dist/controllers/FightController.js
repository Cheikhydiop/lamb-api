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
Object.defineProperty(exports, "__esModule", { value: true });
const FightService_1 = require("../services/FightService");
const BetService_1 = require("../services/BetService");
const WebSocketService_1 = require("../services/WebSocketService");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
// Créer les instances des dépendances
const prisma = new client_1.PrismaClient();
const webSocketService = new WebSocketService_1.WebSocketService();
const betService = new BetService_1.BetService(prisma, webSocketService);
// Créer une instance du service avec les dépendances
const fightService = new FightService_1.FightService(prisma, betService, webSocketService);
// Déclaration globale pour req.user
// (Global declaration removed to avoid conflict with express.d.ts)
class FightController {
    // ========== COMBATS INDIVIDUELS ==========
    createFight(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!adminId) {
                    res.status(401).json({
                        success: false,
                        message: 'Non authentifié'
                    });
                    return;
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN' && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'SUPER_ADMIN') {
                    res.status(403).json({
                        success: false,
                        message: 'Accès réservé aux administrateurs'
                    });
                    return;
                }
                const fightData = {
                    title: req.body.title,
                    description: req.body.description,
                    location: req.body.location,
                    scheduledAt: req.body.scheduledAt,
                    fighterAId: req.body.fighterAId,
                    fighterBId: req.body.fighterBId,
                    oddsA: req.body.oddsA,
                    oddsB: req.body.oddsB,
                    dayEventId: req.body.dayEventId
                };
                // Validation basique
                if (!fightData.title || !fightData.scheduledAt || !fightData.fighterAId || !fightData.fighterBId) {
                    res.status(400).json({
                        success: false,
                        message: 'Champs requis manquants: title, scheduledAt, fighterAId, fighterBId'
                    });
                    return;
                }
                const fight = yield fightService.createFight(fightData);
                res.status(201).json({
                    success: true,
                    message: 'Combat créé avec succès',
                    data: fight
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la création du combat:', error);
                res.status(400).json({
                    success: false,
                    message: error.message || 'Erreur lors de la création du combat'
                });
            }
        });
    }
    getFight(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fightId } = req.params;
                if (!fightId) {
                    res.status(400).json({
                        success: false,
                        message: 'ID du combat requis'
                    });
                    return;
                }
                const fight = yield fightService.getFight(fightId);
                res.status(200).json({
                    success: true,
                    data: fight
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération du combat:', error);
                if (error.message === 'Combat non trouvé') {
                    res.status(404).json({
                        success: false,
                        message: error.message
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        message: error.message || 'Erreur serveur'
                    });
                }
            }
        });
    }
    listFights(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filters = {
                    status: req.query.status,
                    fighterId: req.query.fighterId,
                    limit: req.query.limit ? parseInt(req.query.limit) : 20,
                    offset: req.query.offset ? parseInt(req.query.offset) : 0,
                    fromDate: req.query.fromDate ? new Date(req.query.fromDate) : undefined,
                    toDate: req.query.toDate ? new Date(req.query.toDate) : undefined
                };
                const result = yield fightService.listFights(filters);
                res.status(200).json({
                    success: true,
                    data: result.fights,
                    pagination: {
                        total: result.total,
                        limit: result.limit,
                        offset: result.offset,
                        hasMore: result.offset + result.limit < result.total
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des combats:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    updateFightStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { fightId } = req.params;
                if (!adminId) {
                    res.status(401).json({
                        success: false,
                        message: 'Non authentifié'
                    });
                    return;
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN' && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'SUPER_ADMIN') {
                    res.status(403).json({
                        success: false,
                        message: 'Accès réservé aux administrateurs'
                    });
                    return;
                }
                if (!fightId) {
                    res.status(400).json({
                        success: false,
                        message: 'ID du combat requis'
                    });
                    return;
                }
                const statusData = {
                    status: req.body.status
                };
                if (!Object.values(client_2.FightStatus).includes(statusData.status)) {
                    res.status(400).json({
                        success: false,
                        message: `Statut invalide. Valeurs acceptées: ${Object.values(client_2.FightStatus).join(', ')}`
                    });
                    return;
                }
                const fight = yield fightService.updateFightStatus(fightId, statusData);
                res.status(200).json({
                    success: true,
                    message: 'Statut du combat mis à jour avec succès',
                    data: fight
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la mise à jour du statut du combat:', error);
                res.status(400).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    requestFightValidationOTP(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { fightId } = req.params;
                if (!adminId) {
                    res.status(401).json({ success: false, message: 'Non authentifié' });
                    return;
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN' && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'SUPER_ADMIN') {
                    res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
                    return;
                }
                const result = yield fightService.requestFightValidationOTP(adminId, fightId);
                res.status(200).json(result);
            }
            catch (error) {
                logger_1.default.error('Erreur requestFightValidationOTP:', error);
                res.status(500).json({ success: false, message: error.message || 'Erreur serveur' });
            }
        });
    }
    validateFightResult(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { fightId } = req.params;
                if (!adminId) {
                    res.status(401).json({
                        success: false,
                        message: 'Non authentifié'
                    });
                    return;
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN' && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'SUPER_ADMIN') {
                    res.status(403).json({
                        success: false,
                        message: 'Accès réservé aux administrateurs'
                    });
                    return;
                }
                if (!fightId) {
                    res.status(400).json({
                        success: false,
                        message: 'ID du combat requis'
                    });
                    return;
                }
                const resultData = {
                    fightId,
                    winner: req.body.winner,
                    victoryMethod: req.body.victoryMethod,
                    round: req.body.round,
                    duration: req.body.duration,
                    notes: req.body.notes,
                    password: req.body.password,
                    otpCode: req.body.otpCode
                };
                if (!Object.values(client_2.Winner).includes(resultData.winner)) {
                    res.status(400).json({
                        success: false,
                        message: `Vainqueur invalide. Valeurs acceptées: ${Object.values(client_2.Winner).join(', ')}`
                    });
                    return;
                }
                const result = yield fightService.validateFightResult(adminId, resultData);
                res.status(200).json({
                    success: true,
                    message: 'Résultat du combat validé avec succès',
                    data: result
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la validation du résultat du combat:', error);
                res.status(400).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    getUpcomingFights(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                const fights = yield fightService.getUpcomingFights(limit);
                res.status(200).json({
                    success: true,
                    data: fights
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des prochains combats:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    getPopularFights(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                const fights = yield fightService.getPopularFights(limit);
                res.status(200).json({
                    success: true,
                    data: fights
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des combats populaires:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    // ========== JOURNÉES DE LUTTE ==========
    createDayEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!adminId) {
                    res.status(401).json({
                        success: false,
                        message: 'Non authentifié'
                    });
                    return;
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN' && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'SUPER_ADMIN') {
                    res.status(403).json({
                        success: false,
                        message: 'Accès réservé aux administrateurs'
                    });
                    return;
                }
                const dayEventData = {
                    title: req.body.title,
                    date: req.body.date,
                    location: req.body.location,
                    description: req.body.description,
                    bannerImage: req.body.bannerImage,
                    isFeatured: req.body.isFeatured,
                    fights: req.body.fights
                };
                // Validation basique
                if (!dayEventData.title || !dayEventData.date || !dayEventData.location) {
                    res.status(400).json({
                        success: false,
                        message: 'Champs requis manquants: title, date, location'
                    });
                    return;
                }
                if (dayEventData.fights && dayEventData.fights.length !== 5) {
                    res.status(400).json({
                        success: false,
                        message: 'Une journée doit avoir exactement 5 combats si spécifiés'
                    });
                    return;
                }
                const dayEvent = yield fightService.createDayEvent(dayEventData);
                res.status(201).json({
                    success: true,
                    message: 'Journée de lutte créée avec succès',
                    data: dayEvent
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la création de la journée:', error);
                res.status(400).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    getDayEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { eventId } = req.params;
                if (!eventId) {
                    res.status(400).json({
                        success: false,
                        message: 'ID de la journée requis'
                    });
                    return;
                }
                const dayEvent = yield fightService.getDayEvent(eventId);
                res.status(200).json({
                    success: true,
                    data: dayEvent
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération de la journée:', error);
                if (error.message === 'Journée non trouvée') {
                    res.status(404).json({
                        success: false,
                        message: error.message
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        message: error.message || 'Erreur serveur'
                    });
                }
            }
        });
    }
    listDayEvents(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filters = {
                    status: req.query.status,
                    limit: req.query.limit ? parseInt(req.query.limit) : 20,
                    offset: req.query.offset ? parseInt(req.query.offset) : 0,
                    fromDate: req.query.fromDate ? new Date(req.query.fromDate) : undefined,
                    toDate: req.query.toDate ? new Date(req.query.toDate) : undefined
                };
                const result = yield fightService.listDayEvents(filters);
                res.status(200).json({
                    success: true,
                    data: result.events,
                    pagination: {
                        total: result.total,
                        limit: result.limit,
                        offset: result.offset,
                        hasMore: result.offset + result.limit < result.total
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des journées:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    getUpcomingDayEvents(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                const events = yield fightService.getUpcomingDayEvents(limit);
                res.status(200).json({
                    success: true,
                    data: events
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des journées à venir:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    getCurrentDayEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dayEvent = yield fightService.getCurrentDayEvent();
                if (!dayEvent) {
                    res.status(200).json({
                        success: true,
                        data: null,
                        message: 'Aucune journée en cours'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    data: dayEvent
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération de la journée actuelle:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    updateDayEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { eventId } = req.params;
                if (!adminId) {
                    res.status(401).json({
                        success: false,
                        message: 'Non authentifié'
                    });
                    return;
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN' && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'SUPER_ADMIN') {
                    res.status(403).json({
                        success: false,
                        message: 'Accès réservé aux administrateurs'
                    });
                    return;
                }
                if (!eventId) {
                    res.status(400).json({
                        success: false,
                        message: 'ID de la journée requis'
                    });
                    return;
                }
                const eventData = {
                    title: req.body.title,
                    date: req.body.date,
                    location: req.body.location,
                    description: req.body.description,
                    bannerImage: req.body.bannerImage,
                    isFeatured: req.body.isFeatured,
                    status: req.body.status
                };
                const updatedEvent = yield fightService.updateDayEvent(eventId, eventData);
                res.status(200).json({
                    success: true,
                    message: 'Journée mise à jour avec succès',
                    data: updatedEvent
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la mise à jour de la journée:', error);
                res.status(400).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    deleteDayEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { eventId } = req.params;
                if (!adminId) {
                    res.status(401).json({
                        success: false,
                        message: 'Non authentifié'
                    });
                    return;
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN' && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'SUPER_ADMIN') {
                    res.status(403).json({
                        success: false,
                        message: 'Accès réservé aux administrateurs'
                    });
                    return;
                }
                if (!eventId) {
                    res.status(400).json({
                        success: false,
                        message: 'ID de la journée requis'
                    });
                    return;
                }
                const result = yield fightService.deleteDayEvent(eventId);
                res.status(200).json({
                    success: true,
                    message: 'Journée supprimée avec succès',
                    data: result
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la suppression de la journée:', error);
                res.status(400).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
    expirePastFights(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!adminId) {
                    res.status(401).json({
                        success: false,
                        message: 'Non authentifié'
                    });
                    return;
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN' && ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'SUPER_ADMIN') {
                    res.status(403).json({
                        success: false,
                        message: 'Accès réservé aux administrateurs'
                    });
                    return;
                }
                const expiredCount = yield fightService.expirePastFights();
                res.status(200).json({
                    success: true,
                    message: `Expiration des combats terminée`,
                    data: {
                        expiredCount
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de l\'expiration des combats:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Erreur serveur'
                });
            }
        });
    }
}
// Exportez une instance de la classe
exports.default = new FightController();

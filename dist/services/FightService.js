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
exports.FightService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const EmailService_1 = require("./EmailService");
const BetService_1 = require("./BetService");
const logger_1 = __importDefault(require("../utils/logger"));
const date_fns_1 = require("date-fns");
class FightService {
    constructor(prisma, betService, webSocketService, emailService) {
        this.COMMISSION_PERCENTAGE = 10;
        this.prisma = prisma || new client_1.PrismaClient();
        // BetService constructor accepts optional WebSocketService
        if (betService) {
            this.betService = betService;
        }
        else if (webSocketService) {
            this.betService = new BetService_1.BetService(this.prisma, webSocketService);
        }
        else {
            // BetService requires WebSocketService - throw error if not provided
            throw new Error('FightService requires either betService or webSocketService');
        }
        this.webSocketService = webSocketService;
        this.emailService = emailService || new EmailService_1.EmailService();
    }
    requestFightValidationOTP(adminId, fightId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const admin = yield this.prisma.user.findUnique({
                    where: { id: adminId }
                });
                if (!admin || !admin.email) {
                    throw new Error('Administrateur non trouvé ou sans email');
                }
                const fight = yield this.prisma.fight.findUnique({
                    where: { id: fightId }
                });
                if (!fight) {
                    throw new Error('Combat non trouvé');
                }
                // Générer OTP (6 chiffres)
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
                // Invalider les anciens codes de validation pour cet admin
                yield this.prisma.otpCode.updateMany({
                    where: {
                        userId: adminId,
                        purpose: 'FIGHT_RESULT_VALIDATION',
                        consumed: false
                    },
                    data: { consumed: true }
                });
                // Créer le nouveau code
                yield this.prisma.otpCode.create({
                    data: {
                        code,
                        purpose: 'FIGHT_RESULT_VALIDATION',
                        expiresAt,
                        userId: adminId
                    }
                });
                // Envoyer l'email
                yield this.emailService.sendFightValidationOTP(admin.email, code, fight.title);
                return { success: true, message: 'OTP envoyé avec succès' };
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la demande d\'OTP de validation:', error);
                throw error;
            }
        });
    }
    // ========== COMBATS INDIVIDUELS ==========
    createFight(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Vérifier que les deux lutteurs existent et sont actifs
                const fighters = yield this.prisma.fighter.findMany({
                    where: {
                        id: { in: [data.fighterAId, data.fighterBId] },
                        status: 'ACTIVE'
                    }
                });
                if (fighters.length !== 2) {
                    throw new Error('Un ou plusieurs lutteurs sont invalides ou inactifs');
                }
                // Vérifier que les deux lutteurs sont différents
                if (data.fighterAId === data.fighterBId) {
                    throw new Error('Un lutteur ne peut pas combattre contre lui-même');
                }
                const fight = yield this.prisma.fight.create({
                    data: {
                        title: data.title,
                        description: data.description,
                        location: data.location,
                        scheduledAt: new Date(data.scheduledAt),
                        fighterAId: data.fighterAId,
                        fighterBId: data.fighterBId,
                        status: client_1.FightStatus.SCHEDULED
                    },
                    include: {
                        fighterA: true,
                        fighterB: true
                    }
                });
                logger_1.default.info(`Combat créé: ${fight.id} - ${fight.title}`);
                return fight;
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la création du combat:', error);
                throw error;
            }
        });
    }
    getFight(fightId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fight = yield this.prisma.fight.findUnique({
                    where: { id: fightId },
                    include: {
                        fighterA: true,
                        fighterB: true,
                        dayEvent: true,
                        result: true,
                        bets: {
                            include: {
                                creator: {
                                    select: {
                                        id: true,
                                        name: true,
                                        phone: true
                                    }
                                },
                                acceptor: {
                                    select: {
                                        id: true,
                                        name: true,
                                        phone: true
                                    }
                                }
                            },
                            where: {
                                OR: [
                                    { status: 'PENDING' },
                                    { status: 'ACCEPTED' }
                                ]
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 20
                        }
                    }
                });
                if (!fight) {
                    throw new Error('Combat non trouvé');
                }
                return fight;
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la récupération du combat ${fightId}:`, error);
                throw error;
            }
        });
    }
    listFights(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, fighterId, fromDate, toDate, limit = 20, offset = 0 } = filters;
                const where = {};
                if (status) {
                    where.status = status;
                }
                if (fighterId) {
                    where.OR = [
                        { fighterAId: fighterId },
                        { fighterBId: fighterId }
                    ];
                }
                if (fromDate || toDate) {
                    where.scheduledAt = {};
                    if (fromDate)
                        where.scheduledAt.gte = new Date(fromDate);
                    if (toDate)
                        where.scheduledAt.lte = new Date(toDate);
                }
                const [fights, total] = yield Promise.all([
                    this.prisma.fight.findMany({
                        where,
                        include: {
                            fighterA: true,
                            fighterB: true,
                            dayEvent: true,
                            result: true
                        },
                        take: limit,
                        skip: offset,
                        orderBy: { scheduledAt: 'desc' }
                    }),
                    this.prisma.fight.count({ where })
                ]);
                return {
                    fights,
                    total,
                    limit,
                    offset
                };
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des combats:', error);
                throw error;
            }
        });
    }
    getUpcomingFights() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            try {
                const now = new Date();
                return yield this.prisma.fight.findMany({
                    where: {
                        status: client_1.FightStatus.SCHEDULED,
                        scheduledAt: { gt: now }
                    },
                    include: {
                        fighterA: true,
                        fighterB: true,
                        dayEvent: true,
                        _count: {
                            select: {
                                bets: true
                            }
                        }
                    },
                    take: limit,
                    orderBy: { scheduledAt: 'asc' }
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des prochains combats:', error);
                throw error;
            }
        });
    }
    getPopularFights() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            try {
                const now = new Date();
                return yield this.prisma.fight.findMany({
                    where: {
                        status: client_1.FightStatus.SCHEDULED,
                        scheduledAt: { gt: now }
                    },
                    include: {
                        fighterA: true,
                        fighterB: true,
                        dayEvent: true,
                        _count: {
                            select: {
                                bets: true
                            }
                        }
                    },
                    take: limit,
                    orderBy: {
                        bets: {
                            _count: 'desc'
                        }
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des combats populaires:', error);
                throw error;
            }
        });
    }
    updateFightStatus(fightId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const fight = yield this.prisma.fight.findUnique({
                    where: { id: fightId },
                    include: {
                        fighterA: true,
                        fighterB: true,
                        dayEvent: true
                    }
                });
                if (!fight) {
                    throw new Error('Combat non trouvé');
                }
                // Validation des transitions de statut
                const validTransitions = {
                    [client_1.FightStatus.SCHEDULED]: [client_1.FightStatus.ONGOING, client_1.FightStatus.CANCELLED, client_1.FightStatus.POSTPONED],
                    [client_1.FightStatus.ONGOING]: [client_1.FightStatus.FINISHED, client_1.FightStatus.CANCELLED],
                    [client_1.FightStatus.FINISHED]: [],
                    [client_1.FightStatus.CANCELLED]: [],
                    [client_1.FightStatus.POSTPONED]: [client_1.FightStatus.SCHEDULED, client_1.FightStatus.CANCELLED]
                };
                const currentStatus = fight.status;
                const newStatus = data.status;
                if (!((_a = validTransitions[currentStatus]) === null || _a === void 0 ? void 0 : _a.includes(newStatus))) {
                    throw new Error(`Transition de statut invalide: ${currentStatus} -> ${newStatus}`);
                }
                const updatedFight = yield this.prisma.fight.update({
                    where: { id: fightId },
                    data: Object.assign(Object.assign({ status: newStatus }, (newStatus === client_1.FightStatus.ONGOING && { startedAt: new Date() })), (newStatus === client_1.FightStatus.FINISHED && { endedAt: new Date() })),
                    include: {
                        fighterA: true,
                        fighterB: true,
                        dayEvent: true
                    }
                });
                // Notifications
                let notificationMessage = '';
                let notificationTitle = '';
                switch (newStatus) {
                    case client_1.FightStatus.ONGOING:
                        notificationTitle = 'Combat en cours !';
                        notificationMessage = `Le combat "${fight.title}" entre ${fight.fighterA.name} et ${fight.fighterB.name} a commencé !`;
                        // Annuler et rembourser les paris en attente (car le combat a commencé)
                        const pendingBets = yield this.prisma.bet.findMany({
                            where: {
                                fightId: fightId,
                                status: 'PENDING'
                            },
                            include: { creator: true }
                        });
                        if (pendingBets.length > 0) {
                            logger_1.default.info(`Combat commencé : ${pendingBets.length} paris en attente à annuler.`);
                            for (const bet of pendingBets) {
                                try {
                                    yield this.cancelPendingBet(bet);
                                    logger_1.default.info(`Pari en attente ${bet.id} annulé (début du combat)`);
                                }
                                catch (e) {
                                    logger_1.default.error(`Erreur annulation auto pari ${bet.id}:`, e);
                                }
                            }
                        }
                        break;
                    case client_1.FightStatus.FINISHED:
                        notificationTitle = 'Combat terminé';
                        notificationMessage = `Le combat "${fight.title}" est terminé. Attendez les résultats.`;
                        break;
                    case client_1.FightStatus.CANCELLED:
                        notificationTitle = 'Combat annulé';
                        notificationMessage = `Le combat "${fight.title}" a été annulé.`;
                        yield this.refundAllBetsForFight(fightId);
                        break;
                }
                if (notificationMessage) {
                    yield this.notifyFightParticipants(fightId, 'FIGHT_STATUS_CHANGE', notificationMessage);
                }
                // Notification WebSocket
                if (this.webSocketService && this.webSocketService.isInitialized()) {
                    this.webSocketService.broadcastFightUpdate(fightId, {
                        fightId: fightId,
                        status: newStatus,
                        timestamp: new Date().toISOString()
                    });
                }
                logger_1.default.info(`Statut du combat mis à jour: ${fightId} -> ${newStatus}`);
                return updatedFight;
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la mise à jour du statut du combat ${fightId}:`, error);
                throw error;
            }
        });
    }
    validateFightResult(adminId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.info(`Validation du résultat pour le combat ${data.fightId}, winner: ${data.winner}`);
                // 0. Vérifier la sécurité (Mot de passe et OTP)
                const admin = yield this.prisma.user.findUnique({
                    where: { id: adminId }
                });
                if (!admin) {
                    throw new Error('Administrateur non trouvé');
                }
                // Vérifier le mot de passe
                const isPasswordValid = yield bcrypt_1.default.compare(data.password, admin.password);
                if (!isPasswordValid) {
                    throw new Error('Mot de passe administrateur incorrect');
                }
                // Vérifier l'OTP
                const otp = yield this.prisma.otpCode.findFirst({
                    where: {
                        userId: adminId,
                        code: data.otpCode,
                        purpose: 'FIGHT_RESULT_VALIDATION',
                        consumed: false,
                        expiresAt: { gt: new Date() }
                    }
                });
                if (!otp) {
                    throw new Error('Code OTP invalide ou expiré');
                }
                // Marquer l'OTP comme consommé
                yield this.prisma.otpCode.update({
                    where: { id: otp.id },
                    data: { consumed: true, consumedAt: new Date() }
                });
                // 1. Valider le combat
                const fight = yield this.prisma.fight.findUnique({
                    where: { id: data.fightId },
                    include: {
                        fighterA: true,
                        fighterB: true,
                        result: true
                    }
                });
                if (!fight) {
                    throw new Error('Combat non trouvé');
                }
                if (fight.status !== client_1.FightStatus.FINISHED) {
                    throw new Error('Le combat doit être terminé avant de valider le résultat');
                }
                if (fight.result) {
                    throw new Error('Résultat déjà validé pour ce combat');
                }
                // 2. Créer le résultat
                const result = yield this.prisma.$transaction((prisma) => __awaiter(this, void 0, void 0, function* () {
                    return yield prisma.fightResult.create({
                        data: {
                            fightId: data.fightId,
                            winner: data.winner,
                            victoryMethod: data.victoryMethod,
                            round: data.round,
                            duration: data.duration ? parseInt(data.duration) : null,
                            notes: data.notes,
                            validatedAt: new Date(),
                            adminId
                        }
                    });
                }), {
                    maxWait: 10000,
                    timeout: 15000
                });
                // 3. Récupérer les paris
                const bets = yield this.prisma.bet.findMany({
                    where: {
                        fightId: data.fightId,
                        status: 'ACCEPTED'
                    },
                    include: {
                        creator: true,
                        acceptor: true
                    }
                });
                logger_1.default.info(`${bets.length} paris à traiter pour le combat ${data.fightId}`);
                // 4. Traiter chaque pari
                let settledCount = 0;
                const errors = [];
                for (const bet of bets) {
                    try {
                        logger_1.default.info(`Traitement du pari ${bet.id}, montant: ${bet.amount}`);
                        // Traiter le pari directement
                        yield this.processSingleBet(bet, data.winner);
                        settledCount++;
                        logger_1.default.info(`Pari ${bet.id} traité avec succès`);
                    }
                    catch (error) {
                        const errorMsg = `Pari ${bet.id}: ${error.message}`;
                        errors.push(errorMsg);
                        logger_1.default.error(errorMsg, error);
                    }
                }
                // 5. Mettre à jour les statistiques des lutteurs
                yield this.updateFighterStatsAfterSettlement(fight, data.winner);
                // 6. Annuler et rembourser les paris en attente (non acceptés)
                const pendingBets = yield this.prisma.bet.findMany({
                    where: {
                        fightId: data.fightId,
                        status: 'PENDING'
                    },
                    include: {
                        creator: true
                    }
                });
                logger_1.default.info(`${pendingBets.length} paris en attente à annuler pour le combat ${data.fightId}`);
                let cancelledCount = 0;
                for (const bet of pendingBets) {
                    try {
                        yield this.cancelPendingBet(bet);
                        cancelledCount++;
                        logger_1.default.info(`Pari en attente ${bet.id} annulé et remboursé`);
                    }
                    catch (error) {
                        logger_1.default.error(`Erreur annulation pari en attente ${bet.id}:`, error);
                        // On continue pour traiter les autres
                    }
                }
                logger_1.default.info(`Annulation terminée: ${cancelledCount}/${pendingBets.length} paris en attente traités`);
                // 7. Notification WebSocket pour le résultat
                if (this.webSocketService && this.webSocketService.isInitialized()) {
                    this.webSocketService.broadcastSystemAlert({
                        type: 'FIGHT_RESULT',
                        title: 'Résultat de combat !',
                        message: `Le résultat du combat "${fight.title}" a été validé.`,
                        severity: 'INFO',
                        data: {
                            fightId: data.fightId,
                            winner: data.winner,
                            victoryMethod: data.victoryMethod
                        }
                    });
                }
                return {
                    success: true,
                    result,
                    settledBets: settledCount,
                    totalBets: bets.length,
                    errors: errors.length > 0 ? errors : undefined
                };
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la validation du résultat:', error);
                throw error;
            }
        });
    }
    processSingleBet(bet, winner) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (winner === 'DRAW') {
                    yield this.handleDrawBet(bet);
                }
                else {
                    yield this.handleWinnerBet(bet, winner);
                }
            }
            catch (error) {
                logger_1.default.error(`Erreur traitement pari ${bet.id}:`, error);
                throw error;
            }
        });
    }
    cancelPendingBet(bet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const betAmountBigInt = BigInt(Math.floor(Number(bet.amount)));
                yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // Rembourser le créateur
                    yield tx.wallet.update({
                        where: { userId: bet.creatorId },
                        data: {
                            balance: { increment: betAmountBigInt },
                            lockedBalance: { decrement: betAmountBigInt }
                        }
                    });
                    // Mettre à jour le statut du pari
                    yield tx.bet.update({
                        where: { id: bet.id },
                        data: {
                            status: 'CANCELLED',
                            cancelledAt: new Date()
                        }
                    });
                    // Historique transaction
                    yield tx.transaction.create({
                        data: {
                            type: client_1.TransactionType.BET_REFUND,
                            amount: betAmountBigInt,
                            userId: bet.creatorId,
                            status: client_1.TransactionStatus.CONFIRMED,
                            notes: `Remboursement fin de combat - Pari ${bet.id}`
                        }
                    });
                    // Notification DB
                    yield tx.notification.create({
                        data: {
                            userId: bet.creatorId,
                            type: 'BET_CANCELLED',
                            title: 'Pari annulé et remboursé',
                            message: `Votre pari de ${bet.amount} F a été annulé car le combat est terminé sans avoir été accepté.`,
                        }
                    });
                }));
                // Notification WebSocket
                if (this.webSocketService && this.webSocketService.isInitialized()) {
                    try {
                        this.webSocketService.broadcastNotification({
                            type: 'BET_CANCELLED',
                            title: 'Pari remboursé',
                            message: `Votre pari de ${bet.amount} F a été annulé (combat terminé).`,
                            timestamp: new Date().toISOString()
                        }, bet.creatorId);
                    }
                    catch (wsError) {
                        logger_1.default.warn(`Erreur envoi notif WS pour pari ${bet.id}:`, wsError);
                    }
                }
            }
            catch (error) {
                logger_1.default.error(`Erreur cancelPendingBet pour pari ${bet.id}:`, error);
                throw error;
            }
        });
    }
    // Remplacez les méthodes handleWinnerBet et handleDrawBet par celles-ci :
    // Remplacez les méthodes handleWinnerBet et handleDrawBet par celles-ci :
    handleDrawBet(bet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const betAmount = Number(bet.amount);
                const betAmountBigInt = BigInt(Math.floor(betAmount));
                // Mettre à jour le créateur
                yield this.prisma.wallet.update({
                    where: { userId: bet.creatorId },
                    data: {
                        balance: { increment: betAmountBigInt },
                        lockedBalance: { decrement: betAmountBigInt }
                    }
                });
                // Transaction pour créateur
                yield this.prisma.transaction.create({
                    data: {
                        type: client_1.TransactionType.BET_REFUND,
                        amount: betAmountBigInt,
                        userId: bet.creatorId,
                        status: client_1.TransactionStatus.CONFIRMED,
                        notes: `Remboursement match nul - Pari ${bet.id}`
                    }
                });
                // Même chose pour l'accepteur si présent
                if (bet.acceptorId) {
                    yield this.prisma.wallet.update({
                        where: { userId: bet.acceptorId },
                        data: {
                            balance: { increment: betAmountBigInt },
                            lockedBalance: { decrement: betAmountBigInt }
                        }
                    });
                    yield this.prisma.transaction.create({
                        data: {
                            type: client_1.TransactionType.BET_REFUND,
                            amount: betAmountBigInt,
                            userId: bet.acceptorId,
                            status: client_1.TransactionStatus.CONFIRMED,
                            notes: `Remboursement match nul - Pari ${bet.id}`
                        }
                    });
                    // Notification WebSocket pour l'accepteur
                    if (this.webSocketService && this.webSocketService.isInitialized()) {
                        this.webSocketService.broadcastNotification({
                            type: 'BET_REFUNDED',
                            title: 'Pari remboursé',
                            message: `Votre pari de ${betAmount} F sur le combat a été remboursé (match nul).`,
                            timestamp: new Date().toISOString()
                        }, bet.acceptorId);
                    }
                }
                // Notification WebSocket pour le créateur
                if (this.webSocketService && this.webSocketService.isInitialized()) {
                    this.webSocketService.broadcastNotification({
                        type: 'BET_REFUNDED',
                        title: 'Pari remboursé',
                        message: `Votre pari de ${betAmount} F sur le combat a été remboursé (match nul).`,
                        timestamp: new Date().toISOString()
                    }, bet.creatorId);
                }
                // Mettre à jour le pari
                yield this.prisma.bet.update({
                    where: { id: bet.id },
                    data: {
                        status: 'REFUNDED',
                        settledAt: new Date()
                    }
                });
                logger_1.default.info(`Pari ${bet.id} remboursé (match nul)`);
            }
            catch (error) {
                logger_1.default.error(`Erreur handleDrawBet pour pari ${bet.id}:`, error);
                throw error;
            }
        });
    }
    handleWinnerBet(bet, winner) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isCreatorWinner = bet.chosenFighter === winner;
                const winnerId = isCreatorWinner ? bet.creatorId : bet.acceptorId;
                const loserId = isCreatorWinner ? bet.acceptorId : bet.creatorId;
                if (!winnerId) {
                    throw new Error('Gagnant non trouvé');
                }
                const betAmount = Number(bet.amount);
                const totalPot = betAmount * 2;
                const commission = totalPot * (this.COMMISSION_PERCENTAGE / 100);
                const winAmount = totalPot - commission;
                const betAmountBigInt = BigInt(Math.floor(betAmount));
                const winAmountBigInt = BigInt(Math.floor(winAmount));
                const commissionBigInt = BigInt(Math.floor(commission));
                logger_1.default.info(`Traitement gain - Pari: ${bet.id}, Gagnant: ${winnerId}, Montant: ${winAmount}, Commission: ${commission}`);
                // Mettre à jour le perdant
                if (loserId) {
                    yield this.prisma.wallet.update({
                        where: { userId: loserId },
                        data: {
                            lockedBalance: { decrement: betAmountBigInt },
                            totalLost: { increment: betAmountBigInt }
                        }
                    });
                    logger_1.default.info(`Wallet perdant ${loserId} mis à jour`);
                }
                // Mettre à jour le gagnant
                yield this.prisma.wallet.update({
                    where: { userId: winnerId },
                    data: {
                        balance: { increment: winAmountBigInt },
                        lockedBalance: { decrement: betAmountBigInt },
                        totalWon: { increment: winAmountBigInt }
                    }
                });
                logger_1.default.info(`Wallet gagnant ${winnerId} mis à jour`);
                logger_1.default.info(`Wallet gagnant ${winnerId} mis à jour`);
                // Notification WebSocket pour le gagnant
                if (this.webSocketService && this.webSocketService.isInitialized()) {
                    this.webSocketService.broadcastNotification({
                        type: 'BET_WON',
                        title: 'Vous avez gagné !',
                        message: `Félicitations ! Vous avez remporté ${winAmount} F sur votre pari.`,
                        data: { betId: bet.id, amount: winAmount },
                        timestamp: new Date().toISOString()
                    }, winnerId);
                }
                // Notification WebSocket pour le perdant
                if (loserId && this.webSocketService && this.webSocketService.isInitialized()) {
                    this.webSocketService.broadcastNotification({
                        type: 'BET_LOST',
                        title: 'Pari perdu',
                        message: `Désolé, votre pari de ${betAmount} F est perdant.`,
                        data: { betId: bet.id },
                        timestamp: new Date().toISOString()
                    }, loserId);
                }
                // Créer la transaction de gain
                const winTransaction = yield this.prisma.transaction.create({
                    data: {
                        type: client_1.TransactionType.BET_WIN,
                        amount: winAmountBigInt,
                        userId: winnerId,
                        status: client_1.TransactionStatus.CONFIRMED,
                        notes: `Gain du pari ${bet.id}`
                    }
                });
                logger_1.default.info(`Transaction de gain créée: ${winTransaction.id}`);
                // Créer la transaction de commission (nécessaire pour le modèle Commission)
                const commissionTransaction = yield this.prisma.transaction.create({
                    data: {
                        type: client_1.TransactionType.COMMISSION,
                        amount: commissionBigInt,
                        userId: 'system', // ID système pour les commissions
                        status: client_1.TransactionStatus.CONFIRMED,
                        notes: `Commission sur pari ${bet.id}`
                    }
                });
                logger_1.default.info(`Transaction de commission créée: ${commissionTransaction.id}`);
                // Enregistrer la commission dans le modèle Commission
                yield this.prisma.commission.create({
                    data: {
                        betId: bet.id,
                        amount: commissionBigInt,
                        type: 'BET',
                        percentage: this.COMMISSION_PERCENTAGE,
                        transactionId: commissionTransaction.id
                    }
                });
                logger_1.default.info(`Commission enregistrée: ${commission} (${this.COMMISSION_PERCENTAGE}%)`);
                // Créer le winning
                yield this.prisma.winning.create({
                    data: {
                        userId: winnerId,
                        betId: bet.id,
                        amount: BigInt(Math.floor(totalPot)),
                        netAmount: winAmountBigInt,
                        commission: commissionBigInt,
                        transactionId: winTransaction.id
                    }
                });
                logger_1.default.info(`Winning créé pour l'utilisateur ${winnerId}`);
                // Mettre à jour le pari
                yield this.prisma.bet.update({
                    where: { id: bet.id },
                    data: {
                        status: isCreatorWinner ? 'WON' : 'LOST',
                        actualWin: winAmountBigInt,
                        settledAt: new Date()
                    }
                });
                logger_1.default.info(`Pari ${bet.id} marqué comme réglé (${isCreatorWinner ? 'Créateur gagnant' : 'Accepteur gagnant'})`);
            }
            catch (error) {
                logger_1.default.error(`Erreur handleWinnerBet pour pari ${bet.id}:`, error);
                throw error;
            }
        });
    }
    updateFighterStatsAfterSettlement(fight, winner) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (winner === client_1.Winner.A) {
                    yield this.prisma.fighter.update({
                        where: { id: fight.fighterAId },
                        data: {
                            wins: { increment: 1 },
                            totalFights: { increment: 1 }
                        }
                    });
                    yield this.prisma.fighter.update({
                        where: { id: fight.fighterBId },
                        data: {
                            losses: { increment: 1 },
                            totalFights: { increment: 1 }
                        }
                    });
                }
                else if (winner === client_1.Winner.B) {
                    yield this.prisma.fighter.update({
                        where: { id: fight.fighterBId },
                        data: {
                            wins: { increment: 1 },
                            totalFights: { increment: 1 }
                        }
                    });
                    yield this.prisma.fighter.update({
                        where: { id: fight.fighterAId },
                        data: {
                            losses: { increment: 1 },
                            totalFights: { increment: 1 }
                        }
                    });
                }
                else if (winner === client_1.Winner.DRAW) {
                    yield this.prisma.fighter.update({
                        where: { id: fight.fighterAId },
                        data: {
                            draws: { increment: 1 },
                            totalFights: { increment: 1 }
                        }
                    });
                    yield this.prisma.fighter.update({
                        where: { id: fight.fighterBId },
                        data: {
                            draws: { increment: 1 },
                            totalFights: { increment: 1 }
                        }
                    });
                }
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la mise à jour des statistiques des lutteurs:`, error);
            }
        });
    }
    updateFight(fightId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fight = yield this.prisma.fight.findUnique({
                    where: { id: fightId }
                });
                if (!fight) {
                    throw new Error('Combat non trouvé');
                }
                const updatedFight = yield this.prisma.fight.update({
                    where: { id: fightId },
                    data: Object.assign(Object.assign({}, (data.order && { order: data.order })), (data.scheduledTime && { scheduledAt: new Date(data.scheduledTime) })
                    // Note: fighterAId and fighterBId are not in UpdateDayEventDTO
                    ),
                    include: {
                        fighterA: true,
                        fighterB: true,
                        dayEvent: true
                    }
                });
                logger_1.default.info(`Combat mis à jour: ${fightId}`);
                return updatedFight;
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la mise à jour du combat ${fightId}:`, error);
                throw error;
            }
        });
    }
    deleteFight(fightId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fight = yield this.prisma.fight.findUnique({
                    where: { id: fightId }
                });
                if (!fight) {
                    throw new Error('Combat non trouvé');
                }
                // Rembourser tous les paris avant suppression
                yield this.refundAllBetsForFight(fightId);
                yield this.prisma.fight.delete({
                    where: { id: fightId }
                });
                logger_1.default.info(`Combat supprimé: ${fightId}`);
                return { success: true };
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la suppression du combat ${fightId}:`, error);
                throw error;
            }
        });
    }
    // ========== JOURNÉES DE LUTTE ==========
    createDayEvent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validation pour 5 combats
                if (!data.fights || data.fights.length !== 5) {
                    throw new Error('Une journée de lutte doit avoir exactement 5 combats');
                }
                const fighterIds = data.fights.flatMap(f => [f.fighterAId, f.fighterBId]);
                const uniqueFighters = new Set(fighterIds);
                if (uniqueFighters.size !== 10) {
                    throw new Error('Chaque lutteur ne doit combattre qu\'une seule fois dans la journée (10 lutteurs attendus)');
                }
                const eventDate = new Date(data.date);
                const now = new Date();
                if (eventDate <= now) {
                    throw new Error('La date de la journée doit être dans le futur');
                }
                const orders = data.fights.map(f => f.order);
                const uniqueOrders = new Set(orders);
                if (uniqueOrders.size !== 5 || Math.min(...orders) !== 1 || Math.max(...orders) !== 5) {
                    throw new Error('Les combats doivent être numérotés de 1 à 5 sans répétition');
                }
                // 1. Créez la journée
                const dayEvent = yield this.prisma.dayEvent.create({
                    data: {
                        title: data.title,
                        slug: this.generateSlug(data.title),
                        date: eventDate,
                        location: data.location,
                        description: data.description,
                        bannerImage: data.bannerImage,
                        status: 'SCHEDULED',
                        isFeatured: data.isFeatured || false
                    }
                });
                // 2. Créez les combats un par un
                const fights = [];
                for (const fightData of data.fights) {
                    // Heure simple basée sur l'ordre
                    const fightDateTime = new Date(eventDate);
                    const baseHour = 20;
                    const hourIncrement = fightData.order - 1; // 20:00, 21:00, 22:00...
                    fightDateTime.setHours(baseHour + hourIncrement, 0, 0, 0);
                    const fight = yield this.prisma.fight.create({
                        data: {
                            dayEventId: dayEvent.id,
                            fighterAId: fightData.fighterAId,
                            fighterBId: fightData.fighterBId,
                            title: `Combat ${fightData.order}`,
                            location: data.location,
                            order: fightData.order,
                            scheduledAt: fightDateTime,
                            status: client_1.FightStatus.SCHEDULED
                        },
                        include: {
                            fighterA: true,
                            fighterB: true
                        }
                    });
                    fights.push(fight);
                }
                logger_1.default.info(`Journée créée: ${dayEvent.id} - ${dayEvent.title}`);
                return Object.assign(Object.assign({}, dayEvent), { fights });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la création de la journée:', error);
                throw error;
            }
        });
    }
    getDayEvent(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dayEvent = yield this.prisma.dayEvent.findUnique({
                    where: { id: eventId },
                    include: {
                        fights: {
                            include: {
                                fighterA: true,
                                fighterB: true,
                                result: true,
                                _count: {
                                    select: {
                                        bets: {
                                            where: {
                                                OR: [
                                                    { status: 'PENDING' },
                                                    { status: 'ACCEPTED' }
                                                ]
                                            }
                                        }
                                    }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    }
                });
                if (!dayEvent) {
                    throw new Error('Journée non trouvée');
                }
                return dayEvent;
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la récupération de la journée ${eventId}:`, error);
                throw error;
            }
        });
    }
    listDayEvents(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, fromDate, toDate, limit = 20, offset = 0 } = filters;
                const where = {};
                if (status) {
                    where.status = status;
                }
                if (fromDate || toDate) {
                    where.date = {};
                    if (fromDate)
                        where.date.gte = new Date(fromDate);
                    if (toDate)
                        where.date.lte = new Date(toDate);
                }
                const [events, total] = yield Promise.all([
                    this.prisma.dayEvent.findMany({
                        where,
                        include: {
                            fights: {
                                include: {
                                    fighterA: true,
                                    fighterB: true
                                },
                                orderBy: { order: 'asc' }
                            },
                            _count: {
                                select: {
                                    fights: true
                                }
                            }
                        },
                        take: limit,
                        skip: offset,
                        orderBy: { date: 'desc' }
                    }),
                    this.prisma.dayEvent.count({ where })
                ]);
                return {
                    events,
                    total,
                    limit,
                    offset
                };
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des journées:', error);
                throw error;
            }
        });
    }
    getUpcomingDayEvents() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            try {
                const now = new Date();
                return yield this.prisma.dayEvent.findMany({
                    where: {
                        status: 'SCHEDULED',
                        date: { gt: now }
                    },
                    include: {
                        fights: {
                            include: {
                                fighterA: true,
                                fighterB: true
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    take: limit,
                    orderBy: { date: 'asc' }
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des journées à venir:', error);
                throw error;
            }
        });
    }
    getCurrentDayEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return yield this.prisma.dayEvent.findFirst({
                    where: {
                        date: {
                            gte: today,
                            lt: tomorrow
                        },
                        status: 'SCHEDULED'
                    },
                    include: {
                        fights: {
                            include: {
                                fighterA: true,
                                fighterB: true,
                                result: true,
                                _count: {
                                    select: {
                                        bets: {
                                            where: {
                                                OR: [
                                                    { status: 'PENDING' },
                                                    { status: 'ACCEPTED' }
                                                ]
                                            }
                                        }
                                    }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération de la journée actuelle:', error);
                throw error;
            }
        });
    }
    updateDayEvent(eventId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dayEvent = yield this.prisma.dayEvent.findUnique({
                    where: { id: eventId }
                });
                if (!dayEvent) {
                    throw new Error('Journée non trouvée');
                }
                const updatedEvent = yield this.prisma.dayEvent.update({
                    where: { id: eventId },
                    data: {
                        title: data.title,
                        date: data.date ? new Date(data.date) : undefined,
                        location: data.location,
                        description: data.description,
                        bannerImage: data.bannerImage,
                        isFeatured: data.isFeatured,
                        status: data.status
                    },
                    include: {
                        fights: {
                            include: {
                                fighterA: true,
                                fighterB: true
                            },
                            orderBy: { order: 'asc' }
                        }
                    }
                });
                logger_1.default.info(`Journée mise à jour: ${eventId}`);
                return updatedEvent;
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la mise à jour de la journée ${eventId}:`, error);
                throw error;
            }
        });
    }
    deleteDayEvent(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dayEvent = yield this.prisma.dayEvent.findUnique({
                    where: { id: eventId },
                    include: {
                        fights: {
                            include: {
                                bets: {
                                    where: {
                                        OR: [
                                            { status: 'PENDING' },
                                            { status: 'ACCEPTED' }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                });
                if (!dayEvent) {
                    throw new Error('Journée non trouvée');
                }
                // Rembourser tous les paris de tous les combats de la journée
                for (const fight of dayEvent.fights) {
                    for (const bet of fight.bets) {
                        yield this.betService.cancelBet(bet.id, bet.creatorId, true);
                    }
                }
                yield this.prisma.dayEvent.delete({
                    where: { id: eventId }
                });
                logger_1.default.info(`Journée supprimée: ${eventId}`);
                return { success: true };
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la suppression de la journée ${eventId}:`, error);
                throw error;
            }
        });
    }
    expirePastFights() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const twentyFourHoursAgo = (0, date_fns_1.addHours)(now, -24);
                const expiredFights = yield this.prisma.fight.findMany({
                    where: {
                        status: client_1.FightStatus.FINISHED,
                        result: null,
                        OR: [
                            { startedAt: { lt: twentyFourHoursAgo } },
                            {
                                dayEvent: {
                                    date: { lt: twentyFourHoursAgo }
                                }
                            }
                        ]
                    },
                    include: {
                        bets: {
                            where: { status: 'ACCEPTED' }
                        }
                    }
                });
                let expiredCount = 0;
                for (const fight of expiredFights) {
                    yield this.prisma.fightResult.create({
                        data: {
                            fightId: fight.id,
                            winner: client_1.Winner.DRAW,
                            victoryMethod: 'EXPIRED',
                            notes: 'Résultat automatique après 24h sans validation',
                            validatedAt: now,
                            adminId: 'system'
                        }
                    });
                    for (const bet of fight.bets) {
                        yield this.betService.settleBet(bet.id, client_1.Winner.DRAW);
                    }
                    expiredCount++;
                    logger_1.default.info(`Combat expiré: ${fight.id} - Match nul automatique`);
                }
                return expiredCount;
            }
            catch (error) {
                logger_1.default.error('Erreur lors de l\'expiration des combats:', error);
                throw error;
            }
        });
    }
    // ========== MÉTHODES PRIVÉES ==========
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 100);
    }
    refundAllBetsForFight(fightId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bets = yield this.prisma.bet.findMany({
                    where: {
                        fightId: fightId,
                        status: { in: ['PENDING', 'ACCEPTED'] }
                    }
                });
                for (const bet of bets) {
                    yield this.betService.cancelBet(bet.id, bet.creatorId, true);
                }
            }
            catch (error) {
                logger_1.default.error(`Erreur lors du remboursement des paris du combat ${fightId}:`, error);
                throw error;
            }
        });
    }
    notifyAllUsers(type, title, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.info(`Notification globale: ${title} - ${message}`);
                // Implémentez ici la logique de notification (email, push, etc.)
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la notification globale:', error);
            }
        });
    }
    notifyFightParticipants(fightId, type, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bets = yield this.prisma.bet.findMany({
                    where: { fightId },
                    select: { creatorId: true, acceptorId: true },
                    distinct: ['creatorId', 'acceptorId']
                });
                const userIds = new Set();
                bets.forEach(bet => {
                    if (bet.creatorId)
                        userIds.add(bet.creatorId);
                    if (bet.acceptorId)
                        userIds.add(bet.acceptorId);
                });
                // Créer des notifications pour tous les utilisateurs concernés
                const notifications = Array.from(userIds).map(userId => this.prisma.notification.create({
                    data: {
                        userId,
                        type: type,
                        title: 'Mise à jour combat',
                        message
                    }
                }));
                yield Promise.all(notifications);
                // Notification WebSocket pour chaque utilisateur
                if (this.webSocketService && this.webSocketService.isInitialized()) {
                    userIds.forEach(userId => {
                        this.webSocketService.broadcastNotification({
                            type: 'FIGHT_FINISHED', // Défaut, on peut ajuster selon 'type'
                            title: 'Mise à jour combat',
                            message,
                            timestamp: new Date().toISOString()
                        }, userId);
                    });
                }
            }
            catch (error) {
                logger_1.default.error(`Erreur lors de la notification des participants du combat ${fightId}:`, error);
            }
        });
    }
}
exports.FightService = FightService;

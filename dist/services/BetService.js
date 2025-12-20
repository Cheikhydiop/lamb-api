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
exports.BetService = void 0;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const date_fns_1 = require("date-fns");
const logger_1 = __importDefault(require("../utils/logger"));
class BetService {
    constructor(prisma, webSocketService) {
        this.prisma = prisma;
        this.webSocketService = webSocketService;
        this.CANCELLATION_WINDOW_MINUTES = 20;
        this.COMMISSION_PERCENTAGE = 10; // 10% de commission
        this.WIN_MULTIPLIER = 1.8; // Gain = mise × 1.8 (après commission)
    }
    createBet(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // ========== VALIDATIONS AVANT TRANSACTION (rapide) ==========
                // Vérifier si l'utilisateur existe
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId }
                });
                if (!user) {
                    throw new Error('Utilisateur non trouvé');
                }
                if (!user.isActive) {
                    throw new Error('Compte utilisateur désactivé');
                }
                // Vérifier le combat
                const fight = yield this.prisma.fight.findUnique({
                    where: { id: data.fightId },
                    include: {
                        fighterA: true,
                        fighterB: true,
                        dayEvent: true
                    }
                });
                if (!fight) {
                    throw new Error('Combat non trouvé');
                }
                // Vérifier la journée de lutte
                if (!fight.dayEvent) {
                    throw new Error("Ce combat ne fait pas partie d'une journée de lutte");
                }
                if (fight.dayEvent.status !== 'SCHEDULED') {
                    throw new Error('Impossible de parier sur une journée terminée ou annulée');
                }
                if (fight.status !== 'SCHEDULED') {
                    throw new Error('Impossible de parier sur un combat terminé ou annulé');
                }
                // Vérifier si le combat commence bientôt
                const fightStartTime = fight.scheduledAt || fight.dayEvent.date;
                const now = new Date();
                const thirtyMinutesBeforeFight = (0, date_fns_1.addMinutes)(fightStartTime, -30);
                if ((0, date_fns_1.isAfter)(now, thirtyMinutesBeforeFight)) {
                    throw new Error('Impossible de parier moins de 30 minutes avant le combat');
                }
                // Vérifier les fonds disponibles
                const wallet = yield this.prisma.wallet.findUnique({
                    where: { userId }
                });
                if (!wallet) {
                    throw new Error('Portefeuille non trouvé');
                }
                // Vérifier que le solde est suffisant (pas besoin de calculer availableBalance)
                const amountBigInt = data.amount;
                if (wallet.balance < amountBigInt) {
                    throw new Error('Solde insuffisant');
                }
                if (data.amount <= 0) {
                    throw new Error('Le montant du pari doit être supérieur à 0');
                }
                // Calculer le gain potentiel (pour l'annoncer)
                const potentialWin = Number(data.amount) * this.WIN_MULTIPLIER;
                // Calculer la date limite d'annulation
                const canCancelUntil = (0, date_fns_1.addMinutes)(new Date(), this.CANCELLATION_WINDOW_MINUTES);
                // Vérifier s'il existe déjà un pari similaire non accepté
                const existingSimilarBet = yield this.prisma.bet.findFirst({
                    where: {
                        fightId: data.fightId,
                        creatorId: userId,
                        chosenFighter: data.chosenFighter,
                        status: 'PENDING'
                    }
                });
                if (existingSimilarBet) {
                    throw new Error('Vous avez déjà un pari en attente sur ce combat avec ce lutteur');
                }
                // ========== TRANSACTION (opérations critiques uniquement) ==========
                const bet = yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // 1. SOUSTRAIRE DU SOLDE et bloquer les fonds
                    const amountBigInt = data.amount;
                    yield tx.wallet.update({
                        where: { userId },
                        data: {
                            balance: { decrement: amountBigInt },
                            lockedBalance: { increment: amountBigInt }
                        }
                    });
                    // 2. Créer le pari
                    const newBet = yield tx.bet.create({
                        data: {
                            amount: data.amount.toString(),
                            chosenFighter: data.chosenFighter,
                            fightId: data.fightId,
                            creatorId: userId,
                            canCancelUntil,
                            status: 'PENDING'
                        },
                        include: {
                            creator: {
                                select: {
                                    id: true,
                                    name: true,
                                    phone: true
                                }
                            },
                            fight: {
                                include: {
                                    fighterA: true,
                                    fighterB: true,
                                    dayEvent: true
                                }
                            }
                        }
                    });
                    // 3. Mettre à jour les statistiques de la journée
                    // Convertir en BigInt si le champ est de type BigInt dans le schéma
                    const totalAmountIncrement = data.amount;
                    yield tx.dayEvent.update({
                        where: { id: fight.dayEventId },
                        data: {
                            totalBets: { increment: 1 },
                            totalAmount: { increment: totalAmountIncrement }
                        }
                    });
                    return newBet;
                }), {
                    maxWait: 10000,
                    timeout: 20000
                });
                // ========== OPÉRATIONS NON-CRITIQUES (après la transaction) ==========
                // Audit log (non-bloquant)
                try {
                    yield this.prisma.auditLog.create({
                        data: {
                            action: 'CREATE_BET',
                            table: 'bets',
                            recordId: bet.id,
                            newData: JSON.stringify(bet),
                            userId
                        }
                    });
                }
                catch (auditError) {
                    logger_1.default.error('Erreur audit log (non-bloquant):', auditError);
                }
                // Notification (non-bloquant)
                try {
                    yield this.prisma.notification.create({
                        data: {
                            userId: userId,
                            type: 'BET_PLACED',
                            title: 'Pari créé',
                            message: `Vous avez créé un pari de ${data.amount} FCFA sur ${bet.chosenFighter === 'A' ? bet.fight.fighterA.name : bet.fight.fighterB.name}. Attendez qu'un autre joueur l'accepte.`,
                        }
                    });
                }
                catch (notifError) {
                    logger_1.default.error('Erreur notification (non-bloquant):', notifError);
                }
                logger_1.default.info(`Pari créé: ${bet.id} par ${user.name} pour ${bet.amount} FCFA`);
                return bet;
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la création du pari:', error);
                throw error;
            }
        });
    }
    /**
     * Récupérer les paris avec statut PENDING
     */
    getPendingBets(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, fightId, dayEventId, limit = 20, offset = 0 } = filters;
                const where = {
                    status: 'PENDING'
                };
                if (userId) {
                    where.OR = [
                        { creatorId: userId },
                        { acceptorId: userId }
                    ];
                }
                if (fightId) {
                    where.fightId = fightId;
                }
                if (dayEventId) {
                    where.fight = {
                        dayEventId: dayEventId
                    };
                }
                // Vérifier que le combat n'a pas encore commencé
                where.fight = Object.assign(Object.assign({}, where.fight), { status: 'SCHEDULED', dayEvent: {
                        status: 'SCHEDULED'
                    } });
                const [bets, total] = yield Promise.all([
                    this.prisma.bet.findMany({
                        where,
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
                                    name: true
                                }
                            },
                            fight: {
                                include: {
                                    fighterA: true,
                                    fighterB: true,
                                    dayEvent: {
                                        select: {
                                            id: true,
                                            title: true,
                                            date: true,
                                            status: true
                                        }
                                    }
                                }
                            }
                        },
                        take: limit,
                        skip: offset,
                        orderBy: { createdAt: 'desc' }
                    }),
                    this.prisma.bet.count({ where })
                ]);
                // Filtrer les paris qui sont dans la fenêtre de 30 minutes avant le combat
                const now = new Date();
                const filteredBets = bets.filter(bet => {
                    var _a;
                    if (!bet.fight)
                        return false;
                    const fightStartTime = bet.fight.scheduledAt || ((_a = bet.fight.dayEvent) === null || _a === void 0 ? void 0 : _a.date);
                    const thirtyMinutesBeforeFight = (0, date_fns_1.addMinutes)(fightStartTime, -30);
                    return (0, date_fns_1.isAfter)(thirtyMinutesBeforeFight, now);
                });
                return {
                    bets: filteredBets,
                    total: total,
                    limit,
                    offset
                };
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des paris en attente:', error);
                throw error;
            }
        });
    }
    acceptBet(acceptorId, betId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let bet;
                const result = yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c;
                    bet = yield tx.bet.findUnique({
                        where: { id: betId },
                        include: {
                            creator: true,
                            fight: {
                                include: {
                                    fighterA: true,
                                    fighterB: true,
                                    dayEvent: true
                                }
                            }
                        }
                    });
                    if (!bet) {
                        throw new Error('Pari non trouvé');
                    }
                    if (bet.status !== 'PENDING') {
                        throw new Error('Ce pari n\'est pas disponible');
                    }
                    // L'accepteur ne peut pas être le créateur
                    if (bet.creatorId === acceptorId) {
                        throw new Error('Vous ne pouvez pas accepter votre propre pari');
                    }
                    // Vérifier si le combat a commencé (c'est la seule limitation pour l'acceptation)
                    const fightStartTime = bet.fight.scheduledAt || ((_a = bet.fight.dayEvent) === null || _a === void 0 ? void 0 : _a.date);
                    const thirtyMinutesBeforeFight = (0, date_fns_1.addMinutes)(fightStartTime, -30);
                    const now = new Date();
                    if ((0, date_fns_1.isAfter)(now, thirtyMinutesBeforeFight)) {
                        throw new Error('Impossible d\'accepter un pari moins de 30 minutes avant le combat');
                    }
                    // Vérifier les fonds de l'accepteur
                    const acceptorWallet = yield tx.wallet.findUnique({
                        where: { userId: acceptorId }
                    });
                    if (!acceptorWallet) {
                        throw new Error('Portefeuille non trouvé');
                    }
                    // Vérifier que le solde est suffisant
                    // bet.amount is Decimal from Prisma, convert to BigInt for comparison with wallet.balance
                    const betAmountBigInt = BigInt(Math.floor(Number(bet.amount)));
                    if (acceptorWallet.balance < betAmountBigInt) {
                        throw new Error('Solde insuffisant pour accepter ce pari');
                    }
                    // SOUSTRAIRE DU SOLDE et bloquer les fonds de l'accepteur
                    const amountToLock = BigInt(Math.floor(bet.amount));
                    yield tx.wallet.update({
                        where: { userId: acceptorId },
                        data: {
                            balance: { decrement: amountToLock },
                            lockedBalance: { increment: amountToLock }
                        }
                    });
                    // Mettre à jour le pari
                    const updatedBet = yield tx.bet.update({
                        where: { id: betId },
                        data: {
                            acceptorId: acceptorId,
                            status: 'ACCEPTED',
                            acceptedAt: new Date(),
                            canCancelUntil: null // Désactiver l'annulation après acceptation
                        },
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
                            },
                            fight: {
                                include: {
                                    fighterA: true,
                                    fighterB: true,
                                    dayEvent: true
                                }
                            }
                        }
                    });
                    // Notifier le créateur (simplifié pour être plus rapide)
                    yield tx.notification.create({
                        data: {
                            userId: bet.creatorId,
                            type: 'BET_ACCEPTED',
                            title: 'Pari accepté !',
                            message: `${(_b = updatedBet.acceptor) === null || _b === void 0 ? void 0 : _b.name} a accepté votre pari de ${bet.amount} FCFA.`,
                        }
                    });
                    logger_1.default.info(`Pari accepté: ${bet.id} par ${(_c = updatedBet.acceptor) === null || _c === void 0 ? void 0 : _c.name}`);
                    return updatedBet;
                }), {
                    maxWait: 10000,
                    timeout: 15000
                });
                // Notifier l'accepteur (en dehors de la transaction pour la performance)
                try {
                    yield this.prisma.notification.create({
                        data: {
                            userId: acceptorId,
                            type: client_1.NotificationType.BET_ACCEPTED,
                            title: 'Pari accepté',
                            message: `Vous avez accepté le pari de ${bet.creator.name} de ${bet.amount} FCFA.`,
                        }
                    });
                }
                catch (notifError) {
                    logger_1.default.error('Erreur notification accepteur:', notifError);
                }
                return result;
            }
            catch (error) {
                logger_1.default.error('Erreur lors de l\'acceptation du pari:', error);
                throw error;
            }
        });
    }
    cancelBet(betId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (betId, userId, isAdmin = false) {
            try {
                return yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const bet = yield tx.bet.findUnique({
                        where: { id: betId },
                        include: {
                            creator: true,
                            acceptor: true,
                            fight: {
                                include: {
                                    dayEvent: true
                                }
                            }
                        }
                    });
                    if (!bet) {
                        throw new Error('Pari non trouvé');
                    }
                    // Vérifier les permissions
                    if (!isAdmin && bet.creatorId !== userId && bet.acceptorId !== userId) {
                        throw new Error('Non autorisé à annuler ce pari');
                    }
                    // Vérifier le statut
                    if (bet.status !== 'PENDING' && bet.status !== 'ACCEPTED') {
                        throw new Error('Impossible d\'annuler ce pari');
                    }
                    // Vérifier la fenêtre d'annulation (seulement pour le créateur)
                    const now = new Date();
                    if (bet.creatorId === userId && bet.canCancelUntil && (0, date_fns_1.isAfter)(now, bet.canCancelUntil)) {
                        throw new Error('La fenêtre d\'annulation de 20 minutes est expirée');
                    }
                    // Vérifier si le combat a commencé
                    const fightStartTime = bet.fight.scheduledAt || ((_a = bet.fight.dayEvent) === null || _a === void 0 ? void 0 : _a.date);
                    if ((0, date_fns_1.isAfter)(now, fightStartTime)) {
                        throw new Error('Impossible d\'annuler un pari sur un combat déjà commencé');
                    }
                    // REMBOURSER ET libérer les fonds du créateur
                    const amountToRefund = BigInt(Math.floor(Number(bet.amount)));
                    yield tx.wallet.update({
                        where: { userId: bet.creatorId },
                        data: {
                            balance: { increment: amountToRefund },
                            lockedBalance: { decrement: amountToRefund }
                        }
                    });
                    // REMBOURSER ET libérer les fonds de l'accepteur si présent
                    if (bet.acceptorId) {
                        yield tx.wallet.update({
                            where: { userId: bet.acceptorId },
                            data: {
                                balance: { increment: amountToRefund },
                                lockedBalance: { decrement: amountToRefund }
                            }
                        });
                    }
                    // Mettre à jour le pari
                    const cancelledBet = yield tx.bet.update({
                        where: { id: betId },
                        data: {
                            status: 'CANCELLED',
                            cancelledAt: now
                        },
                        include: {
                            creator: true,
                            acceptor: true,
                            fight: {
                                include: {
                                    dayEvent: true
                                }
                            }
                        }
                    });
                    // Mettre à jour les statistiques de la journée si elle existe
                    if (bet.fight.dayEventId) {
                        const totalAmountDecrement = BigInt(Math.floor(Number(bet.amount)));
                        yield tx.dayEvent.update({
                            where: { id: bet.fight.dayEventId },
                            data: {
                                totalBets: { decrement: 1 },
                                totalAmount: { decrement: totalAmountDecrement }
                            }
                        });
                    }
                    return cancelledBet;
                }), {
                    maxWait: 10000,
                    timeout: 15000
                });
                // Opérations non-critiques après la transaction
                yield this.handlePostCancelOperations(betId, userId, isAdmin);
            }
            catch (error) {
                logger_1.default.error('Erreur lors de l\'annulation du pari:', error);
                throw error;
            }
        });
    }
    handlePostCancelOperations(betId, userId, isAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const bet = yield this.prisma.bet.findUnique({
                    where: { id: betId },
                    include: {
                        creator: true,
                        acceptor: true,
                        fight: {
                            include: {
                                dayEvent: true
                            }
                        }
                    }
                });
                if (!bet)
                    return;
                // Créer des transactions de remboursement si accepté
                if (bet.status === 'ACCEPTED') {
                    yield Promise.all([
                        this.prisma.transaction.create({
                            data: {
                                type: client_1.TransactionType.BET_REFUND,
                                amount: BigInt(Math.floor(Number(bet.amount))),
                                userId: bet.creatorId,
                                status: client_1.TransactionStatus.CONFIRMED,
                                notes: `Annulation du pari ${bet.id}`
                            }
                        }),
                        bet.acceptorId ? this.prisma.transaction.create({
                            data: {
                                type: client_1.TransactionType.BET_REFUND,
                                amount: BigInt(Math.floor(Number(bet.amount))),
                                userId: bet.acceptorId,
                                status: client_1.TransactionStatus.CONFIRMED,
                                notes: `Annulation du pari ${bet.id}`
                            }
                        }) : Promise.resolve()
                    ]);
                }
                // Notifications
                const notifications = [];
                notifications.push(this.prisma.notification.create({
                    data: {
                        userId: bet.creatorId,
                        type: 'BET_CANCELLED',
                        title: 'Pari annulé',
                        message: `Votre pari de ${bet.amount} FCFA sur "${(_a = bet.fight.dayEvent) === null || _a === void 0 ? void 0 : _a.title}" a été annulé. Les fonds ont été remboursés.`,
                    }
                }));
                if (bet.acceptorId) {
                    notifications.push(this.prisma.notification.create({
                        data: {
                            userId: bet.acceptorId,
                            type: 'BET_CANCELLED',
                            title: 'Pari annulé',
                            message: `Le pari que vous avez accepté sur "${(_b = bet.fight.dayEvent) === null || _b === void 0 ? void 0 : _b.title}" a été annulé. Les fonds ont été remboursés.`,
                        }
                    }));
                }
                yield Promise.all(notifications);
                logger_1.default.info(`Pari annulé: ${bet.id} par ${isAdmin ? 'admin' : 'utilisateur'} ${userId}`);
            }
            catch (error) {
                logger_1.default.error('Erreur dans les opérations post-annulation:', error);
            }
        });
    }
    settleBet(betId, winner) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const bet = yield tx.bet.findUnique({
                        where: { id: betId },
                        include: {
                            creator: true,
                            acceptor: true,
                            fight: {
                                include: {
                                    fighterA: true,
                                    fighterB: true,
                                    dayEvent: true
                                }
                            }
                        }
                    });
                    if (!bet) {
                        throw new Error('Pari non trouvé');
                    }
                    if (bet.status !== 'ACCEPTED') {
                        throw new Error('Pari non accepté, impossible de le régler');
                    }
                    if (!bet.acceptorId) {
                        throw new Error('Pari sans accepteur, impossible de le régler');
                    }
                    const now = new Date();
                    let updatedBet;
                    if (winner === 'DRAW') {
                        // Match nul - remboursement complet des deux parties
                        const betAmountBigInt = BigInt(Math.floor(Number(bet.amount)));
                        yield Promise.all([
                            // REMBOURSEMENT créateur
                            tx.wallet.update({
                                where: { userId: bet.creatorId },
                                data: {
                                    balance: { increment: betAmountBigInt },
                                    lockedBalance: { decrement: betAmountBigInt }
                                }
                            }),
                            // REMBOURSEMENT accepteur
                            tx.wallet.update({
                                where: { userId: bet.acceptorId },
                                data: {
                                    balance: { increment: betAmountBigInt },
                                    lockedBalance: { decrement: betAmountBigInt }
                                }
                            })
                        ]);
                        updatedBet = yield tx.bet.update({
                            where: { id: betId },
                            data: {
                                status: 'REFUNDED',
                                settledAt: now
                            }
                        });
                    }
                    else {
                        // Déterminer le gagnant
                        const isCreatorWinner = bet.chosenFighter === winner;
                        const winnerId = isCreatorWinner ? bet.creatorId : bet.acceptorId;
                        const loserId = isCreatorWinner ? bet.acceptorId : bet.creatorId;
                        // Calculer le gain
                        const betAmountNumber = Number(bet.amount);
                        const totalPot = betAmountNumber * 2;
                        const commission = totalPot * (this.COMMISSION_PERCENTAGE / 100);
                        const winAmount = totalPot - commission;
                        // Convertir en BigInt
                        const betAmountBigInt = BigInt(Math.floor(betAmountNumber));
                        const winAmountBigInt = BigInt(Math.floor(winAmount));
                        // Mettre à jour les wallets en parallèle
                        yield Promise.all([
                            // Perdant - juste libérer les fonds bloqués (le solde a déjà été déduit)
                            tx.wallet.update({
                                where: { userId: loserId },
                                data: {
                                    lockedBalance: { decrement: betAmountBigInt },
                                    totalLost: { increment: betAmountBigInt }
                                }
                            }),
                            // Gagnant - libérer fonds bloqués + ajouter gain
                            tx.wallet.update({
                                where: { userId: winnerId },
                                data: {
                                    balance: { increment: winAmountBigInt },
                                    lockedBalance: { decrement: betAmountBigInt },
                                    totalWon: { increment: winAmountBigInt }
                                }
                            })
                        ]);
                        // Créer transaction de gain
                        const transaction = yield tx.transaction.create({
                            data: {
                                type: 'BET_WIN',
                                amount: winAmountBigInt,
                                userId: winnerId,
                                status: client_1.TransactionStatus.CONFIRMED,
                                notes: `Gain du pari ${bet.id}`
                            }
                        });
                        // Mettre à jour le pari
                        updatedBet = yield tx.bet.update({
                            where: { id: betId },
                            data: {
                                status: client_1.BetStatus.WON,
                                actualWin: winAmountBigInt,
                                settledAt: now,
                                // transactionId field in Bet? Schema check: Bet does NOT have transactionId.
                                // Bet has listings of Winnings.
                                // So removing transactionId update.
                                // And using actualWin instead of winAmount.
                            }
                        });
                        // Enregistrer la commission
                        yield tx.commission.create({
                            data: {
                                transactionId: transaction.id,
                                type: 'BET',
                                amount: BigInt(Math.floor(commission)),
                                betId: bet.id
                            }
                        });
                    }
                    return updatedBet;
                }), {
                    maxWait: 10000,
                    timeout: 15000
                });
                // Opérations non-critiques après la transaction
                yield this.handlePostSettleOperations(betId, winner);
            }
            catch (error) {
                logger_1.default.error('Erreur lors du traitement du pari:', error);
                throw error;
            }
        });
    }
    handlePostSettleOperations(betId, winner) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bet = yield this.prisma.bet.findUnique({
                    where: { id: betId },
                    include: {
                        creator: true,
                        acceptor: true,
                        fight: {
                            include: {
                                fighterA: true,
                                fighterB: true,
                                dayEvent: true
                            }
                        }
                    }
                });
                if (!bet)
                    return;
                if (winner === 'DRAW') {
                    // Transactions de remboursement pour match nul
                    yield Promise.all([
                        this.prisma.transaction.create({
                            data: {
                                type: 'BET_REFUND',
                                amount: BigInt(Math.floor(Number(bet.amount))),
                                userId: bet.creatorId,
                                status: client_1.TransactionStatus.CONFIRMED,
                                notes: `Remboursement match nul - Pari ${bet.id}`
                            }
                        }),
                        this.prisma.transaction.create({
                            data: {
                                type: 'BET_REFUND',
                                amount: BigInt(Math.floor(Number(bet.amount))),
                                userId: bet.acceptorId,
                                status: client_1.TransactionStatus.CONFIRMED,
                                notes: `Remboursement match nul - Pari ${bet.id}`
                            }
                        })
                    ]);
                    // Notifications pour match nul
                    yield Promise.all([
                        this.prisma.notification.create({
                            data: {
                                userId: bet.creatorId,
                                type: 'BET_REFUNDED',
                                title: 'Match nul - Remboursement',
                                message: `Votre pari de ${bet.amount} FCFA a été remboursé suite au match nul.`,
                            }
                        }),
                        this.prisma.notification.create({
                            data: {
                                userId: bet.acceptorId,
                                type: 'BET_REFUNDED',
                                title: 'Match nul - Remboursement',
                                message: `Votre pari de ${bet.amount} FCFA a été remboursé suite au match nul.`,
                            }
                        })
                    ]);
                }
                else {
                    // Déterminer le gagnant
                    const isCreatorWinner = bet.chosenFighter === winner;
                    const winnerId = isCreatorWinner ? bet.creatorId : bet.acceptorId;
                    const loserId = isCreatorWinner ? bet.acceptorId : bet.creatorId;
                    // Calculer la commission
                    const totalPot = new library_1.Decimal(bet.amount).mul(2);
                    const commission = totalPot.mul(this.COMMISSION_PERCENTAGE / 100);
                    // Notifications
                    yield Promise.all([
                        this.prisma.notification.create({
                            data: {
                                userId: winnerId,
                                type: 'BET_WON',
                                title: 'Pari gagné !',
                                message: `Félicitations ! Vous avez gagné ${bet.actualWin} FCFA sur votre pari.`,
                            }
                        }),
                        this.prisma.notification.create({
                            data: {
                                userId: loserId,
                                type: 'BET_LOST',
                                title: 'Pari perdu',
                                message: `Votre pari de ${bet.amount} FCFA a été perdu.`,
                            }
                        })
                    ]);
                }
                logger_1.default.info(`Pari traité: ${bet.id} - Statut: ${bet.status}`);
            }
            catch (error) {
                logger_1.default.error('Erreur dans les opérations post-traitement:', error);
            }
        });
    }
    getBet(betId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bet = yield this.prisma.bet.findUnique({
                    where: { id: betId },
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
                        },
                        fight: {
                            include: {
                                fighterA: true,
                                fighterB: true,
                                dayEvent: true,
                                result: true
                            }
                        },
                    }
                });
                if (!bet) {
                    throw new Error('Pari non trouvé');
                }
                return bet;
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération du pari:', error);
                throw error;
            }
        });
    }
    listBets(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, fightId, dayEventId, status, limit = 20, offset = 0 } = filters;
                const where = {};
                if (userId) {
                    where.OR = [
                        { creatorId: userId },
                        { acceptorId: userId }
                    ];
                }
                if (fightId) {
                    where.fightId = fightId;
                }
                if (dayEventId) {
                    where.fight = {
                        dayEventId: dayEventId
                    };
                }
                if (status) {
                    where.status = status;
                }
                const [bets, total] = yield Promise.all([
                    this.prisma.bet.findMany({
                        where,
                        include: {
                            creator: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            },
                            acceptor: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            },
                            fight: {
                                include: {
                                    fighterA: true,
                                    fighterB: true,
                                    dayEvent: true
                                }
                            }
                        },
                        take: limit,
                        skip: offset,
                        orderBy: { createdAt: 'desc' }
                    }),
                    this.prisma.bet.count({ where })
                ]);
                return {
                    bets,
                    total,
                    limit,
                    offset
                };
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des paris:', error);
                throw error;
            }
        });
    }
    getAvailableBets(fightId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                return yield this.prisma.bet.findMany({
                    where: {
                        fightId: fightId,
                        status: 'PENDING',
                        fight: {
                            status: 'SCHEDULED',
                            dayEvent: {
                                status: 'SCHEDULED'
                            }
                        }
                    },
                    include: {
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                phone: true
                            }
                        },
                        fight: {
                            include: {
                                fighterA: true,
                                fighterB: true,
                                dayEvent: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des paris disponibles:', error);
                throw error;
            }
        });
    }
    getUserBets(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [createdBets, acceptedBets] = yield Promise.all([
                    this.prisma.bet.findMany({
                        where: { creatorId: userId },
                        include: {
                            acceptor: {
                                select: {
                                    id: true,
                                    name: true,
                                    phone: true
                                }
                            },
                            fight: {
                                include: {
                                    fighterA: true,
                                    fighterB: true,
                                    dayEvent: true,
                                    result: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }),
                    this.prisma.bet.findMany({
                        where: { acceptorId: userId },
                        include: {
                            creator: {
                                select: {
                                    id: true,
                                    name: true,
                                    phone: true
                                }
                            },
                            fight: {
                                include: {
                                    fighterA: true,
                                    fighterB: true,
                                    dayEvent: true,
                                    result: true
                                }
                            }
                        },
                        orderBy: { acceptedAt: 'desc' }
                    })
                ]);
                return {
                    created: createdBets,
                    accepted: acceptedBets
                };
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des paris de l\'utilisateur:', error);
                throw error;
            }
        });
    }
    getActiveBetsForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                return yield this.prisma.bet.findMany({
                    where: {
                        OR: [
                            { creatorId: userId },
                            { acceptorId: userId }
                        ],
                        status: {
                            in: ['PENDING', 'ACCEPTED']
                        },
                        fight: {
                            status: 'SCHEDULED',
                            dayEvent: {
                                status: 'SCHEDULED'
                            }
                        }
                    },
                    include: {
                        creator: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        acceptor: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        fight: {
                            include: {
                                fighterA: true,
                                fighterB: true,
                                dayEvent: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des paris actifs:', error);
                throw error;
            }
        });
    }
    getBetStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this.prisma.$queryRaw `
        SELECT 
          COUNT(*) as total_bets,
          SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted_bets,
          SUM(CASE WHEN status = 'CREATOR_WON' AND creatorId = ${userId} THEN 1 ELSE 0 END) as won_as_creator,
          SUM(CASE WHEN status = 'ACCEPTOR_WON' AND acceptorId = ${userId} THEN 1 ELSE 0 END) as won_as_acceptor,
          SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END) as refunded_bets,
          SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bets,
          COALESCE(SUM(amount), 0) as total_wagered,
          COALESCE(SUM(winAmount), 0) as total_won
        FROM bets 
        WHERE creatorId = ${userId} OR acceptorId = ${userId}
      `;
                return stats[0];
            }
            catch (error) {
                logger_1.default.error('Erreur lors de la récupération des statistiques:', error);
                throw error;
            }
        });
    }
    expirePendingBetsBeforeFight() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const now = new Date();
                // Trouver les combats qui commencent dans moins de 30 minutes
                const upcomingFights = yield this.prisma.fight.findMany({
                    where: {
                        status: 'SCHEDULED',
                        OR: [
                            { scheduledAt: { lte: (0, date_fns_1.addMinutes)(now, 30), gt: now } },
                            {
                                dayEvent: {
                                    date: { lte: (0, date_fns_1.addMinutes)(now, 30), gt: now }
                                }
                            }
                        ]
                    },
                    include: {
                        dayEvent: true,
                        bets: {
                            where: {
                                status: 'PENDING'
                            }
                        }
                    }
                });
                let expiredCount = 0;
                for (const fight of upcomingFights) {
                    for (const bet of fight.bets) {
                        // REMBOURSER les fonds (solde + libérer)
                        // Bet amount should be Decimal or string. If Decimal, we might need to be careful with precision.
                        // Assuming amount is stored as string in decimal field or Decimal type in Prisma.
                        // Prisma Decimal -> Number -> BigInt (floor)
                        // Or if it's already a string/number.
                        // Using BigInt constructor on string is safest if integer. If decimal, it throws.
                        // We floor it first. 
                        const amountBigInt = BigInt(Math.floor(Number(bet.amount)));
                        yield this.prisma.wallet.update({
                            where: { userId: bet.creatorId },
                            data: {
                                balance: { increment: amountBigInt },
                                lockedBalance: { decrement: amountBigInt }
                            }
                        });
                        // Marquer le pari comme expiré
                        yield this.prisma.bet.update({
                            where: { id: bet.id },
                            data: {
                                status: 'CANCELLED',
                                cancelledAt: now
                            }
                        });
                        // Notification
                        yield this.prisma.notification.create({
                            data: {
                                userId: bet.creatorId,
                                type: 'BET_REFUNDED',
                                title: 'Pari expiré',
                                message: `Votre pari sur "${(_a = fight.dayEvent) === null || _a === void 0 ? void 0 : _a.title}" a été annulé car le combat commence bientôt. Les fonds ont été remboursés.`,
                            }
                        });
                        expiredCount++;
                        logger_1.default.info(`Pari expiré: ${bet.id} pour le combat: ${fight.id}`);
                    }
                }
                return expiredCount;
            }
            catch (error) {
                logger_1.default.error('Erreur lors de l\'expiration des paris:', error);
                throw error;
            }
        });
    }
}
exports.BetService = BetService;

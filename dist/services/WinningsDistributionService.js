"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinningsDistributionService = void 0;
const typedi_1 = require("typedi");
const logger_1 = __importDefault(require("../utils/logger"));
let WinningsDistributionService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var WinningsDistributionService = _classThis = class {
        constructor(prisma, notificationService) {
            this.prisma = prisma;
            this.notificationService = notificationService;
            this.WINNER_PERCENTAGE = 0.95; // 95% du pot pour les gagnants
            this.DRAW_REFUND_PERCENTAGE = 0.975; // 97.5% de remboursement
            this.COMMISSION_PERCENTAGE = 0.05; // 5% de commission
            this.PROCESSING_TIMEOUT = 60000; // 60 secondes
        }
        /**
         * Distribuer les gains pour un combat
         * Transaction atomique avec timeout de 60 secondes
         */
        distributeWinnings(fightId, winner) {
            return __awaiter(this, void 0, void 0, function* () {
                const startTime = Date.now();
                try {
                    logger_1.default.info(`Starting winnings distribution for fight ${fightId}, winner: ${winner}`);
                    // Récupérer tous les paris du combat
                    const bets = yield this.prisma.bet.findMany({
                        where: {
                            fightId,
                            status: 'ACCEPTED'
                        }
                    });
                    if (bets.length === 0) {
                        logger_1.default.info(`No bets to process for fight ${fightId}`);
                        return {
                            totalPot: BigInt(0),
                            commission: BigInt(0),
                            distributedAmount: BigInt(0),
                            winningBetsCount: 0,
                            losingBetsCount: 0,
                            processedBets: [],
                            duration: Date.now() - startTime
                        };
                    }
                    // Calculer les montants
                    const calculations = this.calculateWinnings(bets, winner);
                    // Exécuter la distribution dans une transaction atomique
                    const result = yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                        var _a;
                        // Marquer le combat comme en cours de distribution
                        yield tx.fight.update({
                            where: { id: fightId },
                            data: {
                                distributionStatus: 'PROCESSING',
                                winner
                            }
                        });
                        // Traiter chaque pari
                        for (const calc of calculations.processedBets) {
                            // Mettre à jour le statut du pari
                            yield tx.bet.update({
                                where: { id: calc.betId },
                                data: {
                                    status: calc.status,
                                    actualWin: calc.winAmount > 0 ? calc.winAmount : null,
                                    settledAt: new Date()
                                }
                            });
                            // Unlock the locked balance for this bet
                            yield tx.wallet.update({
                                where: { userId: calc.userId },
                                data: {
                                    lockedBalance: { decrement: calc.originalAmount }
                                }
                            });
                            // Créditer le wallet si gain ou remboursement
                            if (calc.winAmount > 0) {
                                yield tx.wallet.update({
                                    where: { userId: calc.userId },
                                    data: {
                                        balance: { increment: calc.winAmount },
                                        totalWon: calc.status === 'WON' ? { increment: calc.winAmount } : undefined,
                                        totalLost: calc.status === 'LOST' ? { increment: calc.originalAmount } : undefined
                                    }
                                });
                                // Créer une transaction
                                const transaction = yield tx.transaction.create({
                                    data: {
                                        type: calc.status === 'WON' ? 'BET_WIN' : 'BET_REFUND',
                                        amount: calc.winAmount,
                                        userId: calc.userId,
                                        status: 'CONFIRMED',
                                        notes: `${calc.status === 'WON' ? 'Gain' : 'Remboursement'} du pari sur le combat ${fightId}`
                                    }
                                });
                            }
                            else if (calc.status === 'LOST') {
                                // Update totalLost for losers
                                yield tx.wallet.update({
                                    where: { userId: calc.userId },
                                    data: {
                                        totalLost: { increment: calc.originalAmount }
                                    }
                                });
                            }
                        }
                        // Enregistrer la commission
                        if (calculations.commission > 0) {
                            const commissionTransaction = yield tx.transaction.create({
                                data: {
                                    type: 'COMMISSION',
                                    amount: calculations.commission,
                                    userId: ((_a = calculations.processedBets[0]) === null || _a === void 0 ? void 0 : _a.userId) || 'system',
                                    status: 'CONFIRMED',
                                    notes: `Commission pour le combat ${fightId}`
                                }
                            });
                            yield tx.commission.create({
                                data: {
                                    type: 'BET',
                                    fightId,
                                    amount: calculations.commission,
                                    percentage: this.COMMISSION_PERCENTAGE * 100,
                                    transactionId: commissionTransaction.id
                                }
                            });
                        }
                        // Marquer le combat comme distribué
                        yield tx.fight.update({
                            where: { id: fightId },
                            data: {
                                distributionStatus: 'COMPLETED',
                                distributedAt: new Date()
                            }
                        });
                        return calculations;
                    }), {
                        timeout: this.PROCESSING_TIMEOUT,
                        isolationLevel: 'Serializable'
                    });
                    const duration = Date.now() - startTime;
                    // Logger performance
                    if (duration > this.PROCESSING_TIMEOUT) {
                        logger_1.default.warn(`Distribution took longer than 60s: ${duration}ms for fight ${fightId}`);
                    }
                    else {
                        logger_1.default.info(`Distribution completed in ${duration}ms for fight ${fightId}`);
                    }
                    // Envoyer les notifications (asynchrone, ne bloque pas)
                    this.sendNotifications(result.processedBets, fightId).catch(err => {
                        logger_1.default.error('Error sending notifications:', err);
                    });
                    return Object.assign(Object.assign({}, result), { duration });
                }
                catch (error) {
                    logger_1.default.error(`Error distributing winnings for fight ${fightId}:`, error);
                    // Marquer comme échoué
                    yield this.prisma.fight.update({
                        where: { id: fightId },
                        data: { distributionStatus: 'FAILED' }
                    }).catch(err => logger_1.default.error('Error marking distribution as failed:', err));
                    throw error;
                }
            });
        }
        /**
         * Calculer les gains selon le résultat
         */
        calculateWinnings(bets, winner) {
            const totalPot = bets.reduce((sum, bet) => sum + BigInt(bet.amount.toString()), BigInt(0));
            if (winner === 'DRAW') {
                return this.calculateDrawScenario(bets, totalPot);
            }
            else {
                return this.calculateWinnerScenario(bets, totalPot, winner);
            }
        }
        /**
         * Scénario victoire: 95% du pot pour les gagnants
         */
        calculateWinnerScenario(bets, totalPot, winner) {
            // Filtrer les paris gagnants et perdants
            const winningBets = bets.filter(bet => (winner === 'A' && bet.chosenFighter === 'A') ||
                (winner === 'B' && bet.chosenFighter === 'B'));
            const losingBets = bets.filter(bet => !winningBets.includes(bet));
            // Calculer la commission (5% du pot total)
            const commission = (totalPot * BigInt(Math.floor(this.COMMISSION_PERCENTAGE * 100))) / BigInt(100);
            // Montant distribuable (95% du pot)
            const distributedAmount = totalPot - commission;
            // Calculer le pot des gagnants
            const winningPot = winningBets.reduce((sum, bet) => sum + BigInt(bet.amount.toString()), BigInt(0));
            const processedBets = [];
            // Si personne n'a gagné (tous ont parié sur le perdant), la commission prend tout
            if (winningBets.length === 0) {
                losingBets.forEach(bet => {
                    processedBets.push({
                        userId: bet.creatorId,
                        betId: bet.id,
                        originalAmount: BigInt(bet.amount.toString()),
                        winAmount: BigInt(0),
                        status: 'LOST'
                    });
                });
                return {
                    totalPot,
                    commission: totalPot, // Toute la mise devient commission
                    distributedAmount: BigInt(0),
                    winningBetsCount: 0,
                    losingBetsCount: losingBets.length,
                    processedBets
                };
            }
            // Distribuer proportionnellement aux gagnants
            winningBets.forEach(bet => {
                // Gain = (mise / pot gagnants) × montant distribuable
                const betAmount = BigInt(bet.amount.toString());
                const winAmount = (betAmount * distributedAmount) / winningPot;
                processedBets.push({
                    userId: bet.creatorId,
                    betId: bet.id,
                    originalAmount: betAmount,
                    winAmount,
                    status: 'WON'
                });
            });
            // Marquer les perdants
            losingBets.forEach(bet => {
                processedBets.push({
                    userId: bet.creatorId,
                    betId: bet.id,
                    originalAmount: BigInt(bet.amount.toString()),
                    winAmount: BigInt(0),
                    status: 'LOST'
                });
            });
            return {
                totalPot,
                commission,
                distributedAmount,
                winningBetsCount: winningBets.length,
                losingBetsCount: losingBets.length,
                processedBets
            };
        }
        /**
         * Scénario match nul: 97.5% de remboursement pour tous
         */
        calculateDrawScenario(bets, totalPot) {
            // Commission de 2.5% (100% - 97.5%)
            const refundPercentage = BigInt(Math.floor(this.DRAW_REFUND_PERCENTAGE * 100));
            const commission = totalPot - (totalPot * refundPercentage / BigInt(100));
            const processedBets = bets.map(bet => {
                // Remboursement = mise × 97.5%
                const betAmount = BigInt(bet.amount.toString());
                const refundAmount = (betAmount * refundPercentage) / BigInt(100);
                return {
                    userId: bet.creatorId,
                    betId: bet.id,
                    originalAmount: betAmount,
                    winAmount: refundAmount,
                    status: 'REFUNDED'
                };
            });
            const distributedAmount = processedBets.reduce((sum, calc) => sum + calc.winAmount, BigInt(0));
            return {
                totalPot,
                commission,
                distributedAmount,
                winningBetsCount: 0,
                losingBetsCount: 0,
                processedBets
            };
        }
        /**
         * Envoyer les notifications aux parieurs
         */
        sendNotifications(calculations, fightId) {
            return __awaiter(this, void 0, void 0, function* () {
                const notifications = calculations.map(calc => {
                    let type;
                    let title;
                    let message;
                    switch (calc.status) {
                        case 'WON':
                            type = 'BET_WON';
                            title = '🎉 Pari gagné !';
                            message = `Félicitations ! Vous avez gagné ${Number(calc.winAmount).toLocaleString()} FCFA`;
                            break;
                        case 'LOST':
                            type = 'BET_LOST';
                            title = 'Pari perdu';
                            message = `Votre pari de ${Number(calc.originalAmount).toLocaleString()} FCFA n'a pas gagné`;
                            break;
                        case 'REFUNDED':
                            type = 'BET_REFUNDED';
                            title = 'Match nul - Remboursement';
                            message = `Vous avez été remboursé ${Number(calc.winAmount).toLocaleString()} FCFA (97.5% de votre mise)`;
                            break;
                        default:
                            return null;
                    }
                    return this.notificationService.sendNotification({
                        userId: calc.userId,
                        type,
                        title,
                        message,
                        data: {
                            betId: calc.betId,
                            fightId,
                            amount: Number(calc.winAmount),
                            originalAmount: Number(calc.originalAmount)
                        }
                    });
                }).filter(Boolean);
                yield Promise.allSettled(notifications);
            });
        }
        /**
         * Obtenir les statistiques de commission
         */
        getCommissionStats(startDate, endDate) {
            return __awaiter(this, void 0, void 0, function* () {
                const where = {};
                if (startDate || endDate) {
                    where.createdAt = {};
                    if (startDate)
                        where.createdAt.gte = startDate;
                    if (endDate)
                        where.createdAt.lte = endDate;
                }
                const commissions = yield this.prisma.commission.findMany({
                    where,
                    include: {
                        fight: {
                            select: {
                                title: true,
                                scheduledAt: true
                            }
                        }
                    },
                    orderBy: { deductedAt: 'desc' }
                });
                const totalCommission = commissions.reduce((sum, c) => sum + c.amount, BigInt(0));
                return {
                    total: Number(totalCommission),
                    count: commissions.length,
                    commissions: commissions.map(c => (Object.assign(Object.assign({}, c), { amount: Number(c.amount) })))
                };
            });
        }
    };
    __setFunctionName(_classThis, "WinningsDistributionService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WinningsDistributionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WinningsDistributionService = _classThis;
})();
exports.WinningsDistributionService = WinningsDistributionService;

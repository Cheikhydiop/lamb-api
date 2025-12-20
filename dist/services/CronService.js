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
exports.CronService = void 0;
const typedi_1 = require("typedi");
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const WebSocketService_1 = require("./WebSocketService");
const date_fns_1 = require("date-fns");
let CronService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CronService = _classThis = class {
        constructor() {
            this.prisma = typedi_1.Container.get(client_1.PrismaClient);
            this.webSocketService = typedi_1.Container.get(WebSocketService_1.WebSocketService);
        }
        init() {
            logger_1.default.info('Initializing Cron Service...');
            // Run every minute
            node_cron_1.default.schedule('* * * * *', () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.handleExpiredBets();
                }
                catch (error) {
                    logger_1.default.error('Error in cron job:', error);
                }
            }));
            logger_1.default.info('Cron Service initialized');
        }
        /**
         * Cancel pending bets for fights that are starting soon (< 30 mins) or have started
         */
        handleExpiredBets() {
            return __awaiter(this, void 0, void 0, function* () {
                const now = new Date();
                const thirtyMinutesFromNow = (0, date_fns_1.addMinutes)(now, 30);
                // Find bets that are PENDING and associated with fights that are starting soon or started
                // Actually, we should cancel bets if the fight is less than 30 mins away, because they can't be accepted anymore.
                // 1. Find fights that are starting within the next 30 mins or have passed
                // We look for bets directly to avoid complex fight queries if no bets exist
                const expiredBets = yield this.prisma.bet.findMany({
                    where: {
                        status: 'PENDING',
                        fight: {
                            OR: [
                                { scheduledAt: { lte: thirtyMinutesFromNow } }, // Fight scheduled <= 30 mins from now (includes past)
                            ]
                        }
                    },
                    include: {
                        fight: true,
                        creator: true
                    },
                    take: 50 // Process in batches to avoid overwhelming
                });
                if (expiredBets.length === 0)
                    return;
                logger_1.default.info(`Found ${expiredBets.length} expired pending bets to cancel`);
                for (const bet of expiredBets) {
                    try {
                        yield this.cancelExpiredBet(bet.id, bet.creatorId, bet.amount);
                    }
                    catch (error) {
                        logger_1.default.error(`Failed to cancel expired bet ${bet.id}:`, error);
                    }
                }
            });
        }
        cancelExpiredBet(betId, creatorId, amount) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // 1. Update bet status
                    const bet = yield tx.bet.update({
                        where: { id: betId },
                        data: {
                            status: 'CANCELLED',
                            cancelledAt: new Date()
                        }
                    });
                    // 2. Refund creator
                    const amountBigInt = BigInt(Math.floor(Number(amount)));
                    yield tx.wallet.update({
                        where: { userId: creatorId },
                        data: {
                            balance: { increment: amountBigInt },
                            lockedBalance: { decrement: amountBigInt }
                        }
                    });
                    // 3. Create refund transaction
                    yield tx.transaction.create({
                        data: {
                            type: 'BET_REFUND',
                            amount: Number(amount),
                            userId: creatorId,
                            status: client_1.TransactionStatus.CONFIRMED, // Use Enum
                            notes: `Expiration du pari ${betId} (début du combat)`
                        }
                    });
                    // 4. Notify user via WS
                    if (this.webSocketService) {
                        this.webSocketService.broadcastNotification({
                            type: 'BET_CANCELLED', // Cast to any to bypass strict type check if enum incomplete
                            title: 'Pari expiré',
                            message: `Votre pari de ${amount} FCFA a été annulé car le combat commence bientôt.`,
                            timestamp: new Date().toISOString()
                        }, creatorId);
                        // Push wallet update
                        const wallet = yield tx.wallet.findUnique({ where: { userId: creatorId } });
                        if (wallet) {
                            this.webSocketService.broadcastWalletUpdate({
                                userId: creatorId,
                                balance: Number(wallet.balance),
                                lockedBalance: Number(wallet.lockedBalance),
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }));
                logger_1.default.info(`Expired bet ${betId} cancelled and refunded`);
            });
        }
    };
    __setFunctionName(_classThis, "CronService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CronService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CronService = _classThis;
})();
exports.CronService = CronService;

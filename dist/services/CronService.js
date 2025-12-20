"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
let CronService = class CronService {
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
exports.CronService = CronService;
exports.CronService = CronService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], CronService);

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
exports.CleanupService = void 0;
const typedi_1 = require("typedi");
const node_cron_1 = __importDefault(require("node-cron"));
const date_fns_1 = require("date-fns");
const logger_1 = __importDefault(require("../utils/logger"));
let CleanupService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CleanupService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.setupCronJobs();
        }
        setupCronJobs() {
            // Toutes les 5 minutes : expirer les fenêtres d'annulation
            node_cron_1.default.schedule('*/5 * * * *', () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.expireCancellationWindows();
                }
                catch (error) {
                    logger_1.default.error('Error in cancellation window cleanup:', error);
                }
            }));
            // Toutes les heures : expirer les paris non acceptés
            node_cron_1.default.schedule('0 * * * *', () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.expirePendingBets();
                }
                catch (error) {
                    logger_1.default.error('Error in pending bets cleanup:', error);
                }
            }));
            // Tous les jours à minuit : nettoyer les anciennes sessions
            node_cron_1.default.schedule('0 0 * * *', () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.cleanupOldSessions();
                    yield this.cleanupOldNotifications();
                    yield this.cleanupOldAuditLogs();
                }
                catch (error) {
                    logger_1.default.error('Error in daily cleanup:', error);
                }
            }));
            logger_1.default.info('Cron jobs initialized for cleanup service');
        }
        expireCancellationWindows() {
            return __awaiter(this, void 0, void 0, function* () {
                const now = new Date();
                const twentyMinutesAgo = (0, date_fns_1.addMinutes)(now, -20);
                // Trouver les paris avec fenêtre d'annulation expirée
                const bets = yield this.prisma.bet.findMany({
                    where: {
                        status: 'PENDING',
                        canCancelUntil: {
                            lt: now,
                            not: null
                        }
                    },
                    include: {
                        creator: true
                    }
                });
                let updatedCount = 0;
                for (const bet of bets) {
                    // Marquer la fenêtre comme expirée
                    yield this.prisma.bet.update({
                        where: { id: bet.id },
                        data: { canCancelUntil: null }
                    });
                    // Note: Notification type CANCELLATION_WINDOW_EXPIRED not in schema, using SYSTEM_MAINTENANCE
                    // TODO: Add CANCELLATION_WINDOW_EXPIRED to NotificationType enum if needed
                    logger_1.default.info(`Cancellation window expired for bet ${bet.id}`);
                    updatedCount++;
                }
                if (updatedCount > 0) {
                    logger_1.default.info(`Expired cancellation windows for ${updatedCount} bets`);
                }
                return updatedCount;
            });
        }
        expirePendingBets() {
            return __awaiter(this, void 0, void 0, function* () {
                const now = new Date();
                // Trouver les combats qui vont bientôt commencer
                const upcomingFights = yield this.prisma.fight.findMany({
                    where: {
                        status: 'SCHEDULED',
                        scheduledAt: {
                            lte: (0, date_fns_1.addHours)(now, 1), // Commence dans moins d'une heure
                            gt: now
                        }
                    },
                    include: {
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
                        // Libérer les fonds bloqués
                        yield this.prisma.wallet.update({
                            where: { userId: bet.creatorId },
                            data: { lockedBalance: { decrement: BigInt(bet.amount.toString()) } }
                        });
                        // Marquer comme annulé (EXPIRED n'existe pas dans BetStatus)
                        yield this.prisma.bet.update({
                            where: { id: bet.id },
                            data: {
                                status: 'CANCELLED',
                                canCancelUntil: null,
                                cancelReason: 'Pari non accepté avant le début du combat'
                            }
                        });
                        // Note: BET_EXPIRED not in NotificationType, using BET_REFUNDED
                        yield this.prisma.notification.create({
                            data: {
                                userId: bet.creatorId,
                                type: 'BET_REFUNDED',
                                title: 'Pari expiré',
                                message: `Votre pari sur "${fight.title}" a expiré car il n'a pas été accepté avant le combat.`,
                            }
                        });
                        expiredCount++;
                    }
                }
                if (expiredCount > 0) {
                    logger_1.default.info(`Expired ${expiredCount} pending bets before fights`);
                }
                return expiredCount;
            });
        }
        cleanupOldSessions() {
            return __awaiter(this, void 0, void 0, function* () {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const result = yield this.prisma.session.deleteMany({
                    where: {
                        OR: [
                            { expiresAt: { lt: new Date() } },
                            { updatedAt: { lt: thirtyDaysAgo } }
                        ]
                    }
                });
                if (result.count > 0) {
                    logger_1.default.info(`Cleaned up ${result.count} old sessions`);
                }
                return result.count;
            });
        }
        cleanupOldNotifications() {
            return __awaiter(this, void 0, void 0, function* () {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const result = yield this.prisma.notification.deleteMany({
                    where: {
                        createdAt: { lt: thirtyDaysAgo },
                        isRead: true
                    }
                });
                if (result.count > 0) {
                    logger_1.default.info(`Cleaned up ${result.count} old notifications`);
                }
                return result.count;
            });
        }
        cleanupOldAuditLogs() {
            return __awaiter(this, void 0, void 0, function* () {
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                const result = yield this.prisma.auditLog.deleteMany({
                    where: {
                        createdAt: { lt: ninetyDaysAgo }
                    }
                });
                if (result.count > 0) {
                    logger_1.default.info(`Cleaned up ${result.count} old audit logs`);
                }
                return result.count;
            });
        }
        cleanupExpiredOTPs() {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield this.prisma.otpCode.deleteMany({
                    where: {
                        expiresAt: { lt: new Date() }
                    }
                });
                if (result.count > 0) {
                    logger_1.default.info(`Cleaned up ${result.count} expired OTPs`);
                }
                return result.count;
            });
        }
        getCleanupStats() {
            return __awaiter(this, void 0, void 0, function* () {
                const now = new Date();
                const stats = yield this.prisma.$queryRaw `
      SELECT 
        (SELECT COUNT(*) FROM bets WHERE status = 'PENDING' AND canCancelUntil < NOW()) as pending_cancellation_bets,
        (SELECT COUNT(*) FROM bets WHERE status = 'PENDING' AND expiresAt < NOW()) as expired_pending_bets,
        (SELECT COUNT(*) FROM sessions WHERE expiresAt < NOW() OR updatedAt < NOW() - INTERVAL '30 days') as expired_sessions,
        (SELECT COUNT(*) FROM notifications WHERE createdAt < NOW() - INTERVAL '30 days' AND isRead = true) as old_notifications,
        (SELECT COUNT(*) FROM audit_logs WHERE createdAt < NOW() - INTERVAL '90 days') as old_audit_logs,
        (SELECT COUNT(*) FROM otp_codes WHERE expiresAt < NOW()) as expired_otps
    `;
                return stats[0];
            });
        }
    };
    __setFunctionName(_classThis, "CleanupService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CleanupService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CleanupService = _classThis;
})();
exports.CleanupService = CleanupService;

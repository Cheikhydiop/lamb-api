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
exports.CleanupService = void 0;
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const node_cron_1 = __importDefault(require("node-cron"));
const date_fns_1 = require("date-fns");
const logger_1 = __importDefault(require("../utils/logger"));
let CleanupService = class CleanupService {
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
exports.CleanupService = CleanupService;
exports.CleanupService = CleanupService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], CleanupService);

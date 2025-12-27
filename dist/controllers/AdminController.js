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
exports.AdminController = void 0;
const typedi_1 = __importDefault(require("typedi"));
const client_1 = require("@prisma/client");
const FightService_1 = require("../services/FightService");
const WebSocketService_1 = require("../services/WebSocketService");
class AdminController {
    static createFight(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fightService = typedi_1.default.get(FightService_1.FightService);
                const fightData = req.body;
                const fight = yield fightService.createFight(fightData);
                res.status(201).json({
                    success: true,
                    data: fight,
                    message: 'Combat créé avec succès'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static createDayEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fightService = typedi_1.default.get(FightService_1.FightService);
                const eventData = req.body;
                const event = yield fightService.createDayEvent(eventData);
                res.status(201).json({
                    success: true,
                    data: event,
                    message: 'Journée de lutte créée avec succès'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static validateFightResult(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fightService = typedi_1.default.get(FightService_1.FightService);
                const { fightId } = req.params;
                const resultData = Object.assign(Object.assign({}, req.body), { fightId });
                const result = yield fightService.validateFightResult(req.user.id, resultData);
                res.status(200).json({
                    success: true,
                    data: result,
                    message: 'Résultat validé et paris réglés'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static updateFightStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fightService = typedi_1.default.get(FightService_1.FightService);
                const { fightId } = req.params;
                const { status } = req.body;
                const fight = yield fightService.updateFightStatus(fightId, { status });
                res.status(200).json({
                    success: true,
                    data: fight,
                    message: `Statut du combat mis à jour vers ${status}`
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getDashboardStats(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = typedi_1.default.get(client_1.PrismaClient);
                const now = new Date();
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                const [totalUsers, activeUsers, totalFights, upcomingFights, totalBets, pendingBets, acceptedBets, cancelledBets, pendingWithdrawals, totalVolumeAgg, todayDepositsAgg, todayWithdrawalsAgg, totalCommissionAgg, todayCommissionAgg] = yield Promise.all([
                    prisma.user.count(),
                    prisma.user.count({
                        where: {
                            lastLogin: { gte: sevenDaysAgo }
                        }
                    }),
                    prisma.fight.count(),
                    prisma.fight.count({
                        where: {
                            status: 'SCHEDULED',
                            scheduledAt: { gt: new Date() }
                        }
                    }),
                    prisma.bet.count(),
                    prisma.bet.count({ where: { status: 'PENDING' } }),
                    prisma.bet.count({ where: { status: 'ACCEPTED' } }),
                    prisma.bet.count({ where: { status: 'CANCELLED' } }),
                    prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
                    prisma.bet.aggregate({ _sum: { amount: true } }),
                    prisma.transaction.aggregate({
                        where: {
                            type: 'DEPOSIT',
                            status: 'CONFIRMED',
                            createdAt: { gte: startOfDay }
                        },
                        _sum: { amount: true }
                    }),
                    prisma.transaction.aggregate({
                        where: {
                            type: 'WITHDRAWAL',
                            status: 'CONFIRMED',
                            createdAt: { gte: startOfDay }
                        },
                        _sum: { amount: true }
                    }),
                    prisma.commission.aggregate({
                        _sum: { amount: true }
                    }),
                    prisma.commission.aggregate({
                        where: {
                            deductedAt: { gte: startOfDay }
                        },
                        _sum: { amount: true }
                    })
                ]);
                res.status(200).json({
                    success: true,
                    data: {
                        totalUsers,
                        activeUsers,
                        totalFights,
                        upcomingFights,
                        totalBets,
                        pendingBets,
                        acceptedBets,
                        cancelledBets,
                        pendingWithdrawals,
                        totalVolume: Number(totalVolumeAgg._sum.amount || 0),
                        todayDeposits: Number(todayDepositsAgg._sum.amount || 0),
                        todayWithdrawals: Number(todayWithdrawalsAgg._sum.amount || 0),
                        totalCommission: Number(totalCommissionAgg._sum.amount || 0),
                        todayCommission: Number(todayCommissionAgg._sum.amount || 0)
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getAnalytics(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = typedi_1.default.get(client_1.PrismaClient);
                const days = 7;
                const now = new Date();
                const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                // Helper to format BigInt
                const serialize = (data) => data.map(row => ({
                    date: row.date.toISOString().split('T')[0],
                    total: Number(row.total || 0)
                }));
                // 1. Deposits per day
                const depositsRaw = yield prisma.$queryRaw `
                SELECT DATE("createdAt") as date, SUM(amount) as total
                FROM transactions
                WHERE type = 'DEPOSIT' 
                AND status = 'CONFIRMED' 
                AND "createdAt" >= ${startDate}
                GROUP BY DATE("createdAt")
                ORDER BY date ASC
            `;
                // 2. Withdrawals per day
                const withdrawalsRaw = yield prisma.$queryRaw `
                SELECT DATE("createdAt") as date, SUM(amount) as total
                FROM transactions
                WHERE type = 'WITHDRAWAL' 
                AND status = 'CONFIRMED' 
                AND "createdAt" >= ${startDate}
                GROUP BY DATE("createdAt")
                ORDER BY date ASC
            `;
                // 3. Revenue (Commissions) per day
                const commissionsRaw = yield prisma.$queryRaw `
                SELECT DATE("deductedAt") as date, SUM(amount) as total
                FROM commissions
                WHERE "deductedAt" >= ${startDate}
                GROUP BY DATE("deductedAt")
                ORDER BY date ASC
            `;
                res.status(200).json({
                    success: true,
                    data: {
                        deposits: serialize(depositsRaw),
                        withdrawals: serialize(withdrawalsRaw),
                        commissions: serialize(commissionsRaw)
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // ========== USERS ==========
    static getUsers(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = typedi_1.default.get(client_1.PrismaClient);
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const skip = (page - 1) * limit;
                const search = req.query.search;
                const where = {};
                if (search) {
                    where.OR = [
                        { name: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ];
                }
                const [users, total] = yield Promise.all([
                    prisma.user.findMany({
                        where,
                        include: {
                            wallet: true
                        },
                        skip,
                        take: limit,
                        orderBy: { createdAt: 'desc' }
                    }),
                    prisma.user.count({ where })
                ]);
                res.status(200).json({
                    success: true,
                    data: users,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = typedi_1.default.get(client_1.PrismaClient);
                const { id } = req.params;
                const user = yield prisma.user.findUnique({
                    where: { id },
                    include: {
                        wallet: true,
                        profile: true,
                        sessions: {
                            take: 5,
                            orderBy: { lastActivity: 'desc' }
                        }
                    }
                });
                if (!user) {
                    return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
                }
                res.status(200).json({
                    success: true,
                    data: user
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static updateUserStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = typedi_1.default.get(client_1.PrismaClient);
                const { id } = req.params;
                const { isBanned, banReason, isActive } = req.body;
                const updateData = {};
                if (isBanned !== undefined) {
                    updateData.isBanned = isBanned;
                    updateData.bannedAt = isBanned ? new Date() : null;
                    if (isBanned && banReason)
                        updateData.banReason = banReason;
                }
                if (isActive !== undefined)
                    updateData.isActive = isActive;
                const user = yield prisma.user.update({
                    where: { id },
                    data: updateData
                });
                res.status(200).json({
                    success: true,
                    data: user,
                    message: 'Statut utilisateur mis à jour'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // ========== WITHDRAWALS ==========
    static getWithdrawals(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = typedi_1.default.get(client_1.PrismaClient);
                const { status } = req.query;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 20;
                const skip = (page - 1) * limit;
                const where = {};
                if (status) {
                    where.status = status;
                }
                const [withdrawals, total] = yield Promise.all([
                    prisma.withdrawalRequest.findMany({
                        where,
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    phone: true
                                }
                            }
                        },
                        orderBy: { requestedAt: 'desc' },
                        skip,
                        take: limit
                    }),
                    prisma.withdrawalRequest.count({ where })
                ]);
                res.status(200).json({
                    success: true,
                    data: withdrawals,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static approveWithdrawal(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = typedi_1.default.get(client_1.PrismaClient);
                const { id } = req.params;
                const adminId = req.user.id;
                const { transactionRef, notes } = req.body;
                // Start transaction
                const result = yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const request = yield tx.withdrawalRequest.findUnique({
                        where: { id },
                        include: { user: true }
                    });
                    if (!request)
                        throw new Error('Demande non trouvée');
                    if (request.status !== 'PENDING')
                        throw new Error('Demande déjà traitée');
                    // 1. Update Withdrawal Request
                    const updatedRequest = yield tx.withdrawalRequest.update({
                        where: { id },
                        data: {
                            status: 'APPROVED',
                            approvedAt: new Date(),
                            processedAt: new Date(),
                            approvedById: adminId,
                            transactionRef,
                            adminNotes: notes
                        }
                    });
                    // 2. Create Transaction Record
                    const transaction = yield tx.transaction.create({
                        data: {
                            type: 'WITHDRAWAL',
                            amount: request.amount,
                            userId: request.userId,
                            status: 'CONFIRMED', // Confirmed because it's processed externally
                            provider: request.provider,
                            externalRef: transactionRef,
                            notes: `Retrait approuvé par admin. ${notes || ''}`
                        }
                    });
                    // 3. Deduct from locked balance (moved from balance to locked when requested)
                    // Assuming creation of withdrawal request moved funds to lockedBalance or just kept in balance?
                    // Usually withdrawal request: Balance -> LockedBalance.
                    // Upon approval: LockedBalance -> Deduct.
                    // Let's verify Wallet behaviour later. Assuming logic: Request subtracts from Balance adds to Locked.
                    yield tx.wallet.update({
                        where: { userId: request.userId },
                        data: {
                            lockedBalance: { decrement: request.amount },
                            totalWithdrawn: { increment: request.amount }
                        }
                    });
                    return updatedRequest;
                }));
                // Notify user via WebSocket
                try {
                    const wsService = typedi_1.default.get(WebSocketService_1.WebSocketService);
                    if (wsService && wsService.isInitialized()) {
                        wsService.broadcastNotification({
                            type: 'TRANSACTION_CONFIRMED',
                            title: 'Retrait approuvé',
                            message: `Votre retrait de ${result.amount} F a été approuvé. Réf: ${transactionRef}`,
                            timestamp: new Date().toISOString()
                        }, result.userId);
                    }
                }
                catch (wsError) {
                    console.error('Failed to send WS notification for withdrawal approval:', wsError);
                }
                res.status(200).json({
                    success: true,
                    data: result,
                    message: 'Retrait approuvé avec succès'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static rejectWithdrawal(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = typedi_1.default.get(client_1.PrismaClient);
                const { id } = req.params;
                const adminId = req.user.id; // Should be available if authenticated
                const { reason } = req.body;
                const result = yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const request = yield tx.withdrawalRequest.findUnique({
                        where: { id }
                    });
                    if (!request)
                        throw new Error('Demande non trouvée');
                    if (request.status !== 'PENDING')
                        throw new Error('Demande déjà traitée');
                    // 1. Update Request
                    const updatedRequest = yield tx.withdrawalRequest.update({
                        where: { id },
                        data: {
                            status: 'REJECTED',
                            rejectedAt: new Date(),
                            processedAt: new Date(), // Processed (rejected)
                            rejectionReason: reason,
                            approvedById: adminId // Rejected by
                        }
                    });
                    // 2. Refund Wallet (Locked -> Balance)
                    yield tx.wallet.update({
                        where: { userId: request.userId },
                        data: {
                            lockedBalance: { decrement: request.amount },
                            balance: { increment: request.amount }
                        }
                    });
                    return updatedRequest;
                }));
                // Notify user via WebSocket
                try {
                    const wsService = typedi_1.default.get(WebSocketService_1.WebSocketService);
                    if (wsService && wsService.isInitialized()) {
                        wsService.broadcastNotification({
                            type: 'TRANSACTION_REJECTED',
                            title: 'Retrait rejeté',
                            message: `Votre retrait de ${result.amount} F a été rejeté. Raison: ${reason || 'Non spécifiée'}`,
                            timestamp: new Date().toISOString()
                        }, result.userId);
                    }
                }
                catch (wsError) {
                    console.error('Failed to send WS notification for withdrawal rejection:', wsError);
                }
                res.status(200).json({
                    success: true,
                    data: result,
                    message: 'Retrait rejeté et fonds remboursés'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static getAuditLogs(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prisma = typedi_1.default.get(client_1.PrismaClient);
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 20;
                const skip = (page - 1) * limit;
                const [logs, total] = yield Promise.all([
                    prisma.auditLog.findMany({
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take: limit
                    }),
                    prisma.auditLog.count()
                ]);
                res.status(200).json({
                    success: true,
                    data: logs,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.AdminController = AdminController;

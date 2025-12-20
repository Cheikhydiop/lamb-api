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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogRepository = void 0;
class AuditLogRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Créer un log d'audit
     */
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.auditLog.create({
                    data: {
                        action: data.action,
                        table: data.table,
                        recordId: data.recordId,
                        userId: data.userId,
                        oldData: data.oldData,
                        newData: data.newData,
                        ipAddress: data.ipAddress,
                        userAgent: data.userAgent,
                        createdAt: new Date()
                    }
                });
            }
            catch (error) {
                console.error('❌ Erreur lors de la création du log d\'audit:', error);
                throw error;
            }
        });
    }
    /**
     * Trouver un log d'audit par ID
     */
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.auditLog.findUnique({
                    where: { id },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                });
            }
            catch (error) {
                console.error('❌ Erreur lors de la recherche du log d\'audit par ID:', error);
                throw error;
            }
        });
    }
    /**
     * Trouver les logs d'audit avec filtres
     */
    find() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            try {
                const where = {};
                if (filter.userId) {
                    where.userId = filter.userId;
                }
                if (filter.action) {
                    where.action = filter.action;
                }
                if (filter.table) {
                    where.table = filter.table;
                }
                if (filter.startDate || filter.endDate) {
                    where.createdAt = {};
                    if (filter.startDate) {
                        where.createdAt.gte = filter.startDate;
                    }
                    if (filter.endDate) {
                        where.createdAt.lte = filter.endDate;
                    }
                }
                const take = filter.limit || 50;
                const skip = filter.offset || 0;
                const [logs, total] = yield Promise.all([
                    this.prisma.auditLog.findMany({
                        where,
                        orderBy: { createdAt: 'desc' },
                        take,
                        skip,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true
                                }
                            }
                        }
                    }),
                    this.prisma.auditLog.count({ where })
                ]);
                return {
                    logs,
                    total,
                    limit: take,
                    offset: skip,
                    hasMore: skip + take < total
                };
            }
            catch (error) {
                console.error('❌ Erreur lors de la recherche des logs d\'audit:', error);
                throw error;
            }
        });
    }
    /**
     * Obtenir les actions d'audit d'un utilisateur
     */
    findByUserId(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 50) {
            try {
                return yield this.prisma.auditLog.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    include: {
                        user: {
                            select: {
                                email: true,
                                name: true
                            }
                        }
                    }
                });
            }
            catch (error) {
                console.error('❌ Erreur lors de la recherche des logs d\'audit par utilisateur:', error);
                throw error;
            }
        });
    }
    /**
     * Obtenir les logs d'audit pour une table spécifique
     */
    findByTable(table_1) {
        return __awaiter(this, arguments, void 0, function* (table, limit = 50) {
            try {
                return yield this.prisma.auditLog.findMany({
                    where: { table },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true
                            }
                        }
                    }
                });
            }
            catch (error) {
                console.error('❌ Erreur lors de la recherche des logs d\'audit par table:', error);
                throw error;
            }
        });
    }
    /**
     * Obtenir les actions récentes
     */
    getRecentActions() {
        return __awaiter(this, arguments, void 0, function* (days = 7, limit = 100) {
            try {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                return yield this.prisma.auditLog.findMany({
                    where: {
                        createdAt: {
                            gte: startDate
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                });
            }
            catch (error) {
                console.error('❌ Erreur lors de la récupération des actions récentes:', error);
                throw error;
            }
        });
    }
    /**
     * Supprimer les logs d'audit anciens
     */
    deleteOldLogs() {
        return __awaiter(this, arguments, void 0, function* (days = 365) {
            try {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                const result = yield this.prisma.auditLog.deleteMany({
                    where: {
                        createdAt: {
                            lt: cutoffDate
                        }
                    }
                });
                console.log(`✅ ${result.count} anciens logs d'audit supprimés`);
                return result;
            }
            catch (error) {
                console.error('❌ Erreur lors de la suppression des anciens logs:', error);
                throw error;
            }
        });
    }
    /**
     * Obtenir les statistiques d'audit
     */
    getStats(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const where = {};
                if (startDate || endDate) {
                    where.createdAt = {};
                    if (startDate) {
                        where.createdAt.gte = startDate;
                    }
                    if (endDate) {
                        where.createdAt.lte = endDate;
                    }
                }
                const [total, byAction, byTable, byUser, recentCount] = yield Promise.all([
                    // Total
                    this.prisma.auditLog.count({ where }),
                    // Par action
                    this.prisma.auditLog.groupBy({
                        by: ['action'],
                        where,
                        _count: {
                            action: true
                        },
                        orderBy: {
                            _count: {
                                action: 'desc'
                            }
                        }
                    }),
                    // Par table
                    this.prisma.auditLog.groupBy({
                        by: ['table'],
                        where,
                        _count: {
                            table: true
                        },
                        orderBy: {
                            _count: {
                                table: 'desc'
                            }
                        }
                    }),
                    // Par utilisateur
                    this.prisma.auditLog.groupBy({
                        by: ['userId'],
                        where,
                        _count: {
                            userId: true
                        },
                        orderBy: {
                            _count: {
                                userId: 'desc'
                            }
                        }
                    }),
                    // Récent (dernières 24h)
                    this.prisma.auditLog.count({
                        where: Object.assign(Object.assign({}, where), { createdAt: {
                                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                            } })
                    })
                ]);
                return {
                    total,
                    byAction: byAction.map(item => ({
                        action: item.action,
                        count: item._count.action
                    })),
                    byTable: byTable.map(item => ({
                        table: item.table,
                        count: item._count.table
                    })),
                    byUser: byUser.map(item => ({
                        userId: item.userId,
                        count: item._count.userId
                    })),
                    recentCount,
                    dailyAverage: startDate && endDate
                        ? total / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
                        : 0
                };
            }
            catch (error) {
                console.error('❌ Erreur lors de la récupération des statistiques d\'audit:', error);
                throw error;
            }
        });
    }
    /**
     * Enregistrer une action utilisateur
     */
    logUserAction(userId, action, table, recordId, oldData, newData, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.create({
                    action,
                    table,
                    recordId,
                    userId,
                    oldData,
                    newData,
                    ipAddress,
                    userAgent
                });
            }
            catch (error) {
                console.error('❌ Erreur lors de l\'enregistrement de l\'action utilisateur:', error);
                throw error;
            }
        });
    }
    /**
     * Enregistrer une action système
     */
    logSystemAction(action, table, recordId, details, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.create({
                    action,
                    table,
                    recordId,
                    oldData: null,
                    newData: details,
                    ipAddress,
                    userAgent
                });
            }
            catch (error) {
                console.error('❌ Erreur lors de l\'enregistrement de l\'action système:', error);
                throw error;
            }
        });
    }
    /**
     * Suivre les changements d'un enregistrement
     */
    trackChanges(table_1, recordId_1, oldData_1, newData_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (table, recordId, oldData, newData, userId, action = 'UPDATE') {
            try {
                return yield this.create({
                    action,
                    table,
                    recordId,
                    userId,
                    oldData,
                    newData
                });
            }
            catch (error) {
                console.error('❌ Erreur lors du suivi des changements:', error);
                throw error;
            }
        });
    }
}
exports.AuditLogRepository = AuditLogRepository;

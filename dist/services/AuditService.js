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
exports.AuditService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
// refactored for manual DI
class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    createAuditLog(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const auditLog = yield this.prisma.auditLog.create({
                    data: {
                        action: params.action,
                        table: params.resourceType,
                        recordId: params.resourceId,
                        newData: params.details,
                        ipAddress: params.ipAddress,
                        userAgent: params.userAgent,
                        userId: params.userId,
                    },
                });
                // Log additionnel pour les événements critiques
                if (params.severity === 'HIGH' || params.severity === 'CRITICAL') {
                    logger_1.default.warn(`CRITICAL AUDIT: ${params.action}`, {
                        userId: params.userId,
                        resourceId: params.resourceId,
                        ipAddress: params.ipAddress,
                        details: params.details,
                    });
                }
                return auditLog;
            }
            catch (error) {
                logger_1.default.error(`Failed to create audit log: `);
                // Fallback: log to console/file
                this.logToFile(params);
            }
        });
    }
    logToFile(params) {
        const logEntry = Object.assign({ timestamp: new Date().toISOString() }, params);
        // Log dans un fichier dédié ou dans les logs système
        logger_1.default.error('AUDIT LOG FALLBACK:', logEntry);
    }
    getAuditLogs(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.auditLog.findMany({
                where: Object.assign(Object.assign(Object.assign(Object.assign({}, (filters.userId && { userId: filters.userId })), (filters.action && { action: { contains: filters.action, mode: 'insensitive' } })), (filters.resourceType && { table: filters.resourceType })), (filters.startDate && filters.endDate && {
                    createdAt: {
                        gte: filters.startDate,
                        lte: filters.endDate,
                    },
                })),
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
        });
    }
    cleanupOldLogs() {
        return __awaiter(this, arguments, void 0, function* (daysToKeep = 90) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const result = yield this.prisma.auditLog.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate },
                },
            });
            logger_1.default.info(`Cleaned up ${result.count} old audit logs`);
            return result.count;
        });
    }
}
exports.AuditService = AuditService;

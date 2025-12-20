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
exports.AuditService = void 0;
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    logAction(action_1, table_1, recordId_1) {
        return __awaiter(this, arguments, void 0, function* (action, table, recordId, oldData = null, newData = null, userId = null, ipAddress = null, userAgent = null) {
            try {
                const auditLog = yield this.prisma.auditLog.create({
                    data: {
                        action,
                        table,
                        recordId,
                        oldData,
                        newData,
                        userId,
                        ipAddress,
                        userAgent,
                    },
                });
                logger_1.default.info(`Audit log created: ${action} on ${table}#${recordId}`);
                return auditLog;
            }
            catch (error) {
                logger_1.default.error('Error creating audit log', error);
                throw error;
            }
        });
    }
    getAuditLogs(table_1, action_1) {
        return __awaiter(this, arguments, void 0, function* (table, action, limit = 50, offset = 0) {
            try {
                const logs = yield this.prisma.auditLog.findMany({
                    where: {
                        table: table ? { equals: table } : undefined,
                        action: action ? { contains: action } : undefined,
                    },
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { id: true, name: true, email: true } } },
                });
                return logs;
            }
            catch (error) {
                logger_1.default.error('Error fetching audit logs', error);
                throw error;
            }
        });
    }
    getAuditLogsByUser(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 50, offset = 0) {
            try {
                const logs = yield this.prisma.auditLog.findMany({
                    where: { userId },
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: 'desc' },
                });
                return logs;
            }
            catch (error) {
                logger_1.default.error('Error fetching audit logs for user', error);
                throw error;
            }
        });
    }
    getAuditLogsForRecord(table, recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const logs = yield this.prisma.auditLog.findMany({
                    where: { table, recordId },
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { id: true, name: true, email: true } } },
                });
                return logs;
            }
            catch (error) {
                logger_1.default.error('Error fetching audit logs for record', error);
                throw error;
            }
        });
    }
    logBetCreated(betId, userId, data, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.logAction('BET_CREATED', 'bets', betId, null, data, userId, ipAddress, userAgent);
        });
    }
    logBetAccepted(betId, acceptorId, data, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.logAction('BET_ACCEPTED', 'bets', betId, null, data, acceptorId, ipAddress, userAgent);
        });
    }
    logBetCancelled(betId, userId, data, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.logAction('BET_CANCELLED', 'bets', betId, null, data, userId, ipAddress, userAgent);
        });
    }
    logTransactionCreated(transactionId, userId, data, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.logAction('TRANSACTION_CREATED', 'transactions', transactionId, null, data, userId, ipAddress, userAgent);
        });
    }
    logTransactionConfirmed(transactionId, adminId, data, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.logAction('TRANSACTION_CONFIRMED', 'transactions', transactionId, null, data, adminId, ipAddress, userAgent);
        });
    }
    logFightCreated(fightId, adminId, data, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.logAction('FIGHT_CREATED', 'fights', fightId, null, data, adminId, ipAddress, userAgent);
        });
    }
    logFightResultValidated(resultId, adminId, data, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.logAction('FIGHT_RESULT_VALIDATED', 'fight_results', resultId, null, data, adminId, ipAddress, userAgent);
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], AuditService);

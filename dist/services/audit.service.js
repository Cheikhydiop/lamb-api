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
exports.AuditService = void 0;
const typedi_1 = require("typedi");
const logger_1 = __importDefault(require("../utils/logger"));
let AuditService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuditService = _classThis = class {
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
    __setFunctionName(_classThis, "AuditService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditService = _classThis;
})();
exports.AuditService = AuditService;

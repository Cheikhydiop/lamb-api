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
exports.AuditMiddleware = exports.AuditSeverity = exports.AuditResourceType = exports.AuditAction = void 0;
const typedi_1 = require("typedi");
const Logger_1 = __importDefault(require("../utils/Logger"));
// Enums adaptés à votre modèle
var AuditAction;
(function (AuditAction) {
    // Authentification
    AuditAction["USER_LOGIN"] = "USER_LOGIN";
    AuditAction["USER_LOGOUT"] = "USER_LOGOUT";
    AuditAction["USER_REGISTER"] = "USER_REGISTER";
    // Wallet & Transactions
    AuditAction["TOKEN_PURCHASE"] = "TOKEN_PURCHASE";
    AuditAction["WITHDRAWAL_REQUEST"] = "WITHDRAWAL_REQUEST";
    AuditAction["WITHDRAWAL_COMPLETE"] = "WITHDRAWAL_COMPLETE";
    AuditAction["BALANCE_CHECK"] = "BALANCE_CHECK";
    // Bets
    AuditAction["BET_CREATE"] = "BET_CREATE";
    AuditAction["BET_ACCEPT"] = "BET_ACCEPT";
    AuditAction["BET_CANCEL"] = "BET_CANCEL";
    AuditAction["BET_WIN"] = "BET_WIN";
    // Fights
    AuditAction["FIGHT_CREATE"] = "FIGHT_CREATE";
    AuditAction["FIGHT_UPDATE"] = "FIGHT_UPDATE";
    AuditAction["FIGHT_RESULT_SET"] = "FIGHT_RESULT_SET";
    // Fighters
    AuditAction["FIGHTER_CREATE"] = "FIGHTER_CREATE";
    AuditAction["FIGHTER_UPDATE"] = "FIGHTER_UPDATE";
    // Admin
    AuditAction["USER_SUSPEND"] = "USER_SUSPEND";
    AuditAction["USER_ACTIVATE"] = "USER_ACTIVATE";
    AuditAction["USER_UPDATE"] = "USER_UPDATE";
    AuditAction["SYSTEM_CONFIG_UPDATE"] = "SYSTEM_CONFIG_UPDATE";
    // Sécurité
    AuditAction["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    AuditAction["LOGIN_ATTEMPT_FAILED"] = "LOGIN_ATTEMPT_FAILED";
    AuditAction["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    AuditAction["WITHDRAWAL_APPROVE"] = "WITHDRAWAL_APPROVE";
    AuditAction["WITHDRAWAL_REJECT"] = "WITHDRAWAL_REJECT";
    // Sessions
    AuditAction["SESSION_CREATE"] = "SESSION_CREATE";
    AuditAction["SESSION_REVOKE"] = "SESSION_REVOKE";
    // OTP
    AuditAction["OTP_GENERATE"] = "OTP_GENERATE";
    AuditAction["OTP_VERIFY"] = "OTP_VERIFY";
    // Notifications
    AuditAction["NOTIFICATION_SEND"] = "NOTIFICATION_SEND";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditResourceType;
(function (AuditResourceType) {
    AuditResourceType["USER"] = "USER";
    AuditResourceType["WALLET"] = "WALLET";
    AuditResourceType["BET"] = "BET";
    AuditResourceType["FIGHT"] = "FIGHT";
    AuditResourceType["FIGHTER"] = "FIGHTER";
    AuditResourceType["TRANSACTION"] = "TRANSACTION";
    AuditResourceType["WITHDRAWAL"] = "WITHDRAWAL";
    AuditResourceType["SESSION"] = "SESSION";
    AuditResourceType["NOTIFICATION"] = "NOTIFICATION";
    AuditResourceType["OTP"] = "OTP";
    AuditResourceType["SYSTEM"] = "SYSTEM";
})(AuditResourceType || (exports.AuditResourceType = AuditResourceType = {}));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "LOW";
    AuditSeverity["MEDIUM"] = "MEDIUM";
    AuditSeverity["HIGH"] = "HIGH";
    AuditSeverity["CRITICAL"] = "CRITICAL";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
let AuditMiddleware = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuditMiddleware = _classThis = class {
        constructor(auditService) {
            this.auditService = auditService;
        }
        /**
         * Middleware d'audit automatique
         */
        audit(config) {
            return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                const originalSend = res.send;
                const originalJson = res.json;
                // Intercepter la réponse pour récupérer les données
                res.send = function (data) {
                    this.locals.auditData = data;
                    return originalSend.call(this, data);
                };
                res.json = function (data) {
                    this.locals.auditData = data;
                    return originalJson.call(this, data);
                };
                try {
                    yield next();
                    // Créer le log d'audit après l'exécution
                    yield this.createAuditLog(req, res, config);
                }
                catch (error) {
                    // Créer le log d'audit en cas d'erreur
                    yield this.createAuditLog(req, res, config, error);
                    throw error;
                }
            });
        }
        /**
         * Créer un log d'audit
         */
        createAuditLog(req, res, config, error) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    // Vérifier si on doit auditer
                    if (config.shouldAudit && !config.shouldAudit(req, res)) {
                        return;
                    }
                    // Vérifier que l'utilisateur est authentifié
                    // Adapté à votre structure d'authentification
                    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
                    if (!userId) {
                        // Log pour actions non authentifiées (login, register)
                        if (![AuditAction.USER_LOGIN, AuditAction.USER_REGISTER].includes(config.action)) {
                            return;
                        }
                    }
                    // Déterminer si l'action a réussi
                    const isSuccessful = !error && res.statusCode >= 200 && res.statusCode < 300;
                    // Récupérer les détails
                    const resourceId = config.getResourceId ? config.getResourceId(req, res) : undefined;
                    const resourceName = config.getResourceName ? config.getResourceName(req, res) : undefined;
                    const details = config.getDetails ? config.getDetails(req, res) : undefined;
                    // Récupérer l'adresse IP
                    const ipAddress = req.ip ||
                        ((_b = req.headers['x-forwarded-for']) === null || _b === void 0 ? void 0 : _b.toString()) ||
                        req.socket.remoteAddress;
                    // Récupérer l'user agent
                    const userAgent = req.get('User-Agent');
                    // Créer le log d'audit
                    yield this.auditService.createAuditLog({
                        action: config.action,
                        userId: userId,
                        resourceType: config.resourceType,
                        resourceId: resourceId,
                        resourceName: resourceName,
                        severity: config.severity || (error ? AuditSeverity.HIGH : AuditSeverity.LOW),
                        details: Object.assign(Object.assign({}, details), { method: req.method, url: req.originalUrl, statusCode: res.statusCode, isSuccessful, error: error === null || error === void 0 ? void 0 : error.message, ipAddress,
                            userAgent, timestamp: new Date().toISOString() }),
                        ipAddress,
                        userAgent,
                    });
                    Logger_1.default.info(`Audit log created: ${config.action} - ${isSuccessful ? 'SUCCESS' : 'FAILED'}`);
                }
                catch (auditError) {
                    const errorMessage = auditError instanceof Error ? auditError.message : String(auditError);
                    Logger_1.default.error(`Failed to create audit log: ${errorMessage}`);
                }
            });
        }
        // ====================== MIDDLEWARES SPÉCIFIQUES ======================
        /**
         * Middleware d'audit pour les connexions utilisateur
         */
        auditUserLogin() {
            return this.audit({
                action: AuditAction.USER_LOGIN,
                resourceType: AuditResourceType.USER,
                severity: AuditSeverity.LOW,
                getResourceId: (req) => { var _a; return (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; },
                getResourceName: (req) => { var _a, _b; return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.phone) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.email); },
                getDetails: (req) => ({
                    phone: req.body.phone,
                    loginMethod: req.body.loginMethod || 'phone',
                    deviceInfo: req.get('User-Agent'),
                }),
                shouldAudit: (req, res) => res.statusCode !== 401, // Ne pas logguer les échecs d'auth
            });
        }
        /**
         * Middleware d'audit pour les inscriptions
         */
        auditUserRegister() {
            return this.audit({
                action: AuditAction.USER_REGISTER,
                resourceType: AuditResourceType.USER,
                severity: AuditSeverity.MEDIUM,
                getResourceId: (req, res) => { var _a; return (_a = res.locals.auditData) === null || _a === void 0 ? void 0 : _a.id; },
                getResourceName: (req) => req.body.phone,
                getDetails: (req) => ({
                    phone: req.body.phone,
                    email: req.body.email,
                    name: req.body.name,
                }),
            });
        }
        /**
         * Middleware d'audit pour les achats de tokens
         */
        auditTokenPurchase() {
            return this.audit({
                action: AuditAction.TOKEN_PURCHASE,
                resourceType: AuditResourceType.TRANSACTION,
                severity: AuditSeverity.HIGH,
                getResourceId: (req, res) => { var _a; return (_a = res.locals.auditData) === null || _a === void 0 ? void 0 : _a.id; },
                getDetails: (req) => ({
                    amount: req.body.amount,
                    provider: req.body.provider,
                    phone: req.body.phone,
                    transactionRef: req.body.externalRef,
                }),
            });
        }
        /**
         * Middleware d'audit pour les retraits
         */
        auditWithdrawal() {
            return this.audit({
                action: AuditAction.WITHDRAWAL_REQUEST,
                resourceType: AuditResourceType.TRANSACTION,
                severity: AuditSeverity.HIGH,
                getResourceId: (req, res) => { var _a; return (_a = res.locals.auditData) === null || _a === void 0 ? void 0 : _a.id; },
                getDetails: (req) => {
                    var _a;
                    return ({
                        amount: req.body.amount,
                        provider: req.body.provider,
                        phone: req.body.phone,
                        walletBalanceBefore: (_a = req.wallet) === null || _a === void 0 ? void 0 : _a.balance,
                    });
                },
            });
        }
        /**
         * Middleware d'audit pour la création de paris
         */
        auditBetCreate() {
            return this.audit({
                action: AuditAction.BET_CREATE,
                resourceType: AuditResourceType.BET,
                severity: AuditSeverity.MEDIUM,
                getResourceId: (req, res) => { var _a; return (_a = res.locals.auditData) === null || _a === void 0 ? void 0 : _a.id; },
                getDetails: (req) => ({
                    amount: req.body.amount,
                    fightId: req.body.fightId,
                    chosenFighter: req.body.chosenFighter,
                    taggedUserId: req.body.taggedUserId,
                }),
            });
        }
        /**
         * Middleware d'audit pour l'acceptation de paris
         */
        auditBetAccept() {
            return this.audit({
                action: AuditAction.BET_ACCEPT,
                resourceType: AuditResourceType.BET,
                severity: AuditSeverity.MEDIUM,
                getResourceId: (req) => req.params.id,
                getDetails: (req) => {
                    var _a;
                    return ({
                        betId: req.params.id,
                        acceptorId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                    });
                },
            });
        }
        /**
         * Middleware d'audit pour l'annulation de paris
         */
        auditBetCancel() {
            return this.audit({
                action: AuditAction.BET_CANCEL,
                resourceType: AuditResourceType.BET,
                severity: AuditSeverity.MEDIUM,
                getResourceId: (req) => req.params.id,
                getDetails: (req) => ({
                    betId: req.params.id,
                    cancellationReason: req.body.reason,
                }),
            });
        }
        /**
         * Middleware d'audit pour la création de combats (admin)
         */
        auditFightCreate() {
            return this.audit({
                action: AuditAction.FIGHT_CREATE,
                resourceType: AuditResourceType.FIGHT,
                severity: AuditSeverity.MEDIUM,
                getResourceId: (req, res) => { var _a; return (_a = res.locals.auditData) === null || _a === void 0 ? void 0 : _a.id; },
                getDetails: (req) => ({
                    title: req.body.title,
                    fighterAId: req.body.fighterAId,
                    fighterBId: req.body.fighterBId,
                    scheduledAt: req.body.scheduledAt,
                    location: req.body.location,
                }),
            });
        }
        /**
         * Middleware d'audit pour la définition des résultats de combat
         */
        auditFightResultSet() {
            return this.audit({
                action: AuditAction.FIGHT_RESULT_SET,
                resourceType: AuditResourceType.FIGHT,
                severity: AuditSeverity.HIGH,
                getResourceId: (req) => req.params.id,
                getDetails: (req) => ({
                    fightId: req.params.id,
                    winner: req.body.winner,
                    victoryMethod: req.body.victoryMethod,
                    notes: req.body.notes,
                    impactedBetsCount: (res) => { var _a; return (_a = res.locals.auditData) === null || _a === void 0 ? void 0 : _a.impactedBets; },
                }),
            });
        }
        /**
         * Middleware d'audit pour la suspension d'utilisateurs (admin)
         */
        auditUserSuspend() {
            return this.audit({
                action: AuditAction.USER_SUSPEND,
                resourceType: AuditResourceType.USER,
                severity: AuditSeverity.HIGH,
                getResourceId: (req) => req.params.id,
                getResourceName: (req) => req.body.reason || 'Suspension administrative',
                getDetails: (req) => {
                    var _a;
                    return ({
                        targetUserId: req.params.id,
                        reason: req.body.reason,
                        duration: req.body.duration,
                        suspendedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                    });
                },
            });
        }
        /**
         * Middleware d'audit pour les changements de mot de passe
         */
        auditPasswordChange() {
            return this.audit({
                action: AuditAction.PASSWORD_CHANGE,
                resourceType: AuditResourceType.USER,
                severity: AuditSeverity.MEDIUM,
                getDetails: (req) => {
                    var _a;
                    return ({
                        passwordChangedAt: new Date().toISOString(),
                        changedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                    });
                },
            });
        }
        /**
         * Middleware d'audit pour les tentatives de login échouées
         */
        auditFailedLogin() {
            return this.audit({
                action: AuditAction.LOGIN_ATTEMPT_FAILED,
                resourceType: AuditResourceType.USER,
                severity: AuditSeverity.MEDIUM,
                getResourceName: (req) => req.body.phone,
                getDetails: (req) => ({
                    phone: req.body.phone,
                    attemptCount: req.loginAttempts || 1,
                    ipAddress: req.ip,
                }),
                shouldAudit: (req, res) => res.statusCode === 401, // Logguer seulement les échecs
            });
        }
        /**
         * Middleware d'audit pour les sessions
         */
        auditSessionCreate() {
            return this.audit({
                action: AuditAction.SESSION_CREATE,
                resourceType: AuditResourceType.SESSION,
                severity: AuditSeverity.LOW,
                getDetails: (req) => ({
                    deviceType: req.body.deviceType || 'UNKNOWN',
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                }),
            });
        }
        /**
         * Middleware d'audit pour les transactions sensibles
         */
        auditHighValueTransaction(minAmount = 100000) {
            return this.audit({
                action: AuditAction.TOKEN_PURCHASE,
                resourceType: AuditResourceType.TRANSACTION,
                severity: AuditSeverity.CRITICAL,
                getDetails: (req) => ({
                    amount: req.body.amount,
                    provider: req.body.provider,
                    isHighValue: true,
                    threshold: minAmount,
                }),
                shouldAudit: (req, res) => {
                    const amount = parseInt(req.body.amount) || 0;
                    return amount >= minAmount && res.statusCode === 200;
                },
            });
        }
        /**
         * Middleware d'audit générique pour les actions admin
         */
        auditAdminAction(action, resourceType, severity = AuditSeverity.MEDIUM) {
            return this.audit({
                action,
                resourceType,
                severity,
                getResourceId: (req) => req.params.id,
                getDetails: (req) => {
                    var _a;
                    return ({
                        targetId: req.params.id,
                        adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                        changes: req.body,
                        timestamp: new Date().toISOString(),
                    });
                },
            });
        }
        /**
         * Middleware d'audit pour les activités suspectes
         */
        auditSuspiciousActivity(details) {
            return this.audit({
                action: AuditAction.SUSPICIOUS_ACTIVITY,
                resourceType: AuditResourceType.SYSTEM,
                severity: AuditSeverity.CRITICAL,
                getDetails: () => details,
            });
        }
    };
    __setFunctionName(_classThis, "AuditMiddleware");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditMiddleware = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditMiddleware = _classThis;
})();
exports.AuditMiddleware = AuditMiddleware;

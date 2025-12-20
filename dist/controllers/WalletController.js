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
exports.WalletController = void 0;
const typedi_1 = require("typedi");
const logger_1 = __importDefault(require("../utils/logger"));
let WalletController = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var WalletController = _classThis = class {
        constructor(transactionService, prisma) {
            this.transactionService = transactionService;
            this.prisma = prisma;
        }
        /**
         * Get wallet balance
         * GET /api/v1/wallet/balance
         */
        getBalance(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                    if (!userId) {
                        return res.status(401).json({
                            success: false,
                            error: 'Non authentifié'
                        });
                    }
                    const wallet = yield this.transactionService.getWalletBalance(userId);
                    return res.json({
                        success: true,
                        data: {
                            balance: Number(wallet.balance),
                            lockedBalance: Number(wallet.lockedBalance),
                            totalWon: Number(wallet.totalWon),
                            totalLost: Number(wallet.totalLost)
                        }
                    });
                }
                catch (error) {
                    logger_1.default.error('Error getting wallet balance:', error);
                    return res.status(500).json({
                        success: false,
                        error: error.message || 'Erreur lors de la récupération du solde'
                    });
                }
            });
        }
        /**
         * Initiate deposit
         * POST /api/v1/wallet/deposit
         */
        deposit(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                    if (!userId) {
                        return res.status(401).json({
                            success: false,
                            error: 'Non authentifié'
                        });
                    }
                    const { amount, provider, phoneNumber } = req.body;
                    // Validation
                    if (!amount || !provider || !phoneNumber) {
                        return res.status(400).json({
                            success: false,
                            error: 'Montant, provider et numéro de téléphone requis'
                        });
                    }
                    const amountBigInt = BigInt(amount);
                    // Validate amount
                    const MIN_DEPOSIT = BigInt(500);
                    const MAX_DEPOSIT = BigInt(1000000);
                    if (amountBigInt < MIN_DEPOSIT) {
                        return res.status(400).json({
                            success: false,
                            error: `Montant minimum: ${MIN_DEPOSIT} FCFA`
                        });
                    }
                    if (amountBigInt > MAX_DEPOSIT) {
                        return res.status(400).json({
                            success: false,
                            error: `Montant maximum: ${MAX_DEPOSIT} FCFA`
                        });
                    }
                    // Initiate deposit
                    const result = yield this.transactionService.deposit(userId, {
                        amount: amountBigInt,
                        provider,
                        phoneNumber
                    });
                    return res.json({
                        success: true,
                        data: {
                            transactionId: result.id,
                            externalRef: result.externalRef,
                            message: result.message || 'Dépôt initié avec succès. Veuillez confirmer sur votre téléphone.',
                            requiresUserAction: result.requiresUserAction,
                            status: result.status
                        }
                    });
                }
                catch (error) {
                    logger_1.default.error('Error initiating deposit:', error);
                    return res.status(500).json({
                        success: false,
                        error: error.message || 'Erreur lors du dépôt'
                    });
                }
            });
        }
        /**
         * Initiate withdrawal
         * POST /api/v1/wallet/withdraw
         */
        withdraw(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                    if (!userId) {
                        return res.status(401).json({
                            success: false,
                            error: 'Non authentifié'
                        });
                    }
                    const { amount, provider, phoneNumber } = req.body;
                    // Validation
                    if (!amount || !provider || !phoneNumber) {
                        return res.status(400).json({
                            success: false,
                            error: 'Montant, provider et numéro de téléphone requis'
                        });
                    }
                    const amountBigInt = BigInt(amount);
                    // Validate amount
                    const MIN_WITHDRAWAL = BigInt(1000);
                    const MAX_WITHDRAWAL = BigInt(500000);
                    if (amountBigInt < MIN_WITHDRAWAL) {
                        return res.status(400).json({
                            success: false,
                            error: `Montant minimum: ${MIN_WITHDRAWAL} FCFA`
                        });
                    }
                    if (amountBigInt > MAX_WITHDRAWAL) {
                        return res.status(400).json({
                            success: false,
                            error: `Montant maximum: ${MAX_WITHDRAWAL} FCFA`
                        });
                    }
                    // Initiate withdrawal
                    const result = yield this.transactionService.withdrawal(userId, {
                        amount: amountBigInt,
                        provider,
                        phoneNumber
                    });
                    return res.json({
                        success: true,
                        data: {
                            transactionId: result.id,
                            externalRef: result.externalRef,
                            message: result.message || 'Retrait en cours de traitement.',
                            status: result.status
                        }
                    });
                }
                catch (error) {
                    logger_1.default.error('Error initiating withdrawal:', error);
                    return res.status(500).json({
                        success: false,
                        error: error.message || 'Erreur lors du retrait'
                    });
                }
            });
        }
        /**
         * Get transaction history
         * GET /api/v1/wallet/transactions
         */
        getTransactions(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                    if (!userId) {
                        return res.status(401).json({
                            success: false,
                            error: 'Non authentifié'
                        });
                    }
                    const limit = parseInt(req.query.limit) || 20;
                    const offset = parseInt(req.query.offset) || 0;
                    const transactions = yield this.transactionService.listTransactions(userId, {
                        limit,
                        offset
                    });
                    // Convert BigInt to number for JSON serialization
                    const serializedTransactions = transactions.map(tx => (Object.assign(Object.assign({}, tx), { amount: Number(tx.amount) })));
                    return res.json({
                        success: true,
                        data: serializedTransactions
                    });
                }
                catch (error) {
                    logger_1.default.error('Error getting transactions:', error);
                    return res.status(500).json({
                        success: false,
                        error: error.message || 'Erreur lors de la récupération des transactions'
                    });
                }
            });
        }
    };
    __setFunctionName(_classThis, "WalletController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WalletController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WalletController = _classThis;
})();
exports.WalletController = WalletController;

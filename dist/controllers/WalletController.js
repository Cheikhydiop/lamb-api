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
exports.WalletController = void 0;
const typedi_1 = require("typedi");
const TransactionService_1 = require("../services/TransactionService");
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
let WalletController = class WalletController {
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
exports.WalletController = WalletController;
exports.WalletController = WalletController = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [TransactionService_1.TransactionService,
        client_1.PrismaClient])
], WalletController);

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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const typedi_1 = require("typedi");
const transaction_service_1 = require("../services/transaction.service");
const logger_1 = __importDefault(require("../utils/logger"));
let TransactionController = class TransactionController {
    constructor(transactionService) {
        this.transactionService = transactionService;
    }
    createTransaction(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                logger_1.default.info(`Creating transaction for user: ${userId}`);
                const transaction = yield this.transactionService.createTransaction(userId, req.body);
                res.status(201).json({
                    success: true,
                    message: 'Transaction created successfully',
                    data: transaction,
                });
            }
            catch (error) {
                logger_1.default.error('Create transaction error', error);
                next(error);
            }
        });
    }
    withdrawal(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                logger_1.default.info(`Withdrawal initiated for user: ${userId}`);
                const transaction = yield this.transactionService.withdrawal(userId, req.body);
                res.status(201).json({
                    success: true,
                    message: 'Withdrawal initiated successfully',
                    data: transaction,
                });
            }
            catch (error) {
                logger_1.default.error('Withdrawal error', error);
                next(error);
            }
        });
    }
    confirmTransaction(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transactionId = req.params.transactionId;
                logger_1.default.info(`Admin confirming transaction: ${transactionId}`);
                const transaction = yield this.transactionService.confirmTransaction({
                    transactionId,
                    externalRef: req.body.externalRef,
                    status: req.body.status,
                });
                res.json({
                    success: true,
                    message: 'Transaction confirmed',
                    data: transaction,
                });
            }
            catch (error) {
                logger_1.default.error('Confirm transaction error', error);
                next(error);
            }
        });
    }
    listTransactions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const transactions = yield this.transactionService.listTransactions(userId, req.query);
                res.json({
                    success: true,
                    message: 'Transactions retrieved successfully',
                    data: transactions,
                });
            }
            catch (error) {
                logger_1.default.error('List transactions error', error);
                next(error);
            }
        });
    }
    getTransactionById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transactionId = req.params.transactionId;
                const transaction = yield this.transactionService.getTransactionById(transactionId);
                res.json({
                    success: true,
                    message: 'Transaction retrieved successfully',
                    data: transaction,
                });
            }
            catch (error) {
                logger_1.default.error('Get transaction error', error);
                next(error);
            }
        });
    }
    getWalletBalance(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.userId;
                const wallet = yield this.transactionService.getWalletBalance(userId);
                res.json({
                    success: true,
                    message: 'Wallet balance retrieved',
                    data: wallet,
                });
            }
            catch (error) {
                logger_1.default.error('Get wallet balance error', error);
                next(error);
            }
        });
    }
};
exports.TransactionController = TransactionController;
exports.TransactionController = TransactionController = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeof (_a = typeof transaction_service_1.TransactionService !== "undefined" && transaction_service_1.TransactionService) === "function" ? _a : Object])
], TransactionController);

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
exports.TransactionController = void 0;
const typedi_1 = require("typedi");
const logger_1 = __importDefault(require("../utils/logger"));
let TransactionController = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TransactionController = _classThis = class {
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
    __setFunctionName(_classThis, "TransactionController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TransactionController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TransactionController = _classThis;
})();
exports.TransactionController = TransactionController;

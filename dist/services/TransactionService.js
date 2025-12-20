"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const typedi_1 = require("typedi");
let TransactionService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TransactionService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
        }
        createTransaction(userId, data) {
            return __awaiter(this, void 0, void 0, function* () {
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId },
                    include: { wallet: true },
                });
                if (!user || !user.wallet) {
                    throw new Error('User or wallet not found');
                }
                if (data.type === 'WITHDRAWAL' && user.wallet.balance < data.amount) {
                    throw new Error('Insufficient balance');
                }
                const transaction = yield this.prisma.transaction.create({
                    data: {
                        type: data.type,
                        amount: data.amount,
                        userId,
                        provider: data.provider,
                        notes: data.notes,
                    },
                });
                // Update wallet based on transaction type
                if (data.type === 'DEPOSIT') {
                    yield this.prisma.wallet.update({
                        where: { userId },
                        data: { balance: { increment: data.amount } },
                    });
                }
                else if (data.type === 'WITHDRAWAL') {
                    yield this.prisma.wallet.update({
                        where: { userId },
                        data: { balance: { decrement: data.amount } },
                    });
                }
                return transaction;
            });
        }
        deposit(userId, data) {
            return __awaiter(this, void 0, void 0, function* () {
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId },
                    include: { wallet: true },
                });
                if (!user || !user.wallet) {
                    throw new Error('User or wallet not found');
                }
                // Validate amount limits
                const minDeposit = BigInt(500);
                const maxDeposit = BigInt(1000000);
                if (data.amount < minDeposit) {
                    throw new Error(`Montant minimum de dépôt: ${minDeposit} FCFA`);
                }
                if (data.amount > maxDeposit) {
                    throw new Error(`Montant maximum de dépôt: ${maxDeposit} FCFA`);
                }
                // Create transaction in PENDING state
                const transaction = yield this.prisma.transaction.create({
                    data: {
                        type: 'DEPOSIT',
                        amount: data.amount,
                        userId,
                        provider: data.provider,
                        status: 'PENDING',
                        notes: `Deposit from ${data.phoneNumber}`,
                    },
                });
                try {
                    // Initiate payment with provider
                    const { PaymentService } = yield Promise.resolve().then(() => __importStar(require('./PaymentService')));
                    const paymentService = new PaymentService();
                    const result = yield paymentService.initiateDeposit(data.provider, data.amount, data.phoneNumber, userId);
                    if (!result.success) {
                        yield this.prisma.transaction.update({
                            where: { id: transaction.id },
                            data: {
                                status: 'FAILED',
                                notes: `Failed: ${result.message}`,
                                processedAt: new Date()
                            },
                        });
                        throw new Error(result.message || 'Deposit initiation failed');
                    }
                    // Update transaction with external reference
                    yield this.prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            externalRef: result.transactionId,
                        },
                    });
                    return Object.assign(Object.assign({}, transaction), { externalRef: result.transactionId, message: result.message, requiresUserAction: result.requiresUserAction });
                }
                catch (error) {
                    yield this.prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            status: 'FAILED',
                            notes: `Error: ${error.message}`,
                            processedAt: new Date()
                        },
                    });
                    throw error;
                }
            });
        }
        withdrawal(userId, data) {
            return __awaiter(this, void 0, void 0, function* () {
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId },
                    include: { wallet: true },
                });
                if (!user || !user.wallet) {
                    throw new Error('User or wallet not found');
                }
                if (user.wallet.balance < data.amount) {
                    throw new Error('Insufficient balance');
                }
                // Validate amount limits
                const minWithdrawal = BigInt(500); // TODO: Move to config
                const maxWithdrawal = BigInt(500000);
                if (data.amount < minWithdrawal) {
                    throw new Error(`Montant minimum de retrait: ${minWithdrawal} FCFA`);
                }
                if (data.amount > maxWithdrawal) {
                    throw new Error(`Montant maximum de retrait: ${maxWithdrawal} FCFA`);
                }
                // Create transaction in PENDING state
                const transaction = yield this.prisma.transaction.create({
                    data: {
                        type: 'WITHDRAWAL',
                        amount: data.amount,
                        userId,
                        provider: data.provider,
                        status: 'PENDING',
                        notes: `Withdrawal to ${data.phoneNumber}`,
                    },
                });
                try {
                    // Debit wallet immediately (will be refunded if payment fails)
                    yield this.prisma.wallet.update({
                        where: { userId },
                        data: { balance: { decrement: data.amount } },
                    });
                    // Initiate payment with provider
                    const { PaymentService } = yield Promise.resolve().then(() => __importStar(require('./PaymentService')));
                    const paymentService = new PaymentService();
                    const result = yield paymentService.initiateWithdrawal(data.provider, data.amount, data.phoneNumber, userId);
                    if (!result.success) {
                        // Rollback wallet debit
                        yield this.prisma.wallet.update({
                            where: { userId },
                            data: { balance: { increment: data.amount } },
                        });
                        yield this.prisma.transaction.update({
                            where: { id: transaction.id },
                            data: {
                                status: 'FAILED',
                                notes: `Failed: ${result.message}`,
                                processedAt: new Date()
                            },
                        });
                        throw new Error(result.message || 'Withdrawal initiation failed');
                    }
                    // Update transaction with external reference
                    yield this.prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            externalRef: result.transactionId,
                        },
                    });
                    return Object.assign(Object.assign({}, transaction), { externalRef: result.transactionId, message: result.message });
                }
                catch (error) {
                    // Ensure rollback on any error
                    yield this.prisma.wallet.update({
                        where: { userId },
                        data: { balance: { increment: data.amount } },
                    });
                    yield this.prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            status: 'FAILED',
                            notes: `Error: ${error.message}`,
                            processedAt: new Date()
                        },
                    });
                    throw error;
                }
            });
        }
        confirmTransaction(data) {
            return __awaiter(this, void 0, void 0, function* () {
                const transaction = yield this.prisma.transaction.findUnique({
                    where: { id: data.transactionId },
                });
                if (!transaction) {
                    throw new Error('Transaction not found');
                }
                const status = data.status === 'CONFIRMED' ? 'CONFIRMED' : 'FAILED';
                const updatedTransaction = yield this.prisma.transaction.update({
                    where: { id: data.transactionId },
                    data: {
                        status: status,
                        externalRef: data.externalRef,
                        processedAt: new Date(),
                    },
                });
                // Reverse wallet update if failed
                if (status === 'FAILED') {
                    if (transaction.type === 'WITHDRAWAL') {
                        yield this.prisma.wallet.update({
                            where: { userId: transaction.userId },
                            data: { balance: { increment: transaction.amount } },
                        });
                    }
                    else if (transaction.type === 'DEPOSIT') {
                        yield this.prisma.wallet.update({
                            where: { userId: transaction.userId },
                            data: { balance: { decrement: transaction.amount } },
                        });
                    }
                }
                return updatedTransaction;
            });
        }
        listTransactions(userId, data) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield this.prisma.transaction.findMany({
                    where: {
                        userId,
                        status: data.status,
                        type: data.type,
                    },
                    take: data.limit,
                    skip: data.offset,
                    orderBy: { createdAt: 'desc' },
                });
            });
        }
        getTransactionById(transactionId) {
            return __awaiter(this, void 0, void 0, function* () {
                const transaction = yield this.prisma.transaction.findUnique({
                    where: { id: transactionId },
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        winnings: true,
                        commissions: true,
                    },
                });
                if (!transaction) {
                    throw new Error('Transaction not found');
                }
                return transaction;
            });
        }
        getWalletBalance(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                const wallet = yield this.prisma.wallet.findUnique({
                    where: { userId },
                });
                if (!wallet) {
                    throw new Error('Wallet not found');
                }
                return wallet;
            });
        }
    };
    __setFunctionName(_classThis, "TransactionService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TransactionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TransactionService = _classThis;
})();
exports.TransactionService = TransactionService;

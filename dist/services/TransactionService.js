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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
let TransactionService = class TransactionService {
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
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], TransactionService);

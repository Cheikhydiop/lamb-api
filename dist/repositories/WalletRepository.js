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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRepository = void 0;
const customErrors_1 = require("../errors/customErrors");
class WalletRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.wallet.findUnique({
                    where: { userId },
                    include: { user: true }
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to find wallet by user ID: ${error.message}`);
            }
        });
    }
    findById(walletId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.wallet.findUnique({
                    where: { id: walletId }
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to find wallet by ID: ${error.message}`);
            }
        });
    }
    create(walletData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                return yield this.prisma.wallet.create({
                    data: {
                        userId: walletData.userId,
                        balance: (_a = walletData.balance) !== null && _a !== void 0 ? _a : 0,
                        lockedBalance: (_b = walletData.lockedBalance) !== null && _b !== void 0 ? _b : 0
                    }
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to create wallet: ${error.message}`);
            }
        });
    }
    updateBalance(userId, balance) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.wallet.update({
                    where: { userId },
                    data: { balance }
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to update wallet balance: ${error.message}`);
            }
        });
    }
    updateLockedBalance(userId, lockedBalance) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.wallet.update({
                    where: { userId },
                    data: { lockedBalance }
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to update locked balance: ${error.message}`);
            }
        });
    }
    lockFunds(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const wallet = yield tx.wallet.findUnique({
                        where: { userId }
                    });
                    if (!wallet) {
                        throw new Error('Wallet not found');
                    }
                    if (wallet.balance < amount) {
                        throw new Error('Insufficient balance');
                    }
                    return yield tx.wallet.update({
                        where: { userId },
                        data: {
                            balance: wallet.balance - amount,
                            lockedBalance: wallet.lockedBalance + amount
                        }
                    });
                }));
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to lock funds: ${error.message}`);
            }
        });
    }
    unlockFunds(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const wallet = yield tx.wallet.findUnique({
                        where: { userId }
                    });
                    if (!wallet) {
                        throw new Error('Wallet not found');
                    }
                    if (wallet.lockedBalance < amount) {
                        throw new Error('Insufficient locked balance');
                    }
                    return yield tx.wallet.update({
                        where: { userId },
                        data: {
                            balance: wallet.balance + amount,
                            lockedBalance: wallet.lockedBalance - amount
                        }
                    });
                }));
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to unlock funds: ${error.message}`);
            }
        });
    }
    transferLockedFunds(fromUserId, toUserId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const fromWallet = yield tx.wallet.findUnique({
                        where: { userId: fromUserId }
                    });
                    const toWallet = yield tx.wallet.findUnique({
                        where: { userId: toUserId }
                    });
                    if (!fromWallet || !toWallet) {
                        throw new Error('One or both wallets not found');
                    }
                    if (fromWallet.lockedBalance < amount) {
                        throw new Error('Insufficient locked balance');
                    }
                    const updatedFromWallet = yield tx.wallet.update({
                        where: { userId: fromUserId },
                        data: {
                            lockedBalance: fromWallet.lockedBalance - amount
                        }
                    });
                    const updatedToWallet = yield tx.wallet.update({
                        where: { userId: toUserId },
                        data: {
                            balance: toWallet.balance + amount
                        }
                    });
                    return {
                        fromWallet: updatedFromWallet,
                        toWallet: updatedToWallet
                    };
                }));
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to transfer locked funds: ${error.message}`);
            }
        });
    }
    addFunds(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const wallet = yield this.prisma.wallet.findUnique({
                    where: { userId }
                });
                if (!wallet) {
                    throw new customErrors_1.DatabaseError('Wallet not found');
                }
                return yield this.prisma.wallet.update({
                    where: { userId },
                    data: {
                        balance: wallet.balance + amount
                    }
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to add funds: ${error.message}`);
            }
        });
    }
    deductFunds(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const wallet = yield tx.wallet.findUnique({
                        where: { userId }
                    });
                    if (!wallet) {
                        throw new Error('Wallet not found');
                    }
                    if (wallet.balance < amount) {
                        throw new Error('Insufficient balance');
                    }
                    return yield tx.wallet.update({
                        where: { userId },
                        data: {
                            balance: wallet.balance - amount
                        }
                    });
                }));
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to deduct funds: ${error.message}`);
            }
        });
    }
}
exports.WalletRepository = WalletRepository;

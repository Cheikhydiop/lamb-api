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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const logger_1 = __importDefault(require("../utils/logger"));
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        isEmailVerified: true,
                        isActive: true,
                        createdAt: true,
                        lastLogin: true,
                        wallet: true,
                    },
                });
                if (!user) {
                    throw new Error('User not found');
                }
                return user;
            }
            catch (error) {
                logger_1.default.error('Error fetching user', error);
                throw error;
            }
        });
    }
    updateUser(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.update({
                    where: { id: userId },
                    data: {
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        isEmailVerified: true,
                        isActive: true,
                    },
                });
                logger_1.default.info(`User updated: ${userId}`);
                return user;
            }
            catch (error) {
                logger_1.default.error('Error updating user', error);
                throw error;
            }
        });
    }
    changePassword(userId, oldPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId },
                });
                if (!user) {
                    throw new Error('User not found');
                }
                const isPasswordValid = yield bcrypt.compare(oldPassword, user.password);
                if (!isPasswordValid) {
                    throw new Error('Invalid current password');
                }
                const hashedPassword = yield bcrypt.hash(newPassword, 10);
                yield this.prisma.user.update({
                    where: { id: userId },
                    data: { password: hashedPassword },
                });
                logger_1.default.info(`Password changed for user: ${userId}`);
            }
            catch (error) {
                logger_1.default.error('Error changing password', error);
                throw error;
            }
        });
    }
    deactivateAccount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.user.update({
                    where: { id: userId },
                    data: { isActive: false },
                });
                logger_1.default.info(`Account deactivated: ${userId}`);
            }
            catch (error) {
                logger_1.default.error('Error deactivating account', error);
                throw error;
            }
        });
    }
    reactivateAccount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.user.update({
                    where: { id: userId },
                    data: { isActive: true },
                });
                logger_1.default.info(`Account reactivated: ${userId}`);
            }
            catch (error) {
                logger_1.default.error('Error reactivating account', error);
                throw error;
            }
        });
    }
    getUserStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [betStats, transactionStats, wallet] = yield Promise.all([
                    this.prisma.bet.findMany({
                        where: { OR: [{ creatorId: userId }, { acceptorId: userId }] },
                    }),
                    this.prisma.transaction.findMany({
                        where: { userId },
                    }),
                    this.prisma.wallet.findUnique({
                        where: { userId },
                    }),
                ]);
                const totalBets = betStats.length;
                const acceptedBets = betStats.filter((b) => b.status === 'ACCEPTED').length;
                const totalTransactions = transactionStats.length;
                const totalWinnings = yield this.prisma.winning.aggregate({
                    where: { userId },
                    _sum: { amount: true },
                });
                return {
                    totalBets,
                    acceptedBets,
                    totalTransactions,
                    totalWinnings: totalWinnings._sum.amount || BigInt(0),
                    wallet,
                };
            }
            catch (error) {
                logger_1.default.error('Error fetching user stats', error);
                throw error;
            }
        });
    }
    listUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 20, offset = 0) {
            try {
                const users = yield this.prisma.user.findMany({
                    take: limit,
                    skip: offset,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                        lastLogin: true,
                    },
                    orderBy: { createdAt: 'desc' },
                });
                return users;
            }
            catch (error) {
                logger_1.default.error('Error listing users', error);
                throw error;
            }
        });
    }
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if user has active bets or transactions
                const activeBets = yield this.prisma.bet.count({
                    where: { OR: [{ creatorId: userId }, { acceptorId: userId }], status: 'ACCEPTED' },
                });
                if (activeBets > 0) {
                    throw new Error('Cannot delete user with active bets');
                }
                yield this.prisma.user.delete({
                    where: { id: userId },
                });
                logger_1.default.info(`User deleted: ${userId}`);
            }
            catch (error) {
                logger_1.default.error('Error deleting user', error);
                throw error;
            }
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], UserService);

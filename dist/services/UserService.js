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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const customErrors_1 = require("../errors/customErrors");
const logger_1 = __importDefault(require("../utils/logger"));
class UserService {
    constructor(userRepository, walletRepository, emailVerificationService, sessionRepository, prisma // Injected for complex queries/aggregations not yet in repositories
    ) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.emailVerificationService = emailVerificationService;
        this.sessionRepository = sessionRepository;
        this.prisma = prisma;
        logger_1.default.info('UserService initialized');
    }
    /**
     * Récupère un utilisateur par son ID
     */
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userRepository.findByIdWithWallet(userId);
                if (!user) {
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé');
                }
                return user;
            }
            catch (error) {
                if (error instanceof customErrors_1.NotFoundError)
                    throw error;
                logger_1.default.error('Error fetching user', error);
                throw new customErrors_1.DatabaseError('Erreur lors de la récupération de l\'utilisateur');
            }
        });
    }
    /**
     * Met à jour les informations d'un utilisateur
     */
    updateUser(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate input if needed
                const updateData = {};
                if (data.name)
                    updateData.name = data.name;
                if (data.phone)
                    updateData.phone = data.phone;
                if (data.email)
                    updateData.email = data.email;
                const user = yield this.userRepository.update(userId, updateData);
                logger_1.default.info(`User updated: ${userId}`);
                return user;
            }
            catch (error) {
                logger_1.default.error('Error updating user', error);
                throw new customErrors_1.DatabaseError('Erreur lors de la mise à jour de l\'utilisateur');
            }
        });
    }
    /**
     * Change le mot de passe d'un utilisateur
     */
    changePassword(userId, oldPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userRepository.findById(userId);
                if (!user) {
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé');
                }
                const isPasswordValid = yield bcrypt_1.default.compare(oldPassword, user.password);
                if (!isPasswordValid) {
                    throw new customErrors_1.AuthenticationError('Mot de passe actuel incorrect');
                }
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
                yield this.userRepository.updatePassword(userId, hashedPassword);
                logger_1.default.info(`Password changed for user: ${userId}`);
            }
            catch (error) {
                if (error instanceof customErrors_1.NotFoundError || error instanceof customErrors_1.AuthenticationError)
                    throw error;
                logger_1.default.error('Error changing password', error);
                throw new customErrors_1.DatabaseError('Erreur lors du changement de mot de passe');
            }
        });
    }
    /**
     * Désactive un compte utilisateur
     */
    deactivateAccount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.userRepository.update(userId, { isActive: false });
                logger_1.default.info(`Account deactivated: ${userId}`);
            }
            catch (error) {
                logger_1.default.error('Error deactivating account', error);
                throw new customErrors_1.DatabaseError('Erreur lors de la désactivation du compte');
            }
        });
    }
    /**
     * Réactive un compte utilisateur
     */
    reactivateAccount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.userRepository.update(userId, { isActive: true });
                logger_1.default.info(`Account reactivated: ${userId}`);
            }
            catch (error) {
                logger_1.default.error('Error reactivating account', error);
                throw new customErrors_1.DatabaseError('Erreur lors de la réactivation du compte');
            }
        });
    }
    /**
     * Récupère les statistiques d'un utilisateur
     */
    getUserStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Using direct prisma queries for stats as repositories might not have these specific aggregations
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
                const acceptedBets = betStats.filter((b) => b.status === valFromEnum('ACCEPTED')).length;
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
                    wallet: wallet ? this.sanitizeBigInt(wallet) : null,
                };
            }
            catch (error) {
                logger_1.default.error('Error fetching user stats', error);
                throw new customErrors_1.DatabaseError('Erreur lors de la récupération des statistiques');
            }
        });
    }
    /**
     * Liste les utilisateurs (Admin)
     */
    listUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 20, offset = 0) {
            try {
                const result = yield this.userRepository.findAll(Math.floor(offset / limit) + 1, limit);
                return result.users;
            }
            catch (error) {
                logger_1.default.error('Error listing users', error);
                throw new customErrors_1.DatabaseError('Erreur lors de la récupération de la liste des utilisateurs');
            }
        });
    }
    /**
     * Supprime un utilisateur (Admin)
     */
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if user has active bets or transactions
                // Implementation migrated from user.service.ts
                const activeBets = yield this.prisma.bet.count({
                    where: { OR: [{ creatorId: userId }, { acceptorId: userId }], status: 'ACCEPTED' },
                });
                if (activeBets > 0) {
                    throw new customErrors_1.ConflictError('Impossible de supprimer un utilisateur avec des paris actifs');
                }
                yield this.userRepository.delete(userId);
                logger_1.default.info(`User deleted: ${userId}`);
            }
            catch (error) {
                if (error instanceof customErrors_1.ConflictError)
                    throw error;
                logger_1.default.error('Error deleting user', error);
                throw new customErrors_1.DatabaseError('Erreur lors de la suppression de l\'utilisateur');
            }
        });
    }
    // Helper for BigInt serialization (duplicated from repo, but useful here if returning direct prisma results)
    sanitizeBigInt(data) {
        if (data === null || data === undefined)
            return data;
        if (typeof data === 'bigint')
            return String(data);
        if (Array.isArray(data))
            return data.map(item => this.sanitizeBigInt(item));
        if (typeof data === 'object') {
            const sanitized = {};
            for (const key in data)
                sanitized[key] = this.sanitizeBigInt(data[key]);
            return sanitized;
        }
        return data;
    }
}
exports.UserService = UserService;
// Helper to handle Enum strings if needed, though Prisma Enums are usually available via import
function valFromEnum(val) { return val; }

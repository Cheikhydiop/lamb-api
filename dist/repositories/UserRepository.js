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
exports.UserRepository = void 0;
const customErrors_1 = require("../errors/customErrors");
class UserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Méthode helper pour convertir BigInt en string de manière récursive
    sanitizeBigInt(data) {
        if (data === null || data === undefined) {
            return data;
        }
        if (typeof data === 'bigint') {
            return String(data);
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeBigInt(item));
        }
        if (typeof data === 'object') {
            const sanitized = {};
            for (const key in data) {
                sanitized[key] = this.sanitizeBigInt(data[key]);
            }
            return sanitized;
        }
        return data;
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.findUnique({
                    where: { email }
                });
                return this.sanitizeBigInt(user);
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to find user by email: ${error.message}`);
            }
        });
    }
    findByEmailWithWallet(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.findUnique({
                    where: { email },
                    include: { wallet: true }
                });
                return this.sanitizeBigInt(user);
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to find user by email with wallet: ${error.message}`);
            }
        });
    }
    findByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.findUnique({
                    where: { phone }
                });
                return this.sanitizeBigInt(user);
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to find user by phone: ${error.message}`);
            }
        });
    }
    findByIdWithWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId },
                    include: { wallet: true }
                });
                return this.sanitizeBigInt(user);
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to find user by ID with wallet: ${error.message}`);
            }
        });
    }
    create(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.create({
                    data: userData
                });
                return this.sanitizeBigInt(user);
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to create user: ${error.message}`);
            }
        });
    }
    createUserWithWallet(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Utiliser une transaction pour créer l'utilisateur et le portefeuille ensemble
                const result = yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // Créer l'utilisateur
                    const user = yield tx.user.create({
                        data: userData
                    });
                    // Créer le portefeuille automatiquement
                    const wallet = yield tx.wallet.create({
                        data: {
                            userId: user.id,
                            balance: 0,
                            lockedBalance: 0
                        }
                    });
                    return { user, wallet };
                }));
                return this.sanitizeBigInt(result);
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to create user with wallet: ${error.message}`);
            }
        });
    }
    update(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.update({
                    where: { id: userId },
                    data: updateData
                });
                return this.sanitizeBigInt(user);
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to update user: ${error.message}`);
            }
        });
    }
    updateLastLogin(userId, loginTime) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.user.update({
                    where: { id: userId },
                    data: { lastLogin: loginTime }
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to update last login: ${error.message}`);
            }
        });
    }
    delete(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Le portefeuille sera supprimé automatiquement grâce à onDelete: Cascade
                yield this.prisma.user.delete({
                    where: { id: userId }
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to delete user: ${error.message}`);
            }
        });
    }
    findAll() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10) {
            try {
                const offset = (page - 1) * limit;
                const [users, total] = yield Promise.all([
                    this.prisma.user.findMany({
                        skip: offset,
                        take: limit,
                        include: { wallet: true },
                        orderBy: { createdAt: 'desc' }
                    }),
                    this.prisma.user.count()
                ]);
                return this.sanitizeBigInt({
                    users,
                    total,
                    pages: Math.ceil(total / limit)
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to fetch users: ${error.message}`);
            }
        });
    }
    // Dans UserRepository, ajoutez :
    createWithWallet(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // Créer l'utilisateur
                    const user = yield tx.user.create({
                        data: {
                            email: userData.email,
                            password: userData.password,
                            name: userData.name,
                            phone: userData.phone,
                            role: userData.role,
                            isActive: userData.isActive,
                            isEmailVerified: userData.isEmailVerified,
                        }
                    });
                    // Créer le wallet associé
                    const wallet = yield tx.wallet.create({
                        data: {
                            userId: user.id,
                            balance: 0,
                            lockedBalance: 0
                        }
                    });
                    return { user, wallet };
                }));
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to create user with wallet: ${error.message}`);
            }
        });
    }
    // ----------------------------------------------------
    // NOUVELLE MÉTHODE À AJOUTER DANS UserRepository.ts
    // ----------------------------------------------------
    findById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId }
                });
                // Utilisation de la méthode helper existante
                return this.sanitizeBigInt(user);
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to find user by ID: ${error.message}`);
            }
        });
    }
    // ----------------------------------------------------
    // MÉTHODE À AJOUTER DANS UserRepository.ts
    // ----------------------------------------------------
    updatePassword(userId, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.user.update({
                    where: { id: userId },
                    data: { password: hashedPassword }
                });
            }
            catch (error) {
                throw new customErrors_1.DatabaseError(`Failed to update password for user: ${error.message}`);
            }
        });
    }
}
exports.UserRepository = UserRepository;

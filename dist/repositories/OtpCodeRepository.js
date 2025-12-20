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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpCodeRepository = void 0;
const inversify_1 = require("inversify");
let OtpCodeRepository = (() => {
    let _classDecorators = [(0, inversify_1.injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OtpCodeRepository = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
        }
        /**
         * Créer un code OTP
         */
        create(data) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield this.prisma.otpCode.create({
                        data: {
                            userId: data.userId,
                            code: data.code,
                            purpose: data.purpose,
                            expiresAt: data.expiresAt,
                            consumed: false,
                            createdAt: new Date()
                        }
                    });
                }
                catch (error) {
                    console.error('❌ Erreur lors de la création du code OTP:', error);
                    throw error;
                }
            });
        }
        /**
         * Trouver un code OTP valide par utilisateur et code
         */
        findValidToken(userId, code, purpose) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const now = new Date();
                    const whereCondition = {
                        userId,
                        code,
                        consumed: false,
                        expiresAt: { gt: now }
                    };
                    if (purpose) {
                        whereCondition.purpose = purpose;
                    }
                    return yield this.prisma.otpCode.findFirst({
                        where: whereCondition,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    phone: true,
                                    isActive: true,
                                    isEmailVerified: true
                                }
                            }
                        }
                    });
                }
                catch (error) {
                    console.error('❌ Erreur lors de la recherche du token OTP:', error);
                    throw error;
                }
            });
        }
        /**
         * Trouver un code OTP par ID
         */
        findById(id) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield this.prisma.otpCode.findUnique({
                        where: { id },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    });
                }
                catch (error) {
                    console.error('❌ Erreur lors de la recherche du code OTP par ID:', error);
                    throw error;
                }
            });
        }
        /**
         * Marquer un code OTP comme utilisé
         */
        // /home/diop/Musique/Xbeur/inesic-api/src/repositories/OtpCodeRepository.ts
        markAsUsed(id) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield this.prisma.otpCode.update({
                        where: { id },
                        data: {
                            consumed: true, // Ceci est le seul champ requis par Prisma
                            // SUPPRIMER LA LIGNE SUIVANTE : consumedAt: new Date(),
                        }
                    });
                }
                catch (error) {
                    // Il semble que vous ayez déjà une fonction de log d'erreur ici, 
                    // assurez-vous de lancer la bonne erreur si nécessaire.
                    throw error;
                }
            });
        }
        /**
         * Supprimer les codes OTP d'un utilisateur
         */
        deleteUserTokens(userId, purpose) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const whereCondition = { userId };
                    if (purpose) {
                        whereCondition.purpose = purpose;
                    }
                    return yield this.prisma.otpCode.deleteMany({
                        where: whereCondition
                    });
                }
                catch (error) {
                    console.error('❌ Erreur lors de la suppression des codes OTP:', error);
                    throw error;
                }
            });
        }
        /**
         * Supprimer les codes OTP expirés
         */
        deleteExpiredTokens() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const now = new Date();
                    return yield this.prisma.otpCode.deleteMany({
                        where: {
                            OR: [
                                { expiresAt: { lt: now } },
                                { consumed: true }
                            ]
                        }
                    });
                }
                catch (error) {
                    console.error('❌ Erreur lors de la suppression des codes OTP expirés:', error);
                    throw error;
                }
            });
        }
        /**
         * Vérifier si un code OTP est valide
         */
        isValid(userId, code, purpose) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const otp = yield this.findValidToken(userId, code, purpose);
                    return !!otp;
                }
                catch (error) {
                    console.error('❌ Erreur lors de la vérification du code OTP:', error);
                    return false;
                }
            });
        }
        /**
         * Obtenir les codes OTP d'un utilisateur
         */
        findByUserId(userId, purpose) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const whereCondition = { userId };
                    if (purpose) {
                        whereCondition.purpose = purpose;
                    }
                    return yield this.prisma.otpCode.findMany({
                        where: whereCondition,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            user: {
                                select: {
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    });
                }
                catch (error) {
                    console.error('❌ Erreur lors de la recherche des codes OTP par utilisateur:', error);
                    throw error;
                }
            });
        }
        /**
         * Compter les tentatives récentes d'un utilisateur
         */
        countRecentAttempts(userId_1, purpose_1) {
            return __awaiter(this, arguments, void 0, function* (userId, purpose, windowMinutes = 15) {
                try {
                    const windowStart = new Date();
                    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
                    return yield this.prisma.otpCode.count({
                        where: {
                            userId,
                            purpose,
                            createdAt: {
                                gte: windowStart
                            }
                        }
                    });
                }
                catch (error) {
                    console.error('❌ Erreur lors du comptage des tentatives récentes:', error);
                    return 0;
                }
            });
        }
        /**
         * Vérifier si l'utilisateur a dépassé le nombre maximum de tentatives
         */
        hasExceededAttempts(userId_1, purpose_1) {
            return __awaiter(this, arguments, void 0, function* (userId, purpose, maxAttempts = 5) {
                try {
                    const count = yield this.countRecentAttempts(userId, purpose);
                    return count >= maxAttempts;
                }
                catch (error) {
                    console.error('❌ Erreur lors de la vérification des tentatives:', error);
                    return false;
                }
            });
        }
        /**
         * Générer et sauvegarder un code OTP
         */
        generateAndSave(userId_1, purpose_1) {
            return __awaiter(this, arguments, void 0, function* (userId, purpose, expiresInMinutes = 15) {
                try {
                    // Générer un code à 6 chiffres
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    const expiresAt = new Date();
                    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
                    // Supprimer les anciens codes
                    yield this.deleteUserTokens(userId, purpose);
                    // Créer le nouveau code
                    yield this.create({
                        userId,
                        code,
                        purpose: purpose,
                        expiresAt
                    });
                    return code;
                }
                catch (error) {
                    console.error('❌ Erreur lors de la génération du code OTP:', error);
                    throw error;
                }
            });
        }
        /**
         * Vérifier et consommer un code OTP
         */
        verifyAndConsume(userId, code, purpose) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const otp = yield this.findValidToken(userId, code, purpose);
                    if (!otp) {
                        return false;
                    }
                    // Marquer comme utilisé
                    yield this.markAsUsed(otp.id);
                    return true;
                }
                catch (error) {
                    console.error('❌ Erreur lors de la vérification et consommation du code OTP:', error);
                    return false;
                }
            });
        }
        /**
         * Obtenir les statistiques des codes OTP
         */
        getStats(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const whereCondition = {};
                    if (userId) {
                        whereCondition.userId = userId;
                    }
                    const now = new Date();
                    const [total, active, expired, consumed, recent] = yield Promise.all([
                        // Total
                        this.prisma.otpCode.count({ where: whereCondition }),
                        // Actifs (non consommés, non expirés)
                        this.prisma.otpCode.count({
                            where: Object.assign(Object.assign({}, whereCondition), { consumed: false, expiresAt: { gt: now } })
                        }),
                        // Expirés
                        this.prisma.otpCode.count({
                            where: Object.assign(Object.assign({}, whereCondition), { expiresAt: { lt: now } })
                        }),
                        // Consommés
                        this.prisma.otpCode.count({
                            where: Object.assign(Object.assign({}, whereCondition), { consumed: true })
                        }),
                        // Récent (dernières 24h)
                        this.prisma.otpCode.count({
                            where: Object.assign(Object.assign({}, whereCondition), { createdAt: {
                                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                                } })
                        })
                    ]);
                    return {
                        total,
                        active,
                        expired,
                        consumed,
                        recent,
                        expiredPercentage: total > 0 ? (expired / total) * 100 : 0
                    };
                }
                catch (error) {
                    console.error('❌ Erreur lors de la récupération des statistiques OTP:', error);
                    throw error;
                }
            });
        }
    };
    __setFunctionName(_classThis, "OtpCodeRepository");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OtpCodeRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OtpCodeRepository = _classThis;
})();
exports.OtpCodeRepository = OtpCodeRepository;

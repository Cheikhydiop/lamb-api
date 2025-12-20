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
exports.authErrorHandler = exports.requireBetOwnership = exports.requireOwnership = exports.requireSufficientFunds = exports.requireEmailVerified = exports.optionalAuth = exports.requireBettor = exports.requireAdmin = exports.requireRole = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const customErrors_1 = require("../errors/customErrors");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// ==================== FONCTIONS UTILITAIRES ====================
/**
 * Extrait le token JWT depuis les headers
 */
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string')
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
        return null;
    return parts[1] || null;
};
/**
 * Vérifie et décode un token JWT
 */
const verifyAndDecodeToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Validation de base
        if (!decoded || typeof decoded !== 'object') {
            throw new customErrors_1.AuthenticationError('Token invalide', {
                reason: 'INVALID_TOKEN_STRUCTURE'
            });
        }
        if (!decoded.userId || typeof decoded.userId !== 'string') {
            throw new customErrors_1.AuthenticationError('Token invalide', {
                reason: 'MISSING_USER_ID'
            });
        }
        return {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            walletId: decoded.walletId,
            sessionId: decoded.sessionId
        };
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new customErrors_1.AuthenticationError('Token invalide', {
                reason: 'INVALID_TOKEN'
            });
        }
        if (error.name === 'TokenExpiredError') {
            throw new customErrors_1.AuthenticationError('Token expiré', {
                reason: 'TOKEN_EXPIRED'
            });
        }
        throw error;
    }
};
/**
 * Récupère l'utilisateur complet depuis la base de données
 */
const fetchUserWithWallet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            role: true,
            isActive: true,
            isEmailVerified: true,
            wallet: {
                select: {
                    id: true,
                    balance: true,
                    lockedBalance: true,
                }
            }
        }
    });
    // Convertir les BigInt en nombres pour une meilleure compatibilité
    if (user && user.wallet) {
        return Object.assign(Object.assign({}, user), { wallet: Object.assign(Object.assign({}, user.wallet), { balance: user.wallet.balance, lockedBalance: user.wallet.lockedBalance }) });
    }
    return user;
});
// ==================== MIDDLEWARES PRINCIPAUX ====================
/**
 * Middleware d'authentification principal
 */
const requireAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Récupérer le token
        const token = extractToken(req);
        if (!token) {
            throw new customErrors_1.AuthenticationError('Token d\'authentification manquant', {
                reason: 'NO_AUTH_TOKEN',
                suggestion: 'Ajoutez un header Authorization: Bearer <token>'
            });
        }
        // Vérifier et décoder le token
        const decoded = verifyAndDecodeToken(token);
        // Récupérer l'utilisateur depuis la base de données
        const user = yield fetchUserWithWallet(decoded.userId);
        if (!user) {
            throw new customErrors_1.AuthenticationError('Utilisateur non trouvé', {
                reason: 'USER_NOT_FOUND'
            });
        }
        if (!user.isActive) {
            throw new customErrors_1.AuthenticationError('Votre compte est désactivé', {
                reason: 'ACCOUNT_DEACTIVATED'
            });
        }
        // Ajouter l'utilisateur à la requête
        req.user = Object.assign(Object.assign({}, user), { id: user.id, userId: user.id, authToken: token, walletId: (_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id });
        next();
    }
    catch (error) {
        // Si c'est déjà une erreur personnalisée, la propager
        if (error instanceof customErrors_1.AuthenticationError || error instanceof customErrors_1.ForbiddenError) {
            next(error);
            return;
        }
        // Pour les autres erreurs JWT
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            next(new customErrors_1.AuthenticationError('Token invalide ou expiré', {
                reason: 'INVALID_OR_EXPIRED_TOKEN',
                suggestion: 'Veuillez vous reconnecter.'
            }));
            return;
        }
        // Erreur générique
        console.error('Erreur d\'authentification:', error);
        next(new customErrors_1.AuthenticationError('Erreur d\'authentification', {
            reason: 'AUTHENTICATION_ERROR',
            originalError: error.message
        }));
    }
});
exports.requireAuth = requireAuth;
/**
 * Middleware pour vérifier le rôle de l'utilisateur
 */
const requireRole = (...roles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // D'abord vérifier l'authentification
            yield (0, exports.requireAuth)(req, res, (err) => {
                if (err)
                    return next(err);
                if (!req.user) {
                    return next(new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                        reason: 'NO_USER_IN_REQUEST'
                    }));
                }
                if (!roles.includes(req.user.role)) {
                    const rolesString = roles.join(', ');
                    return next(new customErrors_1.ForbiddenError('Accès non autorisé', {
                        requiredRoles: roles,
                        userRole: req.user.role,
                        reason: 'INSUFFICIENT_PERMISSIONS',
                        suggestion: `Rôles requis: ${rolesString}. Votre rôle: ${req.user.role}`
                    }));
                }
                next();
            });
        }
        catch (error) {
            next(error);
        }
    });
};
exports.requireRole = requireRole;
/**
 * Middleware pour les admins seulement
 */
exports.requireAdmin = (0, exports.requireRole)('ADMIN', 'SUPER_ADMIN');
/**
 * Middleware pour les parieurs seulement
 */
exports.requireBettor = (0, exports.requireRole)('BETTOR');
/**
 * Middleware optionnel d'authentification
 */
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = extractToken(req);
        if (!token) {
            return next();
        }
        try {
            // Vérifier et décoder le token
            const decoded = verifyAndDecodeToken(token);
            // Récupérer l'utilisateur
            const user = yield fetchUserWithWallet(decoded.userId);
            if (user && user.isActive) {
                req.user = Object.assign(Object.assign({}, user), { id: user.id, userId: user.id, authToken: token, walletId: (_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id });
            }
        }
        catch (error) {
            // Ne pas bloquer si le token est invalide (c'est optionnel)
            console.debug('Optional auth failed:', (error === null || error === void 0 ? void 0 : error.message) || error);
        }
        next();
    }
    catch (error) {
        // Continuer sans authentification en cas d'erreur
        next();
    }
});
exports.optionalAuth = optionalAuth;
/**
 * Middleware pour vérifier si l'email est vérifié
 */
const requireEmailVerified = (req, res, next) => {
    try {
        if (!req.user) {
            throw new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                reason: 'NO_USER_IN_REQUEST'
            });
        }
        if (!req.user.isEmailVerified) {
            throw new customErrors_1.ForbiddenError('Email non vérifié', {
                reason: 'EMAIL_NOT_VERIFIED',
                suggestion: 'Veuillez vérifier votre email pour accéder à cette fonctionnalité'
            });
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireEmailVerified = requireEmailVerified;
/**
 * Middleware pour vérifier les fonds disponibles
 */
const requireSufficientFunds = (amount, includeLocked = false) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                    reason: 'NO_USER_IN_REQUEST'
                });
            }
            if (!req.user.wallet) {
                throw new customErrors_1.ForbiddenError('Portefeuille non trouvé', {
                    reason: 'WALLET_NOT_FOUND'
                });
            }
            const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
            const availableBalance = includeLocked
                ? req.user.wallet.balance
                : req.user.wallet.balance - req.user.wallet.lockedBalance;
            if (availableBalance < amountBigInt) {
                throw new customErrors_1.ForbiddenError('Fonds insuffisants', {
                    reason: 'INSUFFICIENT_FUNDS',
                    available: availableBalance.toString(),
                    required: amountBigInt.toString()
                });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireSufficientFunds = requireSufficientFunds;
/**
 * Middleware pour vérifier la propriété d'une ressource
 */
const requireOwnership = (resourceParam = 'userId', allowAdmins = true, bodyParam = false) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, exports.requireAuth)(req, res, (err) => {
                if (err)
                    return next(err);
                if (!req.user) {
                    throw new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                        reason: 'NO_USER_IN_REQUEST'
                    });
                }
                // Récupérer l'ID de la ressource
                const resourceId = req.params[resourceParam] ||
                    (bodyParam ? req.body[resourceParam] : undefined);
                if (!resourceId || typeof resourceId !== 'string') {
                    throw new customErrors_1.ForbiddenError('Identifiant de ressource invalide', {
                        reason: 'INVALID_RESOURCE_ID',
                        param: resourceParam
                    });
                }
                // Vérifier la propriété
                const isOwner = req.user.id === resourceId;
                const isAdmin = allowAdmins && req.user.role === 'ADMIN';
                if (!isOwner && !isAdmin) {
                    throw new customErrors_1.ForbiddenError('Accès non autorisé à cette ressource', {
                        reason: 'NOT_OWNER_OR_ADMIN',
                        resourceId,
                        userRole: req.user.role,
                        required: allowAdmins ? 'OWNER_OR_ADMIN' : 'OWNER_ONLY'
                    });
                }
                next();
            });
        }
        catch (error) {
            next(error);
        }
    });
};
exports.requireOwnership = requireOwnership;
/**
 * Middleware pour vérifier la propriété d'un pari
 */
const requireBetOwnership = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, exports.requireAuth)(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (err)
                return next(err);
            if (!req.user) {
                throw new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                    reason: 'NO_USER_IN_REQUEST'
                });
            }
            const betId = req.params.betId || req.body.betId;
            if (!betId || typeof betId !== 'string') {
                throw new customErrors_1.ForbiddenError('ID du pari requis', {
                    reason: 'MISSING_BET_ID'
                });
            }
            const bet = yield prisma.bet.findUnique({
                where: { id: betId },
                select: { creatorId: true, acceptorId: true }
            });
            if (!bet) {
                throw new customErrors_1.ForbiddenError('Pari non trouvé', {
                    reason: 'BET_NOT_FOUND',
                    betId
                });
            }
            const isCreator = bet.creatorId === req.user.id;
            const isAcceptor = bet.acceptorId === req.user.id;
            const isAdmin = req.user.role === 'ADMIN';
            if (!isCreator && !isAcceptor && !isAdmin) {
                throw new customErrors_1.ForbiddenError('Vous n\'êtes pas autorisé à modifier ce pari', {
                    reason: 'NOT_BET_OWNER',
                    betId,
                    userRole: req.user.role
                });
            }
            next();
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.requireBetOwnership = requireBetOwnership;
// ==================== GESTIONNAIRE D'ERREURS ====================
/**
 * Middleware de gestion des erreurs d'authentification
 */
const authErrorHandler = (error, req, res, next) => {
    // Si ce n'est pas une erreur d'authentification, passer au prochain middleware
    if (!(error instanceof customErrors_1.AuthenticationError) && !(error instanceof customErrors_1.ForbiddenError)) {
        return next(error);
    }
    // Déterminer le code de statut HTTP
    const statusCode = error instanceof customErrors_1.AuthenticationError ? 401 : 403;
    // Construire la réponse
    const response = {
        success: false,
        error: error.message
    };
    // Ajouter des détails si disponibles (sauf en production)
    if (process.env.NODE_ENV !== 'production' && error.details) {
        response.details = error.details;
    }
    res.status(statusCode).json(response);
};
exports.authErrorHandler = authErrorHandler;
exports.default = {
    requireAuth: exports.requireAuth,
    requireRole: exports.requireRole,
    requireAdmin: exports.requireAdmin,
    requireBettor: exports.requireBettor,
    optionalAuth: exports.optionalAuth,
    requireEmailVerified: exports.requireEmailVerified,
    requireSufficientFunds: exports.requireSufficientFunds,
    requireOwnership: exports.requireOwnership,
    requireBetOwnership: exports.requireBetOwnership,
    authErrorHandler: exports.authErrorHandler
};

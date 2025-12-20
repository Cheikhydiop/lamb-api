"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.require2FAForAdminAction = exports.adminRateLimiter = exports.requireAdminPermission = exports.logAdminAction = exports.superAdminMiddleware = exports.adminOrOwnerMiddleware = exports.adminMiddleware = void 0;
const customErrors_1 = require("../errors/customErrors");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Middleware pour vérifier que l'utilisateur est un administrateur
 * Ce middleware doit être utilisé APRÈS requireAuth
 */
const adminMiddleware = (req, res, next) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!req.user) {
            throw new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                reason: 'NO_USER_IN_REQUEST',
                suggestion: 'Utilisez requireAuth avant adminMiddleware'
            });
        }
        // Vérifier que l'utilisateur est actif
        if (!req.user.isActive) {
            throw new customErrors_1.ForbiddenError('Compte désactivé', {
                reason: 'ACCOUNT_DEACTIVATED',
                userId: req.user.id
            });
        }
        // Vérifier le rôle admin
        if (req.user.role !== 'ADMIN') {
            logger_1.default.warn(`Tentative d'accès admin par utilisateur non-admin: ${req.user.id}`, {
                userId: req.user.id,
                userRole: req.user.role,
                requestedPath: req.path,
                method: req.method
            });
            throw new customErrors_1.ForbiddenError('Accès réservé aux administrateurs', {
                reason: 'INSUFFICIENT_PERMISSIONS',
                requiredRole: 'ADMIN',
                userRole: req.user.role,
                suggestion: 'Cette action nécessite des privilèges administrateur'
            });
        }
        // Log de l'action admin (pour audit)
        logger_1.default.info(`Action admin: ${req.method} ${req.path}`, {
            adminId: req.user.id,
            adminName: req.user.name,
            adminEmail: req.user.email,
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip || req.socket.remoteAddress
        });
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.adminMiddleware = adminMiddleware;
/**
 * Middleware pour vérifier que l'utilisateur est admin OU propriétaire de la ressource
 * Utile pour les endpoints où l'utilisateur peut gérer ses propres données OU un admin peut gérer toutes les données
 */
const adminOrOwnerMiddleware = (resourceParam = 'userId', bodyParam = false) => {
    return (req, res, next) => {
        try {
            // Vérifier que l'utilisateur est authentifié
            if (!req.user) {
                throw new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                    reason: 'NO_USER_IN_REQUEST'
                });
            }
            // Si c'est un admin, autoriser
            if (req.user.role === 'ADMIN' && req.user.isActive) {
                return next();
            }
            // Sinon, vérifier la propriété
            const resourceId = bodyParam
                ? req.body[resourceParam]
                : req.params[resourceParam];
            if (!resourceId) {
                throw new customErrors_1.ForbiddenError('Identifiant de ressource manquant', {
                    reason: 'MISSING_RESOURCE_ID',
                    param: resourceParam
                });
            }
            if (req.user.id !== resourceId) {
                throw new customErrors_1.ForbiddenError('Accès non autorisé à cette ressource', {
                    reason: 'NOT_OWNER_OR_ADMIN',
                    resourceId,
                    userId: req.user.id
                });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.adminOrOwnerMiddleware = adminOrOwnerMiddleware;
/**
 * Middleware pour les super-admins seulement
 * Utilise un flag spécial ou une vérification supplémentaire
 */
const superAdminMiddleware = (req, res, next) => {
    var _a;
    try {
        if (!req.user) {
            throw new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                reason: 'NO_USER_IN_REQUEST'
            });
        }
        if (req.user.role !== 'ADMIN') {
            throw new customErrors_1.ForbiddenError('Accès réservé aux super-administrateurs', {
                reason: 'NOT_SUPER_ADMIN'
            });
        }
        // Vérification supplémentaire pour super-admin
        // Par exemple, vérifier un email spécifique ou un flag dans la base de données
        const superAdminEmails = ((_a = process.env.SUPER_ADMIN_EMAILS) === null || _a === void 0 ? void 0 : _a.split(',')) || [];
        if (!req.user.email || !superAdminEmails.includes(req.user.email)) {
            throw new customErrors_1.ForbiddenError('Privilèges super-administrateur requis', {
                reason: 'INSUFFICIENT_ADMIN_PRIVILEGES',
                suggestion: 'Cette action nécessite des privilèges super-administrateur'
            });
        }
        logger_1.default.warn(`Action super-admin: ${req.method} ${req.path}`, {
            superAdminId: req.user.id,
            superAdminEmail: req.user.email,
            method: req.method,
            path: req.path
        });
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.superAdminMiddleware = superAdminMiddleware;
/**
 * Middleware pour loguer les actions administratives critiques
 */
const logAdminAction = (actionName) => {
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        // Éviter de logger le body s'il contient des mots de passe
        const safeBody = Object.assign({}, req.body);
        if (safeBody.password)
            delete safeBody.password;
        if (safeBody.currentPassword)
            delete safeBody.currentPassword;
        if (safeBody.newPassword)
            delete safeBody.newPassword;
        if (safeBody.token)
            delete safeBody.token;
        if (safeBody.refreshToken)
            delete safeBody.refreshToken;
        logger_1.default.info(`Action admin critique: ${actionName}`, {
            action: actionName,
            adminId: req.user.id,
            adminEmail: req.user.email,
            method: req.method,
            path: req.path,
            body: safeBody,
            params: req.params,
            query: req.query,
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString()
        });
        next();
    };
};
exports.logAdminAction = logAdminAction;
/**
 * Middleware pour vérifier les permissions spécifiques d'admin
 * Permet de créer des rôles admin avec différents niveaux d'accès
 */
const requireAdminPermission = (...permissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                    reason: 'NO_USER_IN_REQUEST'
                });
            }
            if (req.user.role !== 'ADMIN') {
                throw new customErrors_1.ForbiddenError('Accès réservé aux administrateurs', {
                    reason: 'NOT_ADMIN'
                });
            }
            // NOTE: Cette partie nécessiterait une table de permissions dans votre base de données
            // Pour l'instant, on vérifie juste si c'est un admin
            // Vous pourriez étendre votre modèle User pour inclure un champ "permissions: string[]"
            // Exemple d'implémentation future:
            // const userPermissions = req.user.permissions || [];
            // const hasPermission = permissions.every(p => userPermissions.includes(p));
            // 
            // if (!hasPermission) {
            //   throw new ForbiddenError('Permissions insuffisantes', {
            //     reason: 'MISSING_PERMISSIONS',
            //     required: permissions,
            //     current: userPermissions
            //   });
            // }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireAdminPermission = requireAdminPermission;
/**
 * Middleware pour limiter le taux de requêtes admin
 * Prévient les abus même par les admins
 */
const adminRateLimiter = (maxRequests = 100, windowMs = 60000) => {
    const requests = new Map();
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        const key = `admin_${req.user.id}`;
        const now = Date.now();
        const userRequests = requests.get(key);
        if (!userRequests || now > userRequests.resetTime) {
            // Nouvelle fenêtre
            requests.set(key, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }
        if (userRequests.count >= maxRequests) {
            logger_1.default.warn(`Rate limit dépassé pour admin: ${req.user.id}`, {
                adminId: req.user.id,
                count: userRequests.count,
                maxRequests
            });
            throw new customErrors_1.ForbiddenError('Trop de requêtes', {
                reason: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
            });
        }
        userRequests.count++;
        next();
    };
};
exports.adminRateLimiter = adminRateLimiter;
/**
 * Middleware pour vérifier l'authentification à deux facteurs pour les actions admin sensibles
 */
const require2FAForAdminAction = (req, res, next) => {
    try {
        if (!req.user) {
            throw new customErrors_1.AuthenticationError('Utilisateur non authentifié', {
                reason: 'NO_USER_IN_REQUEST'
            });
        }
        if (req.user.role !== 'ADMIN') {
            throw new customErrors_1.ForbiddenError('Accès réservé aux administrateurs', {
                reason: 'NOT_ADMIN'
            });
        }
        // Vérifier si un code 2FA a été fourni
        const twoFactorCode = req.headers['x-2fa-code'] || req.body.twoFactorCode;
        if (!twoFactorCode) {
            throw new customErrors_1.ForbiddenError('Code d\'authentification à deux facteurs requis', {
                reason: '2FA_REQUIRED',
                suggestion: 'Fournissez un code 2FA valide pour cette action sensible'
            });
        }
        // NOTE: Implémenter la vérification 2FA ici
        // Exemple: vérifier le code OTP dans la base de données
        // const isValid = await verify2FACode(req.user.id, twoFactorCode);
        // if (!isValid) {
        //   throw new ForbiddenError('Code 2FA invalide');
        // }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.require2FAForAdminAction = require2FAForAdminAction;
// Export par défaut
exports.default = {
    adminMiddleware: exports.adminMiddleware,
    adminOrOwnerMiddleware: exports.adminOrOwnerMiddleware,
    superAdminMiddleware: exports.superAdminMiddleware,
    logAdminAction: exports.logAdminAction,
    requireAdminPermission: exports.requireAdminPermission,
    adminRateLimiter: exports.adminRateLimiter,
    require2FAForAdminAction: exports.require2FAForAdminAction
};

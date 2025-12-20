"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const customErrors_1 = require("../errors/customErrors");
const logger_1 = __importDefault(require("../utils/logger"));
class ErrorHandler {
    /**
     * Gestion des erreurs AppError
     */
    static handleAppError(error, req, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        const errorType = error.constructor.name;
        // Log selon le type d'erreur
        if (error.statusCode >= 500) {
            logger_1.default.error(`❌ ${errorType}`, {
                message: error.message,
                code: error.code,
                details: error.details,
                path: req.path,
                method: req.method,
                ip: req.ip,
                stack: error.stack
            });
        }
        else if (error.statusCode >= 400) {
            logger_1.default.warn(`⚠️ ${errorType}`, {
                message: error.message,
                code: error.code,
                details: error.details,
                path: req.path,
                method: req.method,
                ip: req.ip
            });
        }
        // Construction de la réponse
        const response = {
            success: false,
            error: {
                type: errorType,
                message: error.message,
                code: error.code,
                timestamp: error.timestamp,
                statusCode: error.statusCode
            }
        };
        // Ajout de détails spécifiques
        if (error instanceof customErrors_1.AuthenticationError) {
            response.error.reason = (_a = error.details) === null || _a === void 0 ? void 0 : _a.reason;
            response.error.suggestion = (_b = error.details) === null || _b === void 0 ? void 0 : _b.suggestion;
        }
        else if (error instanceof customErrors_1.ValidationError) {
            response.error.fields = ((_c = error.details) === null || _c === void 0 ? void 0 : _c.fields) || [];
        }
        else if (error instanceof customErrors_1.RateLimitError) {
            response.error.rateLimitInfo = error.details;
            // Headers de rate limit
            if ((_d = error.details) === null || _d === void 0 ? void 0 : _d.limit) {
                res.setHeader('RateLimit-Limit', error.details.limit);
            }
            if (((_e = error.details) === null || _e === void 0 ? void 0 : _e.remaining) !== undefined) {
                res.setHeader('RateLimit-Remaining', error.details.remaining);
            }
            if ((_f = error.details) === null || _f === void 0 ? void 0 : _f.resetTime) {
                res.setHeader('RateLimit-Reset', Math.floor(new Date(error.details.resetTime).getTime() / 1000));
            }
        }
        else if (error instanceof customErrors_1.ConflictError) {
            response.error.resource = (_g = error.details) === null || _g === void 0 ? void 0 : _g.resource;
            response.error.conflictingField = (_h = error.details) === null || _h === void 0 ? void 0 : _h.conflictingField;
            response.error.value = (_j = error.details) === null || _j === void 0 ? void 0 : _j.value;
        }
        else if (error instanceof customErrors_1.NotFoundError) {
            response.error.resource = (_k = error.details) === null || _k === void 0 ? void 0 : _k.resource;
            response.error.id = (_l = error.details) === null || _l === void 0 ? void 0 : _l.id;
        }
        else if (error instanceof customErrors_1.DatabaseError) {
            response.error.operation = (_m = error.details) === null || _m === void 0 ? void 0 : _m.operation;
            response.error.entity = (_o = error.details) === null || _o === void 0 ? void 0 : _o.entity;
        }
        else if (error instanceof customErrors_1.ForbiddenError) {
            response.error.reason = (_p = error.details) === null || _p === void 0 ? void 0 : _p.reason;
        }
        // Ajout du requestId si présent
        if ((_q = error.details) === null || _q === void 0 ? void 0 : _q.requestId) {
            response.error.requestId = error.details.requestId;
        }
        // Ajout du requestId de la requête si disponible
        if (req.headers['x-request-id']) {
            response.error.requestId = response.error.requestId || req.headers['x-request-id'];
        }
        // En développement, ajouter la stack trace
        if (process.env.NODE_ENV === 'development') {
            response.error.stack = error.stack;
        }
        return res.status(error.statusCode).json(response);
    }
    /**
     * Gestion des erreurs inconnues
     */
    static handleUnknownError(err, req, res) {
        logger_1.default.error('❌ Unhandled error', {
            name: err.name,
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        const response = {
            success: false,
            error: {
                type: 'InternalServerError',
                message: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
                code: 'INTERNAL_ERROR',
                timestamp: new Date().toISOString(),
                statusCode: 500
            }
        };
        if (process.env.NODE_ENV === 'development') {
            response.error.details = err.message;
            response.error.stack = err.stack;
        }
        return res.status(500).json(response);
    }
}
/**
 * Gestionnaire principal des erreurs
 */
ErrorHandler.handle = (err, req, res, next) => {
    // Gestion des erreurs AppError
    if (err instanceof customErrors_1.AppError) {
        ErrorHandler.handleAppError(err, req, res);
        return;
    }
    // Erreurs standards non gérées
    ErrorHandler.handleUnknownError(err, req, res);
};
/**
 * Initialisation des gestionnaires d'exceptions non gérées
 */
ErrorHandler.initializeUnhandledException = () => {
    process.on('unhandledRejection', (reason) => {
        logger_1.default.error('🔥 Unhandled Rejection', {
            name: reason.name,
            message: reason.message,
            stack: reason.stack
        });
        throw reason;
    });
    process.on('uncaughtException', (err) => {
        logger_1.default.error('💥 Uncaught Exception', {
            name: err.name,
            message: err.message,
            stack: err.stack
        });
        process.exit(1);
    });
};
exports.default = ErrorHandler;
/**
 * Middleware pour les routes non trouvées (404)
 */
const notFoundHandler = (req, res) => {
    logger_1.default.warn('⚠️ Route non trouvée', {
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    res.status(404).json({
        success: false,
        error: {
            type: 'NotFoundError',
            message: `Route ${req.method} ${req.path} non trouvée`,
            code: 'ROUTE_NOT_FOUND',
            timestamp: new Date().toISOString(),
            statusCode: 404
        }
    });
};
exports.notFoundHandler = notFoundHandler;
// Export du gestionnaire principal
exports.errorHandler = ErrorHandler.handle;

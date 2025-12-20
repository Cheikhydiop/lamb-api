"use strict";
// ============================================
// 1. src/errors/customErrors.ts
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.DatabaseError = exports.RateLimitError = exports.NotFoundError = exports.ConflictError = exports.ValidationError = exports.AuthenticationError = void 0;
/**
 * Erreur d'authentification - 401 Unauthorized ou 403 Forbidden
 */
class AuthenticationError extends Error {
    constructor(message, details) {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = (details === null || details === void 0 ? void 0 : details.statusCode) || 401;
        this.code = 'AUTHENTICATION_ERROR';
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Erreur de validation - 400 Bad Request
 */
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.statusCode = 400;
        this.name = 'ValidationError';
        this.code = 'VALIDATION_ERROR';
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ValidationError = ValidationError;
/**
 * Erreur de conflit - 409 Conflict
 */
class ConflictError extends Error {
    constructor(message, resource, value) {
        super(message);
        this.statusCode = 409;
        this.name = 'ConflictError';
        this.code = 'CONFLICT_ERROR';
        this.details = { resource, value };
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ConflictError = ConflictError;
/**
 * Erreur ressource non trouvée - 404 Not Found
 */
class NotFoundError extends Error {
    constructor(resource, identifier) {
        super(`${resource} non trouvé${identifier ? ` (${identifier})` : ''}`);
        this.statusCode = 404;
        this.name = 'NotFoundError';
        this.code = 'NOT_FOUND';
        this.details = { resource, identifier };
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Erreur de rate limiting - 429 Too Many Requests
 */
class RateLimitError extends Error {
    constructor(message, rateLimitInfo) {
        super(message);
        this.statusCode = 429;
        this.name = 'RateLimitError';
        this.code = 'RATE_LIMIT_EXCEEDED';
        this.details = rateLimitInfo;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Erreur de base de données - 500 Internal Server Error
 */
class DatabaseError extends Error {
    constructor(message, operation, resource, requestId, additionalDetails) {
        super(message);
        this.statusCode = 500;
        this.name = 'DatabaseError';
        this.code = 'DATABASE_ERROR';
        this.details = Object.assign({ operation,
            resource,
            requestId }, additionalDetails);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Erreur d'autorisation - 403 Forbidden
 */
class ForbiddenError extends Error {
    constructor(message, details) {
        super(message);
        this.statusCode = 403;
        this.name = 'ForbiddenError';
        this.code = 'FORBIDDEN';
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ForbiddenError = ForbiddenError;

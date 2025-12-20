"use strict";
// ============================================
// src/errors/customErrors.ts - VERSION CORRIGÉE
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.DatabaseError = exports.RateLimitError = exports.NotFoundError = exports.ConflictError = exports.ValidationError = exports.AuthenticationError = exports.AppError = void 0;
/**
 * Classe de base pour toutes les erreurs de l'application
 */
class AppError extends Error {
    constructor(message) {
        super(message);
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Erreur d'authentification - 401 Unauthorized
 */
class AuthenticationError extends AppError {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 401;
        this.code = 'AUTHENTICATION_ERROR';
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Erreur de validation - 400 Bad Request
 */
class ValidationError extends AppError {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 400;
        this.code = 'VALIDATION_ERROR';
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Erreur de conflit - 409 Conflict
 */
class ConflictError extends AppError {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 409;
        this.code = 'CONFLICT_ERROR';
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
/**
 * Erreur ressource non trouvée - 404 Not Found
 */
class NotFoundError extends AppError {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 404;
        this.code = 'NOT_FOUND';
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Erreur de rate limiting - 429 Too Many Requests
 */
class RateLimitError extends AppError {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 429;
        this.code = 'RATE_LIMIT_EXCEEDED';
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Erreur de base de données - 500 Internal Server Error
 */
class DatabaseError extends AppError {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 500;
        this.code = 'DATABASE_ERROR';
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Erreur d'autorisation - 403 Forbidden
 */
class ForbiddenError extends AppError {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 403;
        this.code = 'FORBIDDEN';
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;

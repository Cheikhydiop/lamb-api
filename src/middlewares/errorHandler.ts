import { Request, Response, NextFunction } from 'express';
import { 
  AppError,
  AuthenticationError, 
  ValidationError, 
  DatabaseError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ForbiddenError
} from '../errors/customErrors';
import logger from '../utils/Logger';

export default class ErrorHandler {
  /**
   * Gestionnaire principal des erreurs
   */
  static handle = (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Gestion des erreurs AppError
    if (err instanceof AppError) {
      return ErrorHandler.handleAppError(err, req, res);
    }

    // Erreurs standards non gérées
    return ErrorHandler.handleUnknownError(err, req, res);
  };

  /**
   * Gestion des erreurs AppError
   */
  private static handleAppError(error: AppError, req: Request, res: Response) {
    const errorType = error.constructor.name;

    // Log selon le type d'erreur
    if (error.statusCode >= 500) {
      logger.error(`❌ ${errorType}`, {
        message: error.message,
        code: error.code,
        details: error.details,
        path: req.path,
        method: req.method,
        ip: req.ip,
        stack: error.stack
      });
    } else if (error.statusCode >= 400) {
      logger.warn(`⚠️ ${errorType}`, {
        message: error.message,
        code: error.code,
        details: error.details,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
    }

    // Construction de la réponse
    const response: any = {
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
    if (error instanceof AuthenticationError) {
      response.error.reason = error.details?.reason;
      response.error.suggestion = error.details?.suggestion;
    } 
    else if (error instanceof ValidationError) {
      response.error.fields = error.details?.fields || [];
    } 
    else if (error instanceof RateLimitError) {
      response.error.rateLimitInfo = error.details;
      
      // Headers de rate limit
      if (error.details?.limit) {
        res.setHeader('RateLimit-Limit', error.details.limit);
      }
      if (error.details?.remaining !== undefined) {
        res.setHeader('RateLimit-Remaining', error.details.remaining);
      }
      if (error.details?.resetTime) {
        res.setHeader('RateLimit-Reset', Math.floor(new Date(error.details.resetTime).getTime() / 1000));
      }
    } 
    else if (error instanceof ConflictError) {
      response.error.resource = error.details?.resource;
      response.error.conflictingField = error.details?.conflictingField;
      response.error.value = error.details?.value;
    } 
    else if (error instanceof NotFoundError) {
      response.error.resource = error.details?.resource;
      response.error.id = error.details?.id;
    } 
    else if (error instanceof DatabaseError) {
      response.error.operation = error.details?.operation;
      response.error.entity = error.details?.entity;
    }
    else if (error instanceof ForbiddenError) {
      response.error.reason = error.details?.reason;
    }

    // Ajout du requestId si présent
    if (error.details?.requestId) {
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
  private static handleUnknownError(err: Error, req: Request, res: Response) {
    logger.error('❌ Unhandled error', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    const response: any = {
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

  /**
   * Initialisation des gestionnaires d'exceptions non gérées
   */
  static initializeUnhandledException = () => {
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('🔥 Unhandled Rejection', {
        name: reason.name,
        message: reason.message,
        stack: reason.stack
      });
      throw reason;
    });

    process.on('uncaughtException', (err: Error) => {
      logger.error('💥 Uncaught Exception', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      process.exit(1);
    });
  };
}

/**
 * Middleware pour les routes non trouvées (404)
 */
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('⚠️ Route non trouvée', {
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

// Export du gestionnaire principal
export const errorHandler = ErrorHandler.handle;
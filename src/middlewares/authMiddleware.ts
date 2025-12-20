// middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticationError, ForbiddenError } from '../errors/customErrors';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Déclaration d'interface complète
declare global {
  namespace Express {
    interface Request {
      user?: {
        // Informations de base
        id: string;
        userId: string;
        email: string | null;
        phone: string;
        name: string;
        role: 'BETTOR' | 'ADMIN' | 'SUPER_ADMIN';
        isActive: boolean;
        isEmailVerified: boolean;

        // Informations de session
        sessionId?: string;
        authToken?: string;
        walletId?: string;
        refreshToken?: string;

        // Données du wallet
        wallet?: {
          id: string;
          balance: bigint;
          lockedBalance: bigint;
        } | null;
      };
    }
  }
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Extrait le token JWT depuis les headers
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') return null;

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1] || null;
};

/**
 * Vérifie et décode un token JWT
 */
const verifyAndDecodeToken = (token: string): {
  userId: string;
  email?: string;
  role?: string;
  walletId?: string;
  sessionId?: string;
} => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Validation de base
    if (!decoded || typeof decoded !== 'object') {
      throw new AuthenticationError('Token invalide', {
        reason: 'INVALID_TOKEN_STRUCTURE'
      });
    }

    if (!decoded.userId || typeof decoded.userId !== 'string') {
      throw new AuthenticationError('Token invalide', {
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
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Token invalide', {
        reason: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expiré', {
        reason: 'TOKEN_EXPIRED'
      });
    }
    throw error;
  }
};

/**
 * Récupère l'utilisateur complet depuis la base de données
 */
const fetchUserWithWallet = async (userId: string) => {
  const user = await prisma.user.findUnique({
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
    return {
      ...user,
      wallet: {
        ...user.wallet,
        balance: user.wallet.balance,
        lockedBalance: user.wallet.lockedBalance
      }
    };
  }

  return user;
};

// ==================== MIDDLEWARES PRINCIPAUX ====================

/**
 * Middleware d'authentification principal
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Récupérer le token
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('Token d\'authentification manquant', {
        reason: 'NO_AUTH_TOKEN',
        suggestion: 'Ajoutez un header Authorization: Bearer <token>'
      });
    }

    // Vérifier et décoder le token
    const decoded = verifyAndDecodeToken(token);

    // Récupérer l'utilisateur depuis la base de données
    const user = await fetchUserWithWallet(decoded.userId);

    if (!user) {
      throw new AuthenticationError('Utilisateur non trouvé', {
        reason: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      throw new AuthenticationError('Votre compte est désactivé', {
        reason: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      ...user,
      id: user.id,
      userId: user.id,
      authToken: token,
      walletId: user.wallet?.id
    };

    next();
  } catch (error: any) {
    // Si c'est déjà une erreur personnalisée, la propager
    if (error instanceof AuthenticationError || error instanceof ForbiddenError) {
      next(error);
      return;
    }

    // Pour les autres erreurs JWT
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token invalide ou expiré', {
        reason: 'INVALID_OR_EXPIRED_TOKEN',
        suggestion: 'Veuillez vous reconnecter.'
      }));
      return;
    }

    // Erreur générique
    console.error('Erreur d\'authentification:', error);
    next(new AuthenticationError('Erreur d\'authentification', {
      reason: 'AUTHENTICATION_ERROR',
      originalError: error.message
    }));
  }
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 */
export const requireRole = (...roles: ('BETTOR' | 'ADMIN' | 'SUPER_ADMIN')[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // D'abord vérifier l'authentification
      await requireAuth(req, res, (err?: any) => {
        if (err) return next(err);

        if (!req.user) {
          return next(new AuthenticationError('Utilisateur non authentifié', {
            reason: 'NO_USER_IN_REQUEST'
          }));
        }

        if (!roles.includes(req.user.role)) {
          const rolesString = roles.join(', ');
          return next(new ForbiddenError('Accès non autorisé', {
            requiredRoles: roles,
            userRole: req.user.role,
            reason: 'INSUFFICIENT_PERMISSIONS',
            suggestion: `Rôles requis: ${rolesString}. Votre rôle: ${req.user.role}`
          }));
        }

        next();
      });
    } catch (error: any) {
      next(error);
    }
  };
};

/**
 * Middleware pour les admins seulement
 */
export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN');

/**
 * Middleware pour les parieurs seulement
 */
export const requireBettor = requireRole('BETTOR');

/**
 * Middleware optionnel d'authentification
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    try {
      // Vérifier et décoder le token
      const decoded = verifyAndDecodeToken(token);

      // Récupérer l'utilisateur
      const user = await fetchUserWithWallet(decoded.userId);

      if (user && user.isActive) {
        req.user = {
          ...user,
          id: user.id,
          userId: user.id,
          authToken: token,
          walletId: user.wallet?.id
        };
      }
    } catch (error: any) {
      // Ne pas bloquer si le token est invalide (c'est optionnel)
      console.debug('Optional auth failed:', error?.message || error);
    }

    next();
  } catch (error) {
    // Continuer sans authentification en cas d'erreur
    next();
  }
};

/**
 * Middleware pour vérifier si l'email est vérifié
 */
export const requireEmailVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Utilisateur non authentifié', {
        reason: 'NO_USER_IN_REQUEST'
      });
    }

    if (!req.user.isEmailVerified) {
      throw new ForbiddenError('Email non vérifié', {
        reason: 'EMAIL_NOT_VERIFIED',
        suggestion: 'Veuillez vérifier votre email pour accéder à cette fonctionnalité'
      });
    }

    next();
  } catch (error: any) {
    next(error);
  }
};

/**
 * Middleware pour vérifier les fonds disponibles
 */
export const requireSufficientFunds = (amount: bigint | number, includeLocked: boolean = false) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Utilisateur non authentifié', {
          reason: 'NO_USER_IN_REQUEST'
        });
      }

      if (!req.user.wallet) {
        throw new ForbiddenError('Portefeuille non trouvé', {
          reason: 'WALLET_NOT_FOUND'
        });
      }

      const amountBigInt = typeof amount === 'number' ? BigInt(amount) : amount;
      const availableBalance = includeLocked
        ? req.user.wallet.balance
        : req.user.wallet.balance - req.user.wallet.lockedBalance;

      if (availableBalance < amountBigInt) {
        throw new ForbiddenError('Fonds insuffisants', {
          reason: 'INSUFFICIENT_FUNDS',
          available: availableBalance.toString(),
          required: amountBigInt.toString()
        });
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier la propriété d'une ressource
 */
export const requireOwnership = (
  resourceParam: string = 'userId',
  allowAdmins: boolean = true,
  bodyParam: boolean = false
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await requireAuth(req, res, (err?: any) => {
        if (err) return next(err);

        if (!req.user) {
          throw new AuthenticationError('Utilisateur non authentifié', {
            reason: 'NO_USER_IN_REQUEST'
          });
        }

        // Récupérer l'ID de la ressource
        const resourceId = req.params[resourceParam] ||
          (bodyParam ? req.body[resourceParam] : undefined);

        if (!resourceId || typeof resourceId !== 'string') {
          throw new ForbiddenError('Identifiant de ressource invalide', {
            reason: 'INVALID_RESOURCE_ID',
            param: resourceParam
          });
        }

        // Vérifier la propriété
        const isOwner = req.user.id === resourceId;
        const isAdmin = allowAdmins && req.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
          throw new ForbiddenError('Accès non autorisé à cette ressource', {
            reason: 'NOT_OWNER_OR_ADMIN',
            resourceId,
            userRole: req.user.role,
            required: allowAdmins ? 'OWNER_OR_ADMIN' : 'OWNER_ONLY'
          });
        }

        next();
      });
    } catch (error: any) {
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier la propriété d'un pari
 */
export const requireBetOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await requireAuth(req, res, async (err?: any) => {
      if (err) return next(err);

      if (!req.user) {
        throw new AuthenticationError('Utilisateur non authentifié', {
          reason: 'NO_USER_IN_REQUEST'
        });
      }

      const betId = req.params.betId || req.body.betId;
      if (!betId || typeof betId !== 'string') {
        throw new ForbiddenError('ID du pari requis', {
          reason: 'MISSING_BET_ID'
        });
      }

      const bet = await prisma.bet.findUnique({
        where: { id: betId },
        select: { creatorId: true, acceptorId: true }
      });

      if (!bet) {
        throw new ForbiddenError('Pari non trouvé', {
          reason: 'BET_NOT_FOUND',
          betId
        });
      }

      const isCreator = bet.creatorId === req.user.id;
      const isAcceptor = bet.acceptorId === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isCreator && !isAcceptor && !isAdmin) {
        throw new ForbiddenError('Vous n\'êtes pas autorisé à modifier ce pari', {
          reason: 'NOT_BET_OWNER',
          betId,
          userRole: req.user.role
        });
      }

      next();
    });
  } catch (error: any) {
    next(error);
  }
};

// ==================== GESTIONNAIRE D'ERREURS ====================

/**
 * Middleware de gestion des erreurs d'authentification
 */
export const authErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Si ce n'est pas une erreur d'authentification, passer au prochain middleware
  if (!(error instanceof AuthenticationError) && !(error instanceof ForbiddenError)) {
    return next(error);
  }

  // Déterminer le code de statut HTTP
  const statusCode = error instanceof AuthenticationError ? 401 : 403;

  // Construire la réponse
  const response: any = {
    success: false,
    error: error.message
  };

  // Ajouter des détails si disponibles (sauf en production)
  if (process.env.NODE_ENV !== 'production' && error.details) {
    response.details = error.details;
  }

  res.status(statusCode).json(response);
};

export default {
  requireAuth,
  requireRole,
  requireAdmin,
  requireBettor,
  optionalAuth,
  requireEmailVerified,
  requireSufficientFunds,
  requireOwnership,
  requireBetOwnership,
  authErrorHandler
};
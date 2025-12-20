// src/controllers/UserController.ts
import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { RateLimitError } from '../errors/customErrors';
import { asyncHandler } from '../middlewares/asyncHandler';
import { PrismaClient } from '@prisma/client';
import { EmailVerificationService } from '../services/EmailVerificationService';
import { EmailService } from '../services/EmailService';
import { RateLimitService } from '../services/RateLimitService';
import { SessionRepository } from '../repositories/SessionRepository';
import { LoginAttemptManager } from '../utils/LoginAttemptManager';

// Initialiser Prisma et les services
const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const walletRepository = new WalletRepository(prisma);
const emailService = new EmailService();
const emailVerificationService = new EmailVerificationService(emailService, userRepository);
const sessionRepository = new SessionRepository(prisma);

// Créer l'instance du service avec injection de dépendances
const userService = new UserService(
  userRepository, 
  walletRepository, 
  emailVerificationService,
  sessionRepository 
);

class UserController {
  /**
   * Connexion d'un utilisateur avec rate limiting et gestion de sessions
   * POST /api/users/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    // Vérifier le rate limiting
    const rateLimitCheck = RateLimitService.checkRateLimit(req);
    
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
      throw new RateLimitError(
        'Too many login attempts',
        rateLimitCheck.rateLimitInfo
      );
    }
    
    const loginData = req.body;
    
    // Passer la requête (req) au service
    const result = await userService.login(loginData, req);
    
    // Ajouter les headers de rate limiting (si présents)
    if (rateLimitCheck.rateLimitInfo) {
      const info = rateLimitCheck.rateLimitInfo;
      // S'assurer que les headers sont des strings
      res.setHeader('RateLimit-Remaining', String(info.remaining));
      res.setHeader('RateLimit-Limit', String(info.limit));
      if (info.resetTime instanceof Date) {
        res.setHeader('RateLimit-Reset', String(Math.floor(info.resetTime.getTime() / 1000)));
      }
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
        deviceInfo: result.deviceInfo
      },
      rateLimitInfo: rateLimitCheck.rateLimitInfo ? {
        remaining: rateLimitCheck.rateLimitInfo.remaining,
        limit: rateLimitCheck.rateLimitInfo.limit,
        resetTime: rateLimitCheck.rateLimitInfo.resetTime,
        warning: RateLimitService.isApproachingLimit
          ? RateLimitService.isApproachingLimit(rateLimitCheck.rateLimitInfo)
            ? 'Approaching rate limit'
            : undefined
          : undefined
      } : undefined
    });
  });

  /**
   * Inscription d'un nouvel utilisateur
   * POST /api/users/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    // Vérifier le rate limiting
    const rateLimitCheck = RateLimitService.checkRateLimit(req);
    
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
      throw new RateLimitError(
        'Too many registration attempts',
        rateLimitCheck.rateLimitInfo
      );
    }
    
    const userData = req.body;
    
    const result = await userService.register(userData, req);
    
    // Ajouter les headers de rate limiting à la réponse
    if (rateLimitCheck.rateLimitInfo) {
      const info = rateLimitCheck.rateLimitInfo;
      res.setHeader('RateLimit-Remaining', String(info.remaining));
      res.setHeader('RateLimit-Limit', String(info.limit));
      if (info.resetTime instanceof Date) {
        res.setHeader('RateLimit-Reset', String(Math.floor(info.resetTime.getTime() / 1000)));
      }
    }
  
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        wallet: result.wallet,
        token: result.token,
        deviceInfo: result.deviceInfo
      },
      rateLimitInfo: rateLimitCheck.rateLimitInfo ? {
        remaining: rateLimitCheck.rateLimitInfo.remaining,
        limit: rateLimitCheck.rateLimitInfo.limit,
        resetTime: rateLimitCheck.rateLimitInfo.resetTime
      } : undefined
    });
  });

  /**
   * Vérification d'email avec OTP
   * POST /api/users/verify-email
   */
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    // Vérifier le rate limiting
    const rateLimitCheck = RateLimitService.checkRateLimit(req);
    
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
      throw new RateLimitError(
        'Too many verification attempts',
        rateLimitCheck.rateLimitInfo
      );
    }
    
    const { userId, otpCode } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!otpCode) {
      return res.status(400).json({
        success: false,
        message: 'OTP code is required'
      });
    }
    
    // Passer la requête (req) au service
    const result = await userService.verifyEmail(userId, otpCode, req);
    
    // Ajouter les headers de rate limiting
    if (rateLimitCheck.rateLimitInfo) {
      const info = rateLimitCheck.rateLimitInfo;
      const remaining = typeof info.remaining === 'number' ? info.remaining : undefined;
      if (remaining !== undefined) {
        res.setHeader('RateLimit-Remaining', String(Math.max(0, remaining - 1)));
      }
      if (info.limit !== undefined) {
        res.setHeader('RateLimit-Limit', String(info.limit));
      }
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        user: result.user
      },
      rateLimitInfo: rateLimitCheck.rateLimitInfo ? {
        remaining: typeof rateLimitCheck.rateLimitInfo.remaining === 'number'
          ? Math.max(0, rateLimitCheck.rateLimitInfo.remaining - 1)
          : undefined,
        limit: rateLimitCheck.rateLimitInfo.limit
      } : undefined
    });
  });

  // Les autres routes/commentaires laissent la logique existante intacte
}

export default UserController;
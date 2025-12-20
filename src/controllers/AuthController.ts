import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { EmailVerificationService } from '../services/EmailVerificationService';
import { EmailService } from '../services/EmailService';
import { OtpCodeRepository } from '../repositories/OtpCodeRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import {
  RateLimitError,
  ValidationError,
  NotFoundError
} from '../errors/customErrors';
import { asyncHandler } from '../middlewares/asyncHandler';
import { PrismaClient } from '@prisma/client';
import { RateLimitService } from '../services/RateLimitService';
import { LoginAttemptManager } from '../utils/LoginAttemptManager';
import { ServiceContainer } from '../container/ServiceContainer';
import { generateToken } from '../utils/tokenUtils';
import logger from '../utils/logger';


class AuthController {
  private static get services() {
    return ServiceContainer.getInstance();
  }
  /**
   * POST /api/auth/login
   * Connexion d'un utilisateur
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const clientIp = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');

    // Vérifier si l'IP est bloquée pour trop de tentatives
    if (LoginAttemptManager.isBlocked(clientIp)) {
      const status = LoginAttemptManager.getAttemptStatus(clientIp);
      throw new RateLimitError(
        'Trop de tentatives de connexion échouées. Veuillez réessayer plus tard.',
        {
          limit: 200,
          remaining: 0,
          resetTime: new Date(Date.now() + (status?.timeUntilReset || 10000))
        }
      );
    }

    // Vérifier la limite de taux générale
    const rateLimitCheck = RateLimitService.checkRateLimit(req);

    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
      throw new RateLimitError(
        'Trop de tentatives de connexion',
        rateLimitCheck.rateLimitInfo
      );
    }

    const loginData = req.body;

    try {
      const result = await AuthController.services.authService.login(loginData, req);

      // Réinitialiser les tentatives échouées en cas de succès
      LoginAttemptManager.clearFailedAttempts(clientIp);

      // Ajouter les headers de rate limit
      if (rateLimitCheck.rateLimitInfo) {
        res.setHeader('RateLimit-Remaining', rateLimitCheck.rateLimitInfo.remaining);
        res.setHeader('RateLimit-Limit', rateLimitCheck.rateLimitInfo.limit);
        res.setHeader('RateLimit-Reset',
          Math.floor(rateLimitCheck.rateLimitInfo.resetTime.getTime() / 1000)
        );
      }

      const authResult = result as any;

      res.status(200).json({
        success: true,
        message: authResult.message,
        data: {
          user: authResult.user,
          token: authResult.token || (authResult.user ? generateToken({
            userId: authResult.user.id,
            role: authResult.user.role || 'BETTOR',
            email: authResult.user.email || '',
            walletId: '' // Avoid undefined error
          }) : ''),
          refreshToken: authResult.refreshToken,
          sessionId: authResult.sessionId,
          deviceInfo: authResult.deviceInfo,
          requiresDeviceVerification: authResult.requiresDeviceVerification,
          existingSessions: authResult.existingSessions
        }
      });

    } catch (error: any) {
      logger.error('❌ Échec de connexion dans le contrôleur', {
        email: loginData.email,
        errorType: error.constructor.name,
        errorMessage: error.message,
        clientIp
      });

      // Enregistrer la tentative échouée
      const attemptInfo = LoginAttemptManager.recordFailedAttempt(clientIp);

      // Ajouter les headers des tentatives de connexion SEULEMENT si la réponse n'a pas encore été envoyée
      if (!res.headersSent) {
        res.setHeader('X-Login-Attempts-Remaining', attemptInfo.remaining);
        res.setHeader('X-Login-Attempts-Limit', 200);
        res.setHeader('X-Login-Attempts-Reset', Math.floor(attemptInfo.resetTime.getTime() / 1000));
      }

      // Si bloqué, lancer une RateLimitError
      if (attemptInfo.isBlocked) {
        throw new RateLimitError(
          'Trop de tentatives de connexion échouées. Veuillez réessayer plus tard.',
          {
            limit: 200,
            remaining: 0,
            resetTime: attemptInfo.resetTime
          }
        );
      }

      // Propager l'erreur originale
      throw error;
    }
  });

  /**
   * POST /api/auth/register
   * Inscription d'un nouvel utilisateur
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const rateLimitCheck = RateLimitService.checkRateLimit(req);

    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
      throw new RateLimitError(
        'Trop de tentatives d\'inscription',
        rateLimitCheck.rateLimitInfo
      );
    }

    const userData = req.body;

    const result = await AuthController.services.authService.register(userData, req);

    // Ajouter les headers de rate limit
    if (rateLimitCheck.rateLimitInfo) {
      res.setHeader('RateLimit-Remaining', rateLimitCheck.rateLimitInfo.remaining);
      res.setHeader('RateLimit-Limit', rateLimitCheck.rateLimitInfo.limit);
      res.setHeader('RateLimit-Reset',
        Math.floor(rateLimitCheck.rateLimitInfo.resetTime.getTime() / 1000)
      );
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        wallet: result.wallet,
        token: result.token,
        deviceInfo: result.deviceInfo
      }
    });
  });

  /**
   * POST /api/auth/verify-email
   * Vérification de l'email
   */
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const rateLimitCheck = RateLimitService.checkRateLimit(req);

    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
      throw new RateLimitError(
        'Trop de tentatives de vérification',
        rateLimitCheck.rateLimitInfo
      );
    }

    const { userId, otpCode } = req.body;

    // Validation des données
    const validationErrors: string[] = [];
    if (!userId) validationErrors.push('L\'identifiant utilisateur est requis');
    if (!otpCode) validationErrors.push('Le code OTP est requis');

    if (validationErrors.length > 0) {
      throw new ValidationError(
        'Données de vérification incomplètes',
        validationErrors.map(msg => ({
          field: 'general',
          message: msg,
          constraint: 'required'
        }))
      );
    }

    const result = await AuthController.services.authService.verifyEmail(userId, otpCode, req);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        user: result.user
      }
    });
  });

  /**
   * POST /api/auth/logout
   * Déconnexion d'un utilisateur
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const userId = (req as any).user?.userId;

    if (!sessionId) {
      throw new ValidationError('Session ID est requis', [
        { field: 'sessionId', message: 'Session ID est requis', constraint: 'required' }
      ]);
    }

    await AuthController.services.authService.logout(userId, sessionId);

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  });

  /**
   * POST /api/auth/refresh-token
   * Rafraîchissement du token
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token est requis', [
        { field: 'refreshToken', message: 'Refresh token est requis', constraint: 'required' }
      ]);
    }

    const result = await AuthController.services.authService.refreshToken(refreshToken, req);

    res.status(200).json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        token: result.token,
        refreshToken: result.refreshToken
      }
    });
  });

  /**
   * POST /api/auth/forgot-password
   * Demande de réinitialisation de mot de passe
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const rateLimitCheck = RateLimitService.checkRateLimit(req);

    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
      throw new RateLimitError(
        'Trop de demandes de réinitialisation',
        rateLimitCheck.rateLimitInfo
      );
    }

    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email est requis', [
        { field: 'email', message: 'Email est requis', constraint: 'required' }
      ]);
    }

    const result = await AuthController.services.authService.forgotPassword({ email }, req);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  /**
   * POST /api/auth/reset-password
   * Réinitialisation du mot de passe
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const rateLimitCheck = RateLimitService.checkRateLimit(req);

    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
      throw new RateLimitError(
        'Trop de tentatives de réinitialisation',
        rateLimitCheck.rateLimitInfo
      );
    }

    const { token, newPassword } = req.body;

    // Validation des données
    const validationErrors: string[] = [];
    if (!token) validationErrors.push('Le token de réinitialisation est requis');
    if (!newPassword) validationErrors.push('Le nouveau mot de passe est requis');
    if (newPassword && newPassword.length < 6) {
      validationErrors.push('Le mot de passe doit contenir au moins 6 caractères');
    }

    if (validationErrors.length > 0) {
      throw new ValidationError(
        'Données de réinitialisation invalides',
        validationErrors.map(msg => ({
          field: 'general',
          message: msg,
          constraint: 'required'
        }))
      );
    }

    const result = await AuthController.services.authService.resetPassword({ token, newPassword }, req);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  /**
   * POST /api/auth/change-password
   * Changement de mot de passe (utilisateur connecté)
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      throw new ValidationError('Utilisateur non authentifié', [
        { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
      ]);
    }

    // Validation des données
    const validationErrors: string[] = [];
    if (!currentPassword) validationErrors.push('Le mot de passe actuel est requis');
    if (!newPassword) validationErrors.push('Le nouveau mot de passe est requis');
    if (newPassword && newPassword.length < 6) {
      validationErrors.push('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }
    if (currentPassword === newPassword) {
      validationErrors.push('Le nouveau mot de passe doit être différent de l\'actuel');
    }

    if (validationErrors.length > 0) {
      throw new ValidationError(
        'Données de changement de mot de passe invalides',
        validationErrors.map(msg => ({
          field: 'general',
          message: msg,
          constraint: 'validation'
        }))
      );
    }

    const result = await AuthController.services.authService.changePassword(userId, { currentPassword, newPassword }, req);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  /**
   * PUT /api/auth/profile
   * Mise à jour du profil utilisateur
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { name, phone } = req.body;

    if (!userId) {
      throw new ValidationError('Utilisateur non authentifié', [
        { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
      ]);
    }

    // Validation des données
    const updateData: any = {};
    const validationErrors: string[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        validationErrors.push('Le nom doit être une chaîne non vide');
      } else {
        updateData.name = name.trim();
      }
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.trim().length === 0) {
        validationErrors.push('Le numéro de téléphone doit être une chaîne non vide');
      } else {
        updateData.phone = phone.trim();
      }
    }

    if (validationErrors.length > 0) {
      throw new ValidationError(
        'Données de profil invalides',
        validationErrors.map(msg => ({
          field: 'general',
          message: msg,
          constraint: 'validation'
        }))
      );
    }

    // Vérifier qu'au moins un champ est fourni
    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('Aucune donnée à mettre à jour', [
        { field: 'general', message: 'Fournissez au moins un champ à mettre à jour', constraint: 'required' }
      ]);
    }

    const result = await AuthController.services.authService.updateProfile(userId, updateData, req);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        user: result.user
      }
    });
  });

  /**
   * GET /api/auth/profile
   * Récupération du profil utilisateur
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new ValidationError('Utilisateur non authentifié', [
        { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
      ]);
    }

    const user = await AuthController.services.authService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  });

  /**
   * POST /api/auth/deactivate
   * Désactivation du compte utilisateur
   */
  static deactivateAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { reason } = req.body;

    if (!userId) {
      throw new ValidationError('Utilisateur non authentifié', [
        { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
      ]);
    }

    const result = await AuthController.services.authService.deactivateAccount(userId, { reason }, req);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  /**
   * POST /api/auth/reactivate
   * Réactivation du compte utilisateur
   */
  static reactivateAccount = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validation des données
    const validationErrors: string[] = [];
    if (!email) validationErrors.push('Email est requis');
    if (!password) validationErrors.push('Mot de passe est requis');

    if (validationErrors.length > 0) {
      throw new ValidationError(
        'Données de réactivation incomplètes',
        validationErrors.map(msg => ({
          field: 'general',
          message: msg,
          constraint: 'required'
        }))
      );
    }

    const result = await AuthController.services.authService.reactivateAccount(email, password, req);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        token: result.token
      }
    });
  });

  /**
   * GET /api/auth/sessions
   * Récupération des sessions actives de l'utilisateur
   */
  static getSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new ValidationError('Utilisateur non authentifié', [
        { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
      ]);
    }

    const sessions = await AuthController.services.authService.getUserSessions(userId);

    res.status(200).json({
      success: true,
      data: {
        sessions
      }
    });
  });

  /**
   * DELETE /api/auth/sessions/:sessionId
   * Révocation d'une session spécifique
   */
  static revokeSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { sessionId } = req.params;

    if (!userId) {
      throw new ValidationError('Utilisateur non authentifié', [
        { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
      ]);
    }

    if (!sessionId) {
      throw new ValidationError('Session ID est requis', [
        { field: 'sessionId', message: 'Session ID est requis', constraint: 'required' }
      ]);
    }

    await AuthController.services.authService.revokeSession(userId, sessionId);

    res.status(200).json({
      success: true,
      message: 'Session révoquée avec succès'
    });
  });

  /**
   * DELETE /api/auth/sessions
   * Révocation de toutes les sessions (sauf la session actuelle)
   */
  static revokeAllSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const currentSessionId = (req as any).user?.sessionId;

    if (!userId) {
      throw new ValidationError('Utilisateur non authentifié', [
        { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
      ]);
    }

    // Récupérer toutes les sessions
    const sessions = await AuthController.services.authService.getUserSessions(userId);

    // Révoquer toutes les sessions sauf la session actuelle
    const sessionsToRevoke = sessions.filter(session => session.id !== currentSessionId);

    for (const session of sessionsToRevoke) {
      await AuthController.services.authService.revokeSession(userId, session.id);
    }

    res.status(200).json({
      success: true,
      message: `${sessionsToRevoke.length} session(s) révoquée(s) avec succès`,
      data: {
        revokedCount: sessionsToRevoke.length,
        currentSessionActive: true
      }
    });
  });

  /**
   * POST /api/auth/resend-verification
   * Renvoyer le code de vérification email
   */
  static resendVerificationCode = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
      throw new ValidationError('L\'identifiant utilisateur est requis', [
        { field: 'userId', message: 'L\'identifiant utilisateur est requis', constraint: 'required' }
      ]);
    }

    // Récupérer l'utilisateur
    const user = await AuthController.services.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    // Renvoyer l'email de vérification
    const emailVerificationService = AuthController.services.emailVerificationService;
    await emailVerificationService.sendVerificationEmail(user.id, user.email!);

    res.status(200).json({
      success: true,
      message: 'Code de vérification renvoyé avec succès'
    });
  });

  /**
   * POST /api/auth/verify-device
   * Vérifier le code OTP pour un nouvel appareil
   */
  static verifyDevice = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, otpCode } = req.body;

    if (!sessionId || !otpCode) {
      throw new ValidationError('Session ID et code OTP requis', [
        { field: 'sessionId', message: 'Session ID requis', constraint: 'required' },
        { field: 'otpCode', message: 'Code OTP requis', constraint: 'required' }
      ]);
    }

    // Importer le service
    // const { MultiDeviceAuthService } = await import('../services/MultiDeviceAuthService');
    const multiDeviceService = AuthController.services.multiDeviceAuthService;

    const result = await multiDeviceService.verifyDeviceOTP(sessionId, otpCode);

    if (!result.success) {
      throw new ValidationError('Code invalide ou expiré', [
        { field: 'otpCode', message: 'Code invalide ou expiré', constraint: 'invalid' }
      ]);
    }

    // Récupérer le rôle réel de l'utilisateur
    const userRole = await AuthController.services.prisma.user.findUnique({
      where: { id: result.session!.userId },
      select: { role: true }
    });

    // Générer les tokens
    const token = generateToken({
      userId: result.session!.userId,
      role: userRole?.role || 'BETTOR',
      email: '',
      walletId: ''
    });

    res.status(200).json({
      success: true,
      message: 'Appareil vérifié avec succès',
      data: {
        token,
        refreshToken: result.session!.refreshToken,
        sessionId: result.session!.id
      }
    });
  });

  /**
   * POST /api/auth/resend-device-otp
   * Renvoyer le code OTP pour vérification d'appareil
   */
  static resendDeviceOTP = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body;

    if (!sessionId) {
      throw new ValidationError('Session ID requis', [
        { field: 'sessionId', message: 'Session ID requis', constraint: 'required' }
      ]);
    }

    const multiDeviceService = AuthController.services.multiDeviceAuthService;

    const result = await multiDeviceService.resendDeviceOTP(sessionId);

    if (!result.success) {
      throw new ValidationError(result.error || 'Impossible de renvoyer le code', [
        { field: 'sessionId', message: result.error || 'Session invalide', constraint: 'invalid' }
      ]);
    }

    res.status(200).json({
      success: true,
      message: 'Code renvoyé avec succès'
    });
  });
}

export default AuthController;

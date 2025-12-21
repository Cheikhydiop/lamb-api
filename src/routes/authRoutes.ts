import express from 'express';
import AuthController from '../controllers/AuthController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';
import { rateLimitMiddleware, rateLimitConfigs } from '../middlewares/rateLimitMiddleware';
import { ServiceContainer } from '../container/ServiceContainer';
import { asyncHandler } from '../middlewares/asyncHandler';

export const createAuthRoutes = () => {
  const router = express.Router();
  const { auditMiddleware } = ServiceContainer.getInstance();

  // ==================== ROUTES PUBLIQUES ====================

  // ==================== ROUTES PUBLIQUES ====================

  /**
   * @swagger
   * tags:
   *   name: Auth
   *   description: Authentication management
   */

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - name
   *               - phone
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 6
   *               name:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       201:
   *         description: User successfully registered
   *       400:
   *         description: Validation error
   */
  // Inscription
  router.post(
    '/register',
    rateLimitMiddleware(rateLimitConfigs.register),
    auditMiddleware.auditUserRegister(),
    asyncHandler(AuthController.register)
  );

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                 refreshToken:
   *                   type: string
   *                 user:
   *                   type: object
   *       401:
   *         description: Invalid credentials
   */
  // Connexion
  router.post(
    '/login',
    rateLimitMiddleware(rateLimitConfigs.login),
    auditMiddleware.auditUserLogin(),
    auditMiddleware.auditFailedLogin(),
    asyncHandler(AuthController.login)
  );

  /**
   * @swagger
   * /api/auth/verify-email:
   *   post:
   *     summary: Verify email address
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *     responses:
   *       200:
   *         description: Email verified successfully
   *       400:
   *         description: Invalid or expired token
   */
  // Vérification email
  router.post(
    '/verify-email',
    rateLimitMiddleware(rateLimitConfigs.verifyEmail),
    asyncHandler(AuthController.verifyEmail)
  );

  // Renvoyer code de vérification
  router.post(
    '/resend-verification',
    rateLimitMiddleware(rateLimitConfigs.verifyEmail),
    asyncHandler(AuthController.resendVerificationCode)
  );

  // Vérifier appareil (multi-device)
  router.post(
    '/verify-device',
    rateLimitMiddleware(rateLimitConfigs.verifyEmail),
    asyncHandler(AuthController.verifyDevice)
  );

  // Renvoyer code OTP appareil
  router.post(
    '/resend-device-otp',
    rateLimitMiddleware(rateLimitConfigs.verifyEmail),
    asyncHandler(AuthController.resendDeviceOTP)
  );

  // Rafraîchissement token
  router.post(
    '/refresh-token',
    asyncHandler(AuthController.refreshToken)
  );

  // Mot de passe oublié
  router.post(
    '/forgot-password',
    rateLimitMiddleware(rateLimitConfigs.forgotPassword),
    asyncHandler(AuthController.forgotPassword)
  );

  // Réinitialisation mot de passe
  router.post(
    '/reset-password',
    rateLimitMiddleware(rateLimitConfigs.resetPassword),
    asyncHandler(AuthController.resetPassword)
  );

  // Réactivation compte
  router.post(
    '/reactivate',
    asyncHandler(AuthController.reactivateAccount)
  );

  // ==================== ROUTES PROTÉGÉES ====================

  // Déconnexion
  router.post(
    '/logout',
    requireAuth,
    asyncHandler(AuthController.logout)
  );

  // Mise à jour profil
  router.put(
    '/profile',
    requireAuth,
    asyncHandler(AuthController.updateProfile)
  );

  // Récupération profil
  router.get(
    '/profile',
    requireAuth,
    asyncHandler(AuthController.getProfile)
  );

  // Changement mot de passe
  router.post(
    '/change-password',
    requireAuth,
    auditMiddleware.auditPasswordChange(),
    asyncHandler(AuthController.changePassword)
  );

  // Désactivation compte
  router.post(
    '/deactivate',
    requireAuth,
    asyncHandler(AuthController.deactivateAccount)
  );

  // Liste sessions
  router.get(
    '/sessions',
    requireAuth,
    asyncHandler(AuthController.getSessions)
  );

  // Révocation session spécifique
  router.delete(
    '/sessions/:sessionId',
    requireAuth,
    asyncHandler(AuthController.revokeSession)
  );

  // Révocation toutes les sessions
  router.delete(
    '/sessions',
    requireAuth,
    asyncHandler(AuthController.revokeAllSessions)
  );

  // ==================== ROUTES ADMIN ====================

  // Routes admin seulement
  router.get(
    '/admin/users',
    requireRole('ADMIN'),
    asyncHandler(AuthController.getProfile) // À remplacer par une vraie méthode admin
  );

  // ==================== ROUTES DE TEST ====================

  // Route de test pour le rate limiting (développement uniquement)
  if (process.env.NODE_ENV === 'development') {
    router.get('/rate-limit-test', (req, res) => {
      const rateLimitInfo = (req as any).rateLimitInfo;

      res.json({
        success: true,
        message: 'Rate limit test',
        data: {
          clientIp: req.ip,
          rateLimitInfo: rateLimitInfo || 'No rate limit info',
          headers: {
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'user-agent': req.headers['user-agent']
          }
        }
      });
    });

    // Route de test d'authentification
    router.get('/auth-test', requireAuth, (req, res) => {
      res.json({
        success: true,
        message: 'Authentification réussie',
        data: {
          user: req.user
        }
      });
    });

    // Route de test de rôle admin
    router.get('/admin-test', requireRole('ADMIN'), (req, res) => {
      res.json({
        success: true,
        message: 'Accès admin autorisé',
        data: {
          user: req.user
        }
      });
    });
  }

  return router;
};
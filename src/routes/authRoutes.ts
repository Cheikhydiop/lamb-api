import express from 'express';
import { Container } from 'typedi';
import AuthController from '../controllers/AuthController';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/authMiddleware';
import { rateLimitMiddleware, rateLimitConfigs } from '../middlewares/rateLimitMiddleware';
import { AuditMiddleware } from '../middlewares/AuditMiddleware';

const router = express.Router();
const auditMiddleware = Container.get(AuditMiddleware);

// ==================== ROUTES PUBLIQUES ====================

// Inscription
router.post(
  '/register',
  rateLimitMiddleware(rateLimitConfigs.register),
  auditMiddleware.auditUserRegister(),
  AuthController.register
);

// Connexion
router.post(
  '/login',
  rateLimitMiddleware(rateLimitConfigs.login),
  auditMiddleware.auditUserLogin(),
  auditMiddleware.auditFailedLogin(),
  AuthController.login
);

// Vérification email
router.post(
  '/verify-email',
  rateLimitMiddleware(rateLimitConfigs.verifyEmail),
  AuthController.verifyEmail
);

// Renvoyer code de vérification
router.post(
  '/resend-verification',
  rateLimitMiddleware(rateLimitConfigs.verifyEmail),
  AuthController.resendVerificationCode
);

// Vérifier appareil (multi-device)
router.post(
  '/verify-device',
  rateLimitMiddleware(rateLimitConfigs.verifyEmail),
  AuthController.verifyDevice
);

// Renvoyer code OTP appareil
router.post(
  '/resend-device-otp',
  rateLimitMiddleware(rateLimitConfigs.verifyEmail),
  AuthController.resendDeviceOTP
);

// Rafraîchissement token
router.post(
  '/refresh-token',
  AuthController.refreshToken
);

// Mot de passe oublié
router.post(
  '/forgot-password',
  rateLimitMiddleware(rateLimitConfigs.forgotPassword),
  AuthController.forgotPassword
);

// Réinitialisation mot de passe
router.post(
  '/reset-password',
  rateLimitMiddleware(rateLimitConfigs.resetPassword),
  AuthController.resetPassword
);

// Réactivation compte
router.post(
  '/reactivate',
  AuthController.reactivateAccount
);

// ==================== ROUTES PROTÉGÉES ====================

// Déconnexion
router.post(
  '/logout',
  requireAuth,
  AuthController.logout
);

// Mise à jour profil
router.put(
  '/profile',
  requireAuth,
  AuthController.updateProfile
);

// Récupération profil
router.get(
  '/profile',
  requireAuth,
  AuthController.getProfile
);

// Changement mot de passe
router.post(
  '/change-password',
  requireAuth,
  auditMiddleware.auditPasswordChange(),
  AuthController.changePassword
);

// Désactivation compte
router.post(
  '/deactivate',
  requireAuth,
  AuthController.deactivateAccount
);

// Liste sessions
router.get(
  '/sessions',
  requireAuth,
  AuthController.getSessions
);

// Révocation session spécifique
router.delete(
  '/sessions/:sessionId',
  requireAuth,
  AuthController.revokeSession
);

// Révocation toutes les sessions
router.delete(
  '/sessions',
  requireAuth,
  AuthController.revokeAllSessions
);

// ==================== ROUTES ADMIN ====================

// Routes admin seulement
router.get(
  '/admin/users',
  requireRole('ADMIN'),
  AuthController.getProfile // À remplacer par une vraie méthode admin
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

export default router;
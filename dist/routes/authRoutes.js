"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const typedi_1 = require("typedi");
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rateLimitMiddleware_1 = require("../middlewares/rateLimitMiddleware");
const AuditMiddleware_1 = require("../middlewares/AuditMiddleware");
const router = express_1.default.Router();
const auditMiddleware = typedi_1.Container.get(AuditMiddleware_1.AuditMiddleware);
// ==================== ROUTES PUBLIQUES ====================
// Inscription
router.post('/register', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.register), auditMiddleware.auditUserRegister(), AuthController_1.default.register);
// Connexion
router.post('/login', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.login), auditMiddleware.auditUserLogin(), auditMiddleware.auditFailedLogin(), AuthController_1.default.login);
// Vérification email
router.post('/verify-email', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.verifyEmail), AuthController_1.default.verifyEmail);
// Renvoyer code de vérification
router.post('/resend-verification', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.verifyEmail), AuthController_1.default.resendVerificationCode);
// Vérifier appareil (multi-device)
router.post('/verify-device', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.verifyEmail), AuthController_1.default.verifyDevice);
// Renvoyer code OTP appareil
router.post('/resend-device-otp', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.verifyEmail), AuthController_1.default.resendDeviceOTP);
// Rafraîchissement token
router.post('/refresh-token', AuthController_1.default.refreshToken);
// Mot de passe oublié
router.post('/forgot-password', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.forgotPassword), AuthController_1.default.forgotPassword);
// Réinitialisation mot de passe
router.post('/reset-password', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.resetPassword), AuthController_1.default.resetPassword);
// Réactivation compte
router.post('/reactivate', AuthController_1.default.reactivateAccount);
// ==================== ROUTES PROTÉGÉES ====================
// Déconnexion
router.post('/logout', authMiddleware_1.requireAuth, AuthController_1.default.logout);
// Mise à jour profil
router.put('/profile', authMiddleware_1.requireAuth, AuthController_1.default.updateProfile);
// Récupération profil
router.get('/profile', authMiddleware_1.requireAuth, AuthController_1.default.getProfile);
// Changement mot de passe
router.post('/change-password', authMiddleware_1.requireAuth, auditMiddleware.auditPasswordChange(), AuthController_1.default.changePassword);
// Désactivation compte
router.post('/deactivate', authMiddleware_1.requireAuth, AuthController_1.default.deactivateAccount);
// Liste sessions
router.get('/sessions', authMiddleware_1.requireAuth, AuthController_1.default.getSessions);
// Révocation session spécifique
router.delete('/sessions/:sessionId', authMiddleware_1.requireAuth, AuthController_1.default.revokeSession);
// Révocation toutes les sessions
router.delete('/sessions', authMiddleware_1.requireAuth, AuthController_1.default.revokeAllSessions);
// ==================== ROUTES ADMIN ====================
// Routes admin seulement
router.get('/admin/users', (0, authMiddleware_1.requireRole)('ADMIN'), AuthController_1.default.getProfile // À remplacer par une vraie méthode admin
);
// ==================== ROUTES DE TEST ====================
// Route de test pour le rate limiting (développement uniquement)
if (process.env.NODE_ENV === 'development') {
    router.get('/rate-limit-test', (req, res) => {
        const rateLimitInfo = req.rateLimitInfo;
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
    router.get('/auth-test', authMiddleware_1.requireAuth, (req, res) => {
        res.json({
            success: true,
            message: 'Authentification réussie',
            data: {
                user: req.user
            }
        });
    });
    // Route de test de rôle admin
    router.get('/admin-test', (0, authMiddleware_1.requireRole)('ADMIN'), (req, res) => {
        res.json({
            success: true,
            message: 'Accès admin autorisé',
            data: {
                user: req.user
            }
        });
    });
}
exports.default = router;

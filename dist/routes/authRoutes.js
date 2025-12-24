"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rateLimitMiddleware_1 = require("../middlewares/rateLimitMiddleware");
const ServiceContainer_1 = require("../container/ServiceContainer");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const createAuthRoutes = () => {
    const router = express_1.default.Router();
    const { auditMiddleware } = ServiceContainer_1.ServiceContainer.getInstance();
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
    router.post('/register', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.register), auditMiddleware.auditUserRegister(), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.register));
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
    router.post('/login', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.login), auditMiddleware.auditUserLogin(), auditMiddleware.auditFailedLogin(), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.login));
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
    router.post('/verify-email', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.verifyEmail), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.verifyEmail));
    // Renvoyer code de vérification
    router.post('/resend-verification', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.verifyEmail), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.resendVerificationCode));
    // Vérifier appareil (multi-device)
    router.post('/verify-device', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.verifyEmail), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.verifyDevice));
    // Renvoyer code OTP appareil
    router.post('/resend-device-otp', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.verifyEmail), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.resendDeviceOTP));
    // Rafraîchissement token
    router.post('/refresh-token', (0, asyncHandler_1.asyncHandler)(AuthController_1.default.refreshToken));
    // Mot de passe oublié
    router.post('/forgot-password', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.forgotPassword), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.forgotPassword));
    // Réinitialisation mot de passe
    router.post('/reset-password', (0, rateLimitMiddleware_1.rateLimitMiddleware)(rateLimitMiddleware_1.rateLimitConfigs.resetPassword), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.resetPassword));
    // Réactivation compte
    router.post('/reactivate', (0, asyncHandler_1.asyncHandler)(AuthController_1.default.reactivateAccount));
    // ==================== ROUTES PROTÉGÉES ====================
    // Déconnexion
    router.post('/logout', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(AuthController_1.default.logout));
    // Mise à jour profil
    router.put('/profile', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(AuthController_1.default.updateProfile));
    // Récupération profil
    router.get('/profile', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(AuthController_1.default.getProfile));
    // Changement mot de passe
    router.post('/change-password', authMiddleware_1.requireAuth, auditMiddleware.auditPasswordChange(), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.changePassword));
    // Désactivation compte
    router.post('/deactivate', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(AuthController_1.default.deactivateAccount));
    // Liste sessions
    router.get('/sessions', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(AuthController_1.default.getSessions));
    // Révocation session spécifique
    router.delete('/sessions/:sessionId', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(AuthController_1.default.revokeSession));
    // Révocation toutes les sessions
    router.delete('/sessions', authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(AuthController_1.default.revokeAllSessions));
    // ==================== ROUTES ADMIN ====================
    // Routes admin seulement
    router.get('/admin/users', (0, authMiddleware_1.requireRole)('ADMIN'), (0, asyncHandler_1.asyncHandler)(AuthController_1.default.getProfile) // À remplacer par une vraie méthode admin
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
    return router;
};
exports.createAuthRoutes = createAuthRoutes;

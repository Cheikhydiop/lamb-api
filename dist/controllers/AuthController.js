"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const customErrors_1 = require("../errors/customErrors");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const RateLimitService_1 = require("../services/RateLimitService");
const LoginAttemptManager_1 = require("../utils/LoginAttemptManager");
const ServiceContainer_1 = require("../container/ServiceContainer");
const tokenUtils_1 = require("../utils/tokenUtils");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthController {
    static get services() {
        return ServiceContainer_1.ServiceContainer.getInstance();
    }
}
_a = AuthController;
/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
AuthController.login = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const clientIp = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
    // Vérifier si l'IP est bloquée pour trop de tentatives
    if (LoginAttemptManager_1.LoginAttemptManager.isBlocked(clientIp)) {
        const status = LoginAttemptManager_1.LoginAttemptManager.getAttemptStatus(clientIp);
        throw new customErrors_1.RateLimitError('Trop de tentatives de connexion échouées. Veuillez réessayer plus tard.', {
            limit: 200,
            remaining: 0,
            resetTime: new Date(Date.now() + ((status === null || status === void 0 ? void 0 : status.timeUntilReset) || 10000))
        });
    }
    // Vérifier la limite de taux générale
    const rateLimitCheck = RateLimitService_1.RateLimitService.checkRateLimit(req);
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
        throw new customErrors_1.RateLimitError('Trop de tentatives de connexion', rateLimitCheck.rateLimitInfo);
    }
    const loginData = req.body;
    try {
        const result = yield _a.services.authService.login(loginData, req);
        // Réinitialiser les tentatives échouées en cas de succès
        LoginAttemptManager_1.LoginAttemptManager.clearFailedAttempts(clientIp);
        // Ajouter les headers de rate limit
        if (rateLimitCheck.rateLimitInfo) {
            res.setHeader('RateLimit-Remaining', rateLimitCheck.rateLimitInfo.remaining);
            res.setHeader('RateLimit-Limit', rateLimitCheck.rateLimitInfo.limit);
            res.setHeader('RateLimit-Reset', Math.floor(rateLimitCheck.rateLimitInfo.resetTime.getTime() / 1000));
        }
        const authResult = result;
        res.status(200).json({
            success: true,
            message: authResult.message,
            data: {
                user: authResult.user,
                token: authResult.token,
                refreshToken: authResult.refreshToken,
                sessionId: authResult.sessionId,
                deviceInfo: authResult.deviceInfo,
                requiresDeviceVerification: authResult.requiresDeviceVerification,
                existingSessions: authResult.existingSessions
            }
        });
    }
    catch (error) {
        logger_1.default.error('❌ Échec de connexion dans le contrôleur', {
            email: loginData.email,
            errorType: error.constructor.name,
            errorMessage: error.message,
            clientIp
        });
        // Enregistrer la tentative échouée
        const attemptInfo = LoginAttemptManager_1.LoginAttemptManager.recordFailedAttempt(clientIp);
        // Ajouter les headers des tentatives de connexion SEULEMENT si la réponse n'a pas encore été envoyée
        if (!res.headersSent) {
            res.setHeader('X-Login-Attempts-Remaining', attemptInfo.remaining);
            res.setHeader('X-Login-Attempts-Limit', 200);
            res.setHeader('X-Login-Attempts-Reset', Math.floor(attemptInfo.resetTime.getTime() / 1000));
        }
        // Si bloqué, lancer une RateLimitError
        if (attemptInfo.isBlocked) {
            throw new customErrors_1.RateLimitError('Trop de tentatives de connexion échouées. Veuillez réessayer plus tard.', {
                limit: 200,
                remaining: 0,
                resetTime: attemptInfo.resetTime
            });
        }
        // Propager l'erreur originale
        throw error;
    }
}));
/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
AuthController.register = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rateLimitCheck = RateLimitService_1.RateLimitService.checkRateLimit(req);
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
        throw new customErrors_1.RateLimitError('Trop de tentatives d\'inscription', rateLimitCheck.rateLimitInfo);
    }
    const userData = req.body;
    const result = yield _a.services.authService.register(userData, req);
    // Ajouter les headers de rate limit
    if (rateLimitCheck.rateLimitInfo) {
        res.setHeader('RateLimit-Remaining', rateLimitCheck.rateLimitInfo.remaining);
        res.setHeader('RateLimit-Limit', rateLimitCheck.rateLimitInfo.limit);
        res.setHeader('RateLimit-Reset', Math.floor(rateLimitCheck.rateLimitInfo.resetTime.getTime() / 1000));
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
}));
/**
 * POST /api/auth/verify-email
 * Vérification de l'email
 */
AuthController.verifyEmail = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rateLimitCheck = RateLimitService_1.RateLimitService.checkRateLimit(req);
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
        throw new customErrors_1.RateLimitError('Trop de tentatives de vérification', rateLimitCheck.rateLimitInfo);
    }
    const { userId, otpCode } = req.body;
    // Validation des données
    const validationErrors = [];
    if (!userId)
        validationErrors.push('L\'identifiant utilisateur est requis');
    if (!otpCode)
        validationErrors.push('Le code OTP est requis');
    if (validationErrors.length > 0) {
        throw new customErrors_1.ValidationError('Données de vérification incomplètes', validationErrors.map(msg => ({
            field: 'general',
            message: msg,
            constraint: 'required'
        })));
    }
    const result = yield _a.services.authService.verifyEmail(userId, otpCode, req);
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            user: result.user
        }
    });
}));
/**
 * POST /api/auth/logout
 * Déconnexion d'un utilisateur
 */
AuthController.logout = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { sessionId } = req.body;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
    if (!sessionId) {
        throw new customErrors_1.ValidationError('Session ID est requis', [
            { field: 'sessionId', message: 'Session ID est requis', constraint: 'required' }
        ]);
    }
    yield _a.services.authService.logout(userId, sessionId);
    res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
    });
}));
/**
 * POST /api/auth/refresh-token
 * Rafraîchissement du token
 */
AuthController.refreshToken = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new customErrors_1.ValidationError('Refresh token est requis', [
            { field: 'refreshToken', message: 'Refresh token est requis', constraint: 'required' }
        ]);
    }
    const result = yield _a.services.authService.refreshToken(refreshToken, req);
    res.status(200).json({
        success: true,
        message: 'Token rafraîchi avec succès',
        data: {
            token: result.token,
            refreshToken: result.refreshToken
        }
    });
}));
/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe
 */
AuthController.forgotPassword = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rateLimitCheck = RateLimitService_1.RateLimitService.checkRateLimit(req);
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
        throw new customErrors_1.RateLimitError('Trop de demandes de réinitialisation', rateLimitCheck.rateLimitInfo);
    }
    const { email } = req.body;
    if (!email) {
        throw new customErrors_1.ValidationError('Email est requis', [
            { field: 'email', message: 'Email est requis', constraint: 'required' }
        ]);
    }
    const result = yield _a.services.authService.forgotPassword({ email }, req);
    res.status(200).json({
        success: true,
        message: result.message
    });
}));
/**
 * POST /api/auth/reset-password
 * Réinitialisation du mot de passe
 */
AuthController.resetPassword = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rateLimitCheck = RateLimitService_1.RateLimitService.checkRateLimit(req);
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
        throw new customErrors_1.RateLimitError('Trop de tentatives de réinitialisation', rateLimitCheck.rateLimitInfo);
    }
    const { token, newPassword } = req.body;
    // Validation des données
    const validationErrors = [];
    if (!token)
        validationErrors.push('Le token de réinitialisation est requis');
    if (!newPassword)
        validationErrors.push('Le nouveau mot de passe est requis');
    if (newPassword && newPassword.length < 6) {
        validationErrors.push('Le mot de passe doit contenir au moins 6 caractères');
    }
    if (validationErrors.length > 0) {
        throw new customErrors_1.ValidationError('Données de réinitialisation invalides', validationErrors.map(msg => ({
            field: 'general',
            message: msg,
            constraint: 'required'
        })));
    }
    const result = yield _a.services.authService.resetPassword({ token, newPassword }, req);
    res.status(200).json({
        success: true,
        message: result.message
    });
}));
/**
 * POST /api/auth/change-password
 * Changement de mot de passe (utilisateur connecté)
 */
AuthController.changePassword = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
    const { currentPassword, newPassword } = req.body;
    if (!userId) {
        throw new customErrors_1.ValidationError('Utilisateur non authentifié', [
            { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
        ]);
    }
    // Validation des données
    const validationErrors = [];
    if (!currentPassword)
        validationErrors.push('Le mot de passe actuel est requis');
    if (!newPassword)
        validationErrors.push('Le nouveau mot de passe est requis');
    if (newPassword && newPassword.length < 6) {
        validationErrors.push('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }
    if (currentPassword === newPassword) {
        validationErrors.push('Le nouveau mot de passe doit être différent de l\'actuel');
    }
    if (validationErrors.length > 0) {
        throw new customErrors_1.ValidationError('Données de changement de mot de passe invalides', validationErrors.map(msg => ({
            field: 'general',
            message: msg,
            constraint: 'validation'
        })));
    }
    const result = yield _a.services.authService.changePassword(userId, { currentPassword, newPassword }, req);
    res.status(200).json({
        success: true,
        message: result.message
    });
}));
/**
 * PUT /api/auth/profile
 * Mise à jour du profil utilisateur
 */
AuthController.updateProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
    const { name, phone } = req.body;
    if (!userId) {
        throw new customErrors_1.ValidationError('Utilisateur non authentifié', [
            { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
        ]);
    }
    // Validation des données
    const updateData = {};
    const validationErrors = [];
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            validationErrors.push('Le nom doit être une chaîne non vide');
        }
        else {
            updateData.name = name.trim();
        }
    }
    if (phone !== undefined) {
        if (typeof phone !== 'string' || phone.trim().length === 0) {
            validationErrors.push('Le numéro de téléphone doit être une chaîne non vide');
        }
        else {
            updateData.phone = phone.trim();
        }
    }
    if (validationErrors.length > 0) {
        throw new customErrors_1.ValidationError('Données de profil invalides', validationErrors.map(msg => ({
            field: 'general',
            message: msg,
            constraint: 'validation'
        })));
    }
    // Vérifier qu'au moins un champ est fourni
    if (Object.keys(updateData).length === 0) {
        throw new customErrors_1.ValidationError('Aucune donnée à mettre à jour', [
            { field: 'general', message: 'Fournissez au moins un champ à mettre à jour', constraint: 'required' }
        ]);
    }
    const result = yield _a.services.authService.updateProfile(userId, updateData, req);
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            user: result.user
        }
    });
}));
/**
 * GET /api/auth/profile
 * Récupération du profil utilisateur
 */
AuthController.getProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
    if (!userId) {
        throw new customErrors_1.ValidationError('Utilisateur non authentifié', [
            { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
        ]);
    }
    const user = yield _a.services.authService.getProfile(userId);
    res.status(200).json({
        success: true,
        data: {
            user
        }
    });
}));
/**
 * POST /api/auth/deactivate
 * Désactivation du compte utilisateur
 */
AuthController.deactivateAccount = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
    const { reason } = req.body;
    if (!userId) {
        throw new customErrors_1.ValidationError('Utilisateur non authentifié', [
            { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
        ]);
    }
    const result = yield _a.services.authService.deactivateAccount(userId, { reason }, req);
    res.status(200).json({
        success: true,
        message: result.message
    });
}));
/**
 * POST /api/auth/reactivate
 * Réactivation du compte utilisateur
 */
AuthController.reactivateAccount = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    // Validation des données
    const validationErrors = [];
    if (!email)
        validationErrors.push('Email est requis');
    if (!password)
        validationErrors.push('Mot de passe est requis');
    if (validationErrors.length > 0) {
        throw new customErrors_1.ValidationError('Données de réactivation incomplètes', validationErrors.map(msg => ({
            field: 'general',
            message: msg,
            constraint: 'required'
        })));
    }
    const result = yield _a.services.authService.reactivateAccount(email, password, req);
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            user: result.user,
            token: result.token
        }
    });
}));
/**
 * GET /api/auth/sessions
 * Récupération des sessions actives de l'utilisateur
 */
AuthController.getSessions = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
    if (!userId) {
        throw new customErrors_1.ValidationError('Utilisateur non authentifié', [
            { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
        ]);
    }
    const sessions = yield _a.services.authService.getUserSessions(userId);
    res.status(200).json({
        success: true,
        data: {
            sessions
        }
    });
}));
/**
 * DELETE /api/auth/sessions/:sessionId
 * Révocation d'une session spécifique
 */
AuthController.revokeSession = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
    const { sessionId } = req.params;
    if (!userId) {
        throw new customErrors_1.ValidationError('Utilisateur non authentifié', [
            { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
        ]);
    }
    if (!sessionId) {
        throw new customErrors_1.ValidationError('Session ID est requis', [
            { field: 'sessionId', message: 'Session ID est requis', constraint: 'required' }
        ]);
    }
    yield _a.services.authService.revokeSession(userId, sessionId);
    res.status(200).json({
        success: true,
        message: 'Session révoquée avec succès'
    });
}));
/**
 * DELETE /api/auth/sessions
 * Révocation de toutes les sessions (sauf la session actuelle)
 */
AuthController.revokeAllSessions = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
    const currentSessionId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.sessionId;
    if (!userId) {
        throw new customErrors_1.ValidationError('Utilisateur non authentifié', [
            { field: 'userId', message: 'Utilisateur non authentifié', constraint: 'auth_required' }
        ]);
    }
    // Récupérer toutes les sessions
    const sessions = yield _a.services.authService.getUserSessions(userId);
    // Révoquer toutes les sessions sauf la session actuelle
    const sessionsToRevoke = sessions.filter(session => session.id !== currentSessionId);
    for (const session of sessionsToRevoke) {
        yield _a.services.authService.revokeSession(userId, session.id);
    }
    res.status(200).json({
        success: true,
        message: `${sessionsToRevoke.length} session(s) révoquée(s) avec succès`,
        data: {
            revokedCount: sessionsToRevoke.length,
            currentSessionActive: true
        }
    });
}));
/**
 * POST /api/auth/resend-verification
 * Renvoyer le code de vérification email
 */
AuthController.resendVerificationCode = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    if (!userId) {
        throw new customErrors_1.ValidationError('L\'identifiant utilisateur est requis', [
            { field: 'userId', message: 'L\'identifiant utilisateur est requis', constraint: 'required' }
        ]);
    }
    // Récupérer l'utilisateur
    const user = yield _a.services.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new customErrors_1.NotFoundError('Utilisateur non trouvé');
    }
    // Renvoyer l'email de vérification
    const emailVerificationService = _a.services.emailVerificationService;
    yield emailVerificationService.sendVerificationEmail(user.id, user.email);
    res.status(200).json({
        success: true,
        message: 'Code de vérification renvoyé avec succès'
    });
}));
/**
 * POST /api/auth/verify-device
 * Vérifier le code OTP pour un nouvel appareil
 */
AuthController.verifyDevice = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId, otpCode } = req.body;
    if (!sessionId || !otpCode) {
        throw new customErrors_1.ValidationError('Session ID et code OTP requis', [
            { field: 'sessionId', message: 'Session ID requis', constraint: 'required' },
            { field: 'otpCode', message: 'Code OTP requis', constraint: 'required' }
        ]);
    }
    // Importer le service
    // const { MultiDeviceAuthService } = await import('../services/MultiDeviceAuthService');
    const multiDeviceService = _a.services.multiDeviceAuthService;
    const result = yield multiDeviceService.verifyDeviceOTP(sessionId, otpCode);
    if (!result.success) {
        throw new customErrors_1.ValidationError('Code invalide ou expiré', [
            { field: 'otpCode', message: 'Code invalide ou expiré', constraint: 'invalid' }
        ]);
    }
    // Récupérer le rôle réel de l'utilisateur
    const userRole = yield _a.services.prisma.user.findUnique({
        where: { id: result.session.userId },
        select: { role: true }
    });
    // Générer les tokens
    const token = (0, tokenUtils_1.generateToken)({
        userId: result.session.userId,
        role: (userRole === null || userRole === void 0 ? void 0 : userRole.role) || 'BETTOR',
        email: '',
        walletId: ''
    });
    res.status(200).json({
        success: true,
        message: 'Appareil vérifié avec succès',
        data: {
            token,
            refreshToken: result.session.refreshToken,
            sessionId: result.session.id
        }
    });
}));
/**
 * POST /api/auth/resend-device-otp
 * Renvoyer le code OTP pour vérification d'appareil
 */
AuthController.resendDeviceOTP = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.body;
    if (!sessionId) {
        throw new customErrors_1.ValidationError('Session ID requis', [
            { field: 'sessionId', message: 'Session ID requis', constraint: 'required' }
        ]);
    }
    const multiDeviceService = _a.services.multiDeviceAuthService;
    const result = yield multiDeviceService.resendDeviceOTP(sessionId);
    if (!result.success) {
        throw new customErrors_1.ValidationError(result.error || 'Impossible de renvoyer le code', [
            { field: 'sessionId', message: result.error || 'Session invalide', constraint: 'invalid' }
        ]);
    }
    res.status(200).json({
        success: true,
        message: 'Code renvoyé avec succès'
    });
}));
exports.default = AuthController;

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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tokenUtils_1 = require("../utils/tokenUtils");
const customErrors_1 = require("../errors/customErrors");
const userValidator_1 = __importDefault(require("../utils/validators/userValidator"));
const SessionRepository_1 = require("../repositories/SessionRepository");
const Logger_1 = __importDefault(require("../utils/Logger"));
const EmailService_1 = require("./EmailService");
const client_1 = require("@prisma/client");
const typedi_1 = require("typedi");
const DeviceDetectionService_1 = require("./DeviceDetectionService");
const MultiDeviceAuthService_1 = require("./MultiDeviceAuthService");
const env_1 = require("../config/env");
class AuthService {
    constructor(userRepository, walletRepository, emailVerificationService, sessionRepository, emailService, otpCodeRepository, auditLogRepository, prisma) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.emailVerificationService = emailVerificationService;
        this.sessionRepository = sessionRepository;
        this.emailService = emailService;
        this.otpCodeRepository = otpCodeRepository;
        this.auditLogRepository = auditLogRepository;
        this.prisma = prisma;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOGIN_WINDOW_MS = 15 * 60 * 1000;
    }
    /**
     * Connexion d'un utilisateur
     */
    login(loginData, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // Validation des données d'entrée
                const validatedData = userValidator_1.default.validateLogin(loginData);
                // Recherche de l'utilisateur
                const user = yield this.userRepository.findByEmailWithWallet(validatedData.email);
                if (!user) {
                    throw new customErrors_1.AuthenticationError('Identifiants invalides', {
                        email: validatedData.email,
                        reason: 'USER_NOT_FOUND',
                        ipAddress: req === null || req === void 0 ? void 0 : req.ip,
                        timestamp: new Date().toISOString()
                    });
                }
                // Vérification du statut du compte
                if (!user.isActive) {
                    throw new customErrors_1.AuthenticationError('Compte désactivé', {
                        userId: user.id,
                        email: user.email,
                        reason: 'ACCOUNT_INACTIVE',
                        suggestion: 'Contactez le support pour réactiver votre compte'
                    });
                }
                if (!user.isEmailVerified) {
                    throw new customErrors_1.AuthenticationError('Email non vérifié', {
                        userId: user.id,
                        email: user.email,
                        reason: 'EMAIL_NOT_VERIFIED',
                        suggestion: 'Vérifiez votre boîte mail ou demandez un nouveau lien de vérification'
                    });
                }
                // Vérification du mot de passe
                const isPasswordValid = yield bcrypt_1.default.compare(validatedData.password, user.password);
                if (!isPasswordValid) {
                    // Enregistrement de la tentative échouée
                    yield this.recordFailedLoginAttempt(user.id, req);
                    throw new customErrors_1.AuthenticationError('Mot de passe incorrect', {
                        userId: user.id,
                        email: user.email,
                        reason: 'INVALID_PASSWORD',
                        suggestion: 'Réinitialisez votre mot de passe si vous l\'avez oublié'
                    });
                }
                // Réinitialiser les tentatives échouées en cas de succès
                yield this.resetFailedLoginAttempts(user.id);
                // Mise à jour de la dernière connexion
                yield this.userRepository.updateLastLogin(user.id, new Date());
                // 1. Détection de l'appareil
                const detectedDevice = DeviceDetectionService_1.DeviceDetectionService.parseDeviceInfo((req === null || req === void 0 ? void 0 : req.headers['user-agent']) || '');
                const deviceInfo = {
                    deviceType: detectedDevice.deviceType,
                    ipAddress: req === null || req === void 0 ? void 0 : req.ip,
                    userAgent: req === null || req === void 0 ? void 0 : req.headers['user-agent']
                };
                const deviceId = DeviceDetectionService_1.DeviceDetectionService.generateDeviceId((req === null || req === void 0 ? void 0 : req.headers['user-agent']) || '', (req === null || req === void 0 ? void 0 : req.ip) || '');
                // 2. Vérifier si l'appareil est connu
                const isKnownDevice = yield this.sessionRepository.isKnownDevice(user.id, deviceId);
                const isAdmin = user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.SUPER_ADMIN;
                if (!isKnownDevice || isAdmin) {
                    // 3. Vérifier s'il y a d'autres sessions actives
                    const multiDeviceAuthService = new MultiDeviceAuthService_1.MultiDeviceAuthService(this.prisma, typedi_1.Container.get(EmailService_1.EmailService), typedi_1.Container.get(require('./WebSocketService').WebSocketService));
                    const { hasActiveSessions, sessions } = yield multiDeviceAuthService.checkActiveSessions(user.id);
                    // Pour les admins, on exige TOUJOURS la vérification, même si c'est la seule session
                    if (hasActiveSessions || isAdmin) {
                        Logger_1.default.info(`🔒 Vérification requise pour ${user.email} (Admin: ${isAdmin}, NewDevice: ${!isKnownDevice})`);
                        // 4. Créer session en attente + OTP
                        const { session, otpCode } = yield multiDeviceAuthService.createPendingSession(user.id, detectedDevice, req);
                        // 5. Envoyer email
                        const emailService = typedi_1.Container.get(EmailService_1.EmailService);
                        yield emailService.sendDeviceVerificationOTP(user.email, user.name || 'Utilisateur', otpCode, detectedDevice);
                        return {
                            requiresDeviceVerification: true,
                            sessionId: session.id,
                            existingSessions: sessions.map((s) => ({
                                deviceName: s.deviceName,
                                lastActivity: s.lastActivity
                            })),
                            deviceInfo: detectedDevice,
                            message: 'Vérification requise'
                        };
                    }
                }
                // === CONNEXION NORMALE (Appareil connu OU Premier appareil) ===
                // Génération des tokens
                const token = (0, tokenUtils_1.generateToken)({
                    userId: user.id,
                    role: user.role,
                    email: user.email,
                    walletId: (_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id
                });
                const refreshToken = crypto_1.default.randomBytes(40).toString('hex');
                const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                // Création de la session (Vérifiée car mot de passe OK et pas de conflit multi-appareils)
                const session = yield this.sessionRepository.createSession({
                    userId: user.id,
                    refreshToken,
                    deviceType: detectedDevice.deviceType,
                    deviceName: detectedDevice.deviceName,
                    deviceId: deviceId,
                    ipAddress: req === null || req === void 0 ? void 0 : req.ip,
                    userAgent: req === null || req === void 0 ? void 0 : req.headers['user-agent'],
                    expiresAt: sessionExpiry,
                    status: SessionRepository_1.SessionStatus.ACTIVE,
                    isVerified: true
                });
                // Application des limites de sessions
                yield this.sessionRepository.enforceSessionLimits(user.id);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'USER_LOGIN',
                    table: 'users',
                    recordId: user.id,
                    userId: user.id,
                    ipAddress: deviceInfo.ipAddress,
                    userAgent: deviceInfo.userAgent
                });
                // Nettoyage de la réponse
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                Logger_1.default.info(`✅ Connexion réussie: ${user.email} (${user.id})`, {
                    userId: user.id,
                    ip: deviceInfo.ipAddress,
                    deviceType: deviceInfo.deviceType
                });
                return {
                    user: userWithoutPassword,
                    token,
                    refreshToken,
                    sessionId: session.id,
                    deviceInfo,
                    message: 'Connexion réussie'
                };
            }
            catch (error) {
                // CORRECTION CRITIQUE : Vérifier d'abord si c'est une AuthenticationError
                if (error instanceof customErrors_1.AuthenticationError) {
                    Logger_1.default.warn(`⚠️ Tentative de connexion échouée: ${loginData.email}`, {
                        reason: (_b = error.details) === null || _b === void 0 ? void 0 : _b.reason,
                        ip: req === null || req === void 0 ? void 0 : req.ip
                    });
                    throw error;
                }
                // Vérifier les autres erreurs AppError
                if (error instanceof customErrors_1.ValidationError ||
                    error instanceof customErrors_1.ConflictError ||
                    error instanceof customErrors_1.NotFoundError) {
                    throw error;
                }
                // Seulement pour les erreurs techniques inattendues
                Logger_1.default.error('❌ Échec de la connexion (erreur technique)', {
                    email: loginData.email,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    ip: req === null || req === void 0 ? void 0 : req.ip,
                    userAgent: req === null || req === void 0 ? void 0 : req.headers['user-agent']
                });
                throw new customErrors_1.DatabaseError(error.message, {
                    operation: 'LOGIN_OPERATION',
                    entity: 'USER',
                    requestId: req === null || req === void 0 ? void 0 : req.headers['x-request-id'],
                    originalError: error.message
                });
            }
        });
    }
    /**
     * Inscription d'un nouvel utilisateur - CORRIGÉE
     */
    register(userData, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validation des données
                const validatedData = userValidator_1.default.validateRegister(userData);
                // Vérifier si l'utilisateur existe déjà
                const existingUser = yield this.userRepository.findByEmail(validatedData.email);
                if (existingUser) {
                    throw new customErrors_1.ConflictError('Cet email est déjà utilisé', {
                        resource: 'USER',
                        conflictingField: 'email',
                        value: validatedData.email
                    });
                }
                // Vérifier si le numéro de téléphone existe déjà
                if (validatedData.phone) {
                    const existingPhone = yield this.userRepository.findByPhone(validatedData.phone);
                    if (existingPhone) {
                        throw new customErrors_1.ConflictError('Ce numéro de téléphone est déjà utilisé', {
                            resource: 'USER',
                            conflictingField: 'phone',
                            value: validatedData.phone
                        });
                    }
                }
                // Hash du mot de passe
                const hashedPassword = yield bcrypt_1.default.hash(validatedData.password, 10);
                // ⚡ CORRECTION : Créer d'abord l'utilisateur
                const newUser = yield this.userRepository.create({
                    email: validatedData.email,
                    password: hashedPassword,
                    name: validatedData.name,
                    phone: validatedData.phone,
                    role: client_1.UserRole.BETTOR,
                    isActive: false,
                    isEmailVerified: false
                });
                // ⚡ CORRECTION : Puis créer le wallet pour cet utilisateur
                const wallet = yield this.walletRepository.create({
                    userId: newUser.id,
                    balance: 0,
                    lockedBalance: 0
                });
                // Envoi de l'email de vérification
                yield this.emailVerificationService.sendVerificationEmail(newUser.id, newUser.email);
                // Génération du token
                const token = (0, tokenUtils_1.generateToken)({
                    userId: newUser.id,
                    role: newUser.role,
                    email: newUser.email,
                    walletId: wallet.id
                });
                // Extraction des infos de l'appareil
                let deviceInfo = {
                    deviceType: SessionRepository_1.DeviceType.UNKNOWN,
                    ipAddress: undefined,
                    userAgent: undefined
                };
                if (req) {
                    const extractedInfo = this.sessionRepository.extractDeviceInfoFromRequest(req);
                    deviceInfo = {
                        deviceType: extractedInfo.deviceType || SessionRepository_1.DeviceType.UNKNOWN,
                        ipAddress: extractedInfo.ipAddress,
                        userAgent: extractedInfo.userAgent
                    };
                }
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'USER_SIGNUP',
                    table: 'users',
                    recordId: newUser.id,
                    userId: newUser.id,
                    newData: {
                        email: newUser.email,
                        phone: newUser.phone,
                        name: newUser.name
                    },
                    ipAddress: deviceInfo.ipAddress,
                    userAgent: deviceInfo.userAgent
                });
                // Nettoyage de la réponse
                const { password } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
                Logger_1.default.info(`✅ Inscription réussie: ${newUser.email} (${newUser.id})`, {
                    userId: newUser.id,
                    ip: deviceInfo.ipAddress
                });
                return {
                    user: userWithoutPassword,
                    wallet,
                    token,
                    deviceInfo,
                    message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.'
                };
            }
            catch (error) {
                // Propagation des erreurs AppError
                if (error instanceof customErrors_1.ValidationError ||
                    error instanceof customErrors_1.ConflictError ||
                    error instanceof customErrors_1.AuthenticationError ||
                    error instanceof customErrors_1.NotFoundError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec de l\'inscription (erreur technique)', {
                    email: userData.email,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    ip: req === null || req === void 0 ? void 0 : req.ip
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue lors de l\'inscription. Veuillez réessayer.', {
                    operation: 'REGISTER_OPERATION',
                    entity: 'USER',
                    requestId: req === null || req === void 0 ? void 0 : req.headers['x-request-id'],
                    originalError: error.message
                });
            }
        });
    }
    /**
     * Vérification de l'email
     */
    verifyEmail(userId, otpCode, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Vérifier l'OTP
                const isValid = yield this.emailVerificationService.verifyOTP(userId, otpCode);
                if (!isValid) {
                    throw new customErrors_1.AuthenticationError('Code OTP invalide ou expiré', {
                        userId,
                        reason: 'INVALID_OTP'
                    });
                }
                // Mettre à jour le statut de vérification et activer le compte
                const user = yield this.userRepository.update({
                    id: userId,
                    isEmailVerified: true,
                    isActive: true
                });
                if (!user) {
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé', { userId });
                }
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'EMAIL_VERIFIED',
                    table: 'users',
                    recordId: userId,
                    userId: userId
                });
                Logger_1.default.info(`✅ Email vérifié: ${user.email} (${user.id})`);
                return {
                    user: userWithoutPassword,
                    message: 'Email vérifié avec succès. Votre compte est maintenant actif.'
                };
            }
            catch (error) {
                // Propagation des erreurs AppError
                if (error instanceof customErrors_1.AuthenticationError ||
                    error instanceof customErrors_1.NotFoundError ||
                    error instanceof customErrors_1.ValidationError ||
                    error instanceof customErrors_1.ConflictError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec de la vérification email (erreur technique)', {
                    userId,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue lors de la vérification. Veuillez réessayer.', {
                    operation: 'VERIFY_EMAIL_OPERATION',
                    entity: 'USER',
                    requestId: req === null || req === void 0 ? void 0 : req.headers['x-request-id'],
                    originalError: error.message
                });
            }
        });
    }
    /**
     * Déconnexion d'un utilisateur
     */
    logout(userId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.sessionRepository.invalidateSession(sessionId);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'USER_LOGOUT',
                    table: 'sessions',
                    recordId: sessionId,
                    userId: userId
                });
                Logger_1.default.info(`✅ Déconnexion réussie pour l'utilisateur ${userId}`);
            }
            catch (error) {
                Logger_1.default.error('❌ Échec de la déconnexion', {
                    userId,
                    sessionId,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue lors de la déconnexion.', {
                    operation: 'LOGOUT_OPERATION',
                    entity: 'SESSION',
                    userId,
                    sessionId
                });
            }
        });
    }
    /**
     * Rafraîchissement du token
     */
    refreshToken(refreshToken, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Trouver la session avec le refresh token
                const session = yield this.sessionRepository.findByRefreshToken(refreshToken);
                if (!session) {
                    throw new customErrors_1.AuthenticationError('Session invalide', {
                        reason: 'INVALID_REFRESH_TOKEN'
                    });
                }
                // Vérifier si la session est expirée
                if (session.expiresAt < new Date()) {
                    throw new customErrors_1.AuthenticationError('Session expirée', {
                        reason: 'SESSION_EXPIRED'
                    });
                }
                // Vérifier si la session est active
                if (session.status !== SessionRepository_1.SessionStatus.ACTIVE) {
                    throw new customErrors_1.AuthenticationError('Session inactive', {
                        reason: 'SESSION_INACTIVE'
                    });
                }
                // Récupérer l'utilisateur
                const user = yield this.userRepository.findById(session.userId);
                if (!user) {
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé', { userId: session.userId });
                }
                // Vérifier le statut du compte
                if (!user.isActive) {
                    throw new customErrors_1.AuthenticationError('Compte désactivé', {
                        userId: user.id,
                        reason: 'ACCOUNT_INACTIVE'
                    });
                }
                // Générer un nouveau token
                const newToken = (0, tokenUtils_1.generateToken)({
                    userId: user.id,
                    role: user.role,
                    email: user.email,
                    walletId: (_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id
                });
                // Générer un nouveau refresh token
                const newRefreshToken = crypto_1.default.randomBytes(40).toString('hex');
                // Mettre à jour la session
                yield this.sessionRepository.updateRefreshToken(session.id, newRefreshToken);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'TOKEN_REFRESHED',
                    table: 'sessions',
                    recordId: session.id,
                    userId: user.id
                });
                Logger_1.default.info(`✅ Token rafraîchi pour l'utilisateur ${user.id}`);
                return {
                    token: newToken,
                    refreshToken: newRefreshToken
                };
            }
            catch (error) {
                // Propagation des erreurs AppError
                if (error instanceof customErrors_1.AuthenticationError ||
                    error instanceof customErrors_1.NotFoundError ||
                    error instanceof customErrors_1.ValidationError ||
                    error instanceof customErrors_1.ConflictError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec du rafraîchissement du token', {
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue lors du rafraîchissement de la session.', {
                    operation: 'REFRESH_TOKEN_OPERATION',
                    entity: 'SESSION'
                });
            }
        });
    }
    /**
     * MOT DE PASSE OUBLIÉ - Envoi du lien de réinitialisation
     */
    forgotPassword(data, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = data;
                Logger_1.default.info(`📧 Demande de réinitialisation pour: ${email}`);
                // Rechercher l'utilisateur
                const user = yield this.userRepository.findByEmail(email);
                if (!user) {
                    // Pour des raisons de sécurité, ne pas révéler si l'email existe
                    Logger_1.default.warn(`⚠️ Email non trouvé: ${email}`);
                    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
                }
                Logger_1.default.info(`👤 Utilisateur trouvé: ${user.id} - ${user.email}`);
                // Vérifier si le compte est actif
                if (!user.isActive) {
                    Logger_1.default.warn(`❌ Compte désactivé pour: ${user.email}`);
                    throw new customErrors_1.AuthenticationError('Compte désactivé', {
                        userId: user.id,
                        email: user.email,
                        reason: 'ACCOUNT_INACTIVE',
                        suggestion: 'Contactez le support pour réactiver votre compte'
                    });
                }
                // Vérifier que l'email est vérifié
                if (!user.isEmailVerified) {
                    Logger_1.default.warn(`❌ Email non vérifié pour: ${user.email}`);
                    throw new customErrors_1.AuthenticationError('Email non vérifié', {
                        userId: user.id,
                        email: user.email,
                        reason: 'EMAIL_NOT_VERIFIED',
                        suggestion: 'Vérifiez votre email avant de réinitialiser le mot de passe'
                    });
                }
                // Vérifier que JWT_SECRET est défini
                if (!env_1.config.jwt.secret) {
                    Logger_1.default.error('❌ JWT_SECRET non défini dans la configuration');
                    throw new customErrors_1.DatabaseError('Configuration serveur incomplète', {
                        operation: 'FORGOT_PASSWORD_OPERATION',
                        entity: 'CONFIG',
                        originalError: 'JWT_SECRET manquant'
                    });
                }
                Logger_1.default.info(`🔐 Génération du token JWT avec secret: ${env_1.config.jwt.secret.substring(0, 10)}...`);
                // Générer un token de réinitialisation
                const resetToken = jsonwebtoken_1.default.sign({
                    userId: user.id,
                    email: user.email,
                    type: 'password_reset',
                    timestamp: Date.now()
                }, env_1.config.jwt.secret, { expiresIn: '15m' });
                Logger_1.default.info(`✅ Token JWT généré: ${resetToken.substring(0, 20)}...`);
                // Stocker le token OTP
                try {
                    yield this.otpCodeRepository.create({
                        userId: user.id,
                        code: resetToken,
                        purpose: 'PASSWORD_RESET',
                        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
                    });
                    Logger_1.default.info(`💾 Token OTP sauvegardé pour l'utilisateur: ${user.id}`);
                }
                catch (dbError) {
                    Logger_1.default.error(`❌ Erreur base de données OTP: ${dbError.message}`);
                    throw new customErrors_1.DatabaseError('Erreur lors de la sauvegarde du token', {
                        operation: 'FORGOT_PASSWORD_OPERATION',
                        entity: 'OTP_CODE',
                        originalError: dbError.message
                    });
                }
                // Envoyer l'email de réinitialisation
                try {
                    yield this.sendPasswordResetEmail(user.email, user.name, resetToken);
                    Logger_1.default.info(`📤 Email envoyé à: ${user.email}`);
                }
                catch (emailError) {
                    Logger_1.default.error(`❌ Erreur envoi email: ${emailError.message}`);
                    // Ne pas échouer si l'email échoue, mais logger l'erreur
                }
                // Log d'audit
                try {
                    yield this.auditLogRepository.create({
                        action: 'PASSWORD_RESET_REQUESTED',
                        table: 'users',
                        recordId: user.id,
                        userId: user.id,
                        ipAddress: req === null || req === void 0 ? void 0 : req.ip,
                        userAgent: req === null || req === void 0 ? void 0 : req.headers['user-agent']
                    });
                    Logger_1.default.info(`📝 Log d'audit créé pour: ${user.id}`);
                }
                catch (auditError) {
                    Logger_1.default.warn(`⚠️ Erreur création log audit: ${auditError.message}`);
                    // Continuer même si l'audit échoue
                }
                return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
            }
            catch (error) {
                // Propagation des erreurs AuthenticationError
                if (error instanceof customErrors_1.AuthenticationError) {
                    Logger_1.default.warn(`🔐 Erreur d'authentification: ${error.message}`);
                    throw error;
                }
                // Propagation des erreurs DatabaseError
                if (error instanceof customErrors_1.DatabaseError) {
                    Logger_1.default.error(`🗄️ Erreur base de données: ${error.message}`);
                    throw error;
                }
                // Pour toutes les autres erreurs
                Logger_1.default.error('❌ Échec de la demande de réinitialisation', {
                    email: data.email,
                    errorName: error.name,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    ip: req === null || req === void 0 ? void 0 : req.ip
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue. Veuillez réessayer.', {
                    operation: 'FORGOT_PASSWORD_OPERATION',
                    entity: 'USER',
                    originalError: error.message,
                    requestId: req === null || req === void 0 ? void 0 : req.headers['x-request-id']
                });
            }
        });
    }
    /**
     * RÉINITIALISATION DU MOT DE PASSE
     */
    resetPassword(data, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token, newPassword } = data;
                Logger_1.default.info(`🔑 Tentative de réinitialisation avec token: ${token.substring(0, 20)}...`);
                // Vérifier et décoder le token
                let decoded;
                try {
                    decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
                }
                catch (error) {
                    Logger_1.default.warn(`❌ Token JWT invalide: ${error.message}`);
                    throw new customErrors_1.AuthenticationError('Token invalide ou expiré', {
                        reason: 'INVALID_RESET_TOKEN'
                    });
                }
                // Vérifier que c'est un token de réinitialisation
                if (!decoded.type || decoded.type !== 'password_reset') {
                    Logger_1.default.warn(`❌ Type de token invalide: ${decoded.type}`);
                    throw new customErrors_1.AuthenticationError('Type de token invalide', {
                        reason: 'INVALID_TOKEN_TYPE'
                    });
                }
                // Vérifier l'OTP
                const otpRecord = yield this.otpCodeRepository.findValidToken(decoded.userId, token, 'PASSWORD_RESET');
                if (!otpRecord) {
                    Logger_1.default.warn(`❌ Token OTP invalide ou déjà utilisé pour l'utilisateur: ${decoded.userId}`);
                    throw new customErrors_1.AuthenticationError('Token invalide ou déjà utilisé', {
                        reason: 'INVALID_OTP'
                    });
                }
                Logger_1.default.info(`✅ Token OTP valide trouvé pour l'utilisateur: ${decoded.userId}`);
                // Récupérer l'utilisateur
                const user = yield this.userRepository.findById(decoded.userId);
                if (!user) {
                    Logger_1.default.warn(`❌ Utilisateur non trouvé: ${decoded.userId}`);
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé', { userId: decoded.userId });
                }
                // Vérifier si le compte est actif
                if (!user.isActive) {
                    Logger_1.default.warn(`❌ Compte désactivé: ${user.email}`);
                    throw new customErrors_1.AuthenticationError('Compte désactivé', {
                        userId: user.id,
                        reason: 'ACCOUNT_INACTIVE'
                    });
                }
                Logger_1.default.info(`👤 Utilisateur trouvé pour réinitialisation: ${user.email}`);
                // Hash du nouveau mot de passe
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
                // Mettre à jour le mot de passe
                yield this.userRepository.updatePassword(user.id, hashedPassword);
                Logger_1.default.info(`🔐 Mot de passe mis à jour pour: ${user.email}`);
                // Marquer l'OTP comme utilisé
                yield this.otpCodeRepository.markAsUsed(otpRecord.id);
                Logger_1.default.info(`✅ Token OTP marqué comme utilisé: ${otpRecord.id}`);
                // Révoquer toutes les sessions existantes (sécurité)
                yield this.sessionRepository.revokeAllUserSessions(user.id);
                Logger_1.default.info(`🔒 Toutes les sessions révoquées pour: ${user.email}`);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'PASSWORD_RESET_COMPLETED',
                    table: 'users',
                    recordId: user.id,
                    userId: user.id,
                    ipAddress: req === null || req === void 0 ? void 0 : req.ip
                });
                Logger_1.default.info(`✅ Mot de passe réinitialisé pour: ${user.email}`);
                return { message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' };
            }
            catch (error) {
                if (error instanceof customErrors_1.AuthenticationError || error instanceof customErrors_1.NotFoundError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec de la réinitialisation du mot de passe', {
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue. Veuillez réessayer.', {
                    operation: 'RESET_PASSWORD_OPERATION',
                    entity: 'USER',
                    originalError: error.message
                });
            }
        });
    }
    /**
     * CHANGEMENT DE MOT DE PASSE (quand l'utilisateur est connecté)
     */
    changePassword(userId, data, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { currentPassword, newPassword } = data;
                Logger_1.default.info(`🔐 Demande de changement de mot de passe pour l'utilisateur: ${userId}`);
                // Récupérer l'utilisateur
                const user = yield this.userRepository.findById(userId);
                if (!user) {
                    Logger_1.default.warn(`❌ Utilisateur non trouvé: ${userId}`);
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé', { userId });
                }
                // Vérifier l'ancien mot de passe
                const isPasswordValid = yield bcrypt_1.default.compare(currentPassword, user.password);
                if (!isPasswordValid) {
                    Logger_1.default.warn(`❌ Mot de passe actuel incorrect pour: ${user.email}`);
                    throw new customErrors_1.AuthenticationError('Mot de passe actuel incorrect', {
                        userId: user.id,
                        reason: 'INVALID_CURRENT_PASSWORD'
                    });
                }
                Logger_1.default.info(`✅ Mot de passe actuel vérifié pour: ${user.email}`);
                // Hash du nouveau mot de passe
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
                // Mettre à jour le mot de passe
                yield this.userRepository.updatePassword(user.id, hashedPassword);
                Logger_1.default.info(`🔐 Nouveau mot de passe enregistré pour: ${user.email}`);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'PASSWORD_CHANGED',
                    table: 'users',
                    recordId: user.id,
                    userId: user.id,
                    ipAddress: req === null || req === void 0 ? void 0 : req.ip
                });
                Logger_1.default.info(`✅ Mot de passe changé pour: ${user.email}`);
                return { message: 'Mot de passe changé avec succès.' };
            }
            catch (error) {
                if (error instanceof customErrors_1.AuthenticationError || error instanceof customErrors_1.NotFoundError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec du changement de mot de passe', {
                    userId,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue. Veuillez réessayer.', {
                    operation: 'CHANGE_PASSWORD_OPERATION',
                    entity: 'USER',
                    originalError: error.message
                });
            }
        });
    }
    /**
     * MISE À JOUR DU PROFIL
     */
    updateProfile(userId, data, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, phone } = data;
                Logger_1.default.info(`📝 Mise à jour profil demandée pour: ${userId}`, { name, phone });
                // Vérifier si le nouveau téléphone est déjà utilisé par un autre utilisateur
                if (phone) {
                    const existingUser = yield this.userRepository.findByPhone(phone);
                    if (existingUser && existingUser.id !== userId) {
                        Logger_1.default.warn(`❌ Numéro de téléphone déjà utilisé: ${phone}`);
                        throw new customErrors_1.ConflictError('Ce numéro de téléphone est déjà utilisé', {
                            resource: 'USER',
                            conflictingField: 'phone',
                            value: phone
                        });
                    }
                }
                // Mettre à jour le profil
                const updatedUser = yield this.userRepository.update(Object.assign(Object.assign({ id: userId }, (name && { name })), (phone && { phone })));
                if (!updatedUser) {
                    Logger_1.default.warn(`❌ Utilisateur non trouvé lors de la mise à jour: ${userId}`);
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé', { userId });
                }
                const { password } = updatedUser, userWithoutPassword = __rest(updatedUser, ["password"]);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'PROFILE_UPDATED',
                    table: 'users',
                    recordId: userId,
                    userId: userId,
                    oldData: { name: userWithoutPassword.name, phone: userWithoutPassword.phone },
                    newData: data,
                    ipAddress: req === null || req === void 0 ? void 0 : req.ip
                });
                Logger_1.default.info(`✅ Profil mis à jour pour: ${updatedUser.email}`);
                return {
                    user: userWithoutPassword,
                    message: 'Profil mis à jour avec succès'
                };
            }
            catch (error) {
                if (error instanceof customErrors_1.ConflictError || error instanceof customErrors_1.NotFoundError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec de la mise à jour du profil', {
                    userId,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue. Veuillez réessayer.', {
                    operation: 'UPDATE_PROFILE_OPERATION',
                    entity: 'USER',
                    originalError: error.message
                });
            }
        });
    }
    /**
     * DÉSACTIVATION DU COMPTE
     */
    deactivateAccount(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, data = {}, req) {
            try {
                const { reason } = data;
                Logger_1.default.info(`🚫 Demande de désactivation pour l'utilisateur: ${userId}`, { reason });
                // Récupérer l'utilisateur
                const user = yield this.userRepository.findById(userId);
                if (!user) {
                    Logger_1.default.warn(`❌ Utilisateur non trouvé: ${userId}`);
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé', { userId });
                }
                // Désactiver le compte
                yield this.userRepository.update({
                    id: userId,
                    isActive: false
                });
                // Révoquer toutes les sessions
                yield this.sessionRepository.revokeAllUserSessions(userId);
                Logger_1.default.info(`🔒 Toutes les sessions révoquées pour: ${user.email}`);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'ACCOUNT_DEACTIVATED',
                    table: 'users',
                    recordId: userId,
                    userId: userId,
                    newData: { isActive: false, deactivationReason: reason },
                    ipAddress: req === null || req === void 0 ? void 0 : req.ip
                });
                Logger_1.default.info(`✅ Compte désactivé pour: ${user.email}`, { reason });
                return { message: 'Compte désactivé avec succès.' };
            }
            catch (error) {
                if (error instanceof customErrors_1.NotFoundError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec de la désactivation du compte', {
                    userId,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue. Veuillez réessayer.', {
                    operation: 'DEACTIVATE_ACCOUNT_OPERATION',
                    entity: 'USER',
                    originalError: error.message
                });
            }
        });
    }
    /**
     * RÉACTIVATION DU COMPTE
     */
    reactivateAccount(email, password, req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                Logger_1.default.info(`🔄 Tentative de réactivation pour: ${email}`);
                // Rechercher l'utilisateur
                const user = yield this.userRepository.findByEmail(email);
                if (!user) {
                    Logger_1.default.warn(`❌ Utilisateur non trouvé: ${email}`);
                    throw new customErrors_1.AuthenticationError('Identifiants invalides', {
                        email,
                        reason: 'USER_NOT_FOUND'
                    });
                }
                // Vérifier le mot de passe
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    Logger_1.default.warn(`❌ Mot de passe incorrect pour: ${email}`);
                    throw new customErrors_1.AuthenticationError('Mot de passe incorrect', {
                        email,
                        reason: 'INVALID_PASSWORD'
                    });
                }
                Logger_1.default.info(`✅ Mot de passe vérifié pour: ${email}`);
                // Vérifier que le compte est bien désactivé
                if (user.isActive) {
                    Logger_1.default.warn(`❌ Compte déjà actif: ${email}`);
                    throw new customErrors_1.ConflictError('Le compte est déjà actif', {
                        resource: 'USER',
                        value: email
                    });
                }
                Logger_1.default.info(`👤 Compte trouvé et désactivé: ${user.id}`);
                // Réactiver le compte
                const updatedUser = yield this.userRepository.update({
                    id: user.id,
                    isActive: true
                });
                if (!updatedUser) {
                    Logger_1.default.warn(`❌ Échec de la réactivation pour: ${user.id}`);
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé', { userId: user.id });
                }
                // Générer un nouveau token
                const token = (0, tokenUtils_1.generateToken)({
                    userId: updatedUser.id,
                    role: updatedUser.role,
                    email: updatedUser.email,
                    walletId: (_a = updatedUser.wallet) === null || _a === void 0 ? void 0 : _a.id
                });
                const { password: _ } = updatedUser, userWithoutPassword = __rest(updatedUser, ["password"]);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'ACCOUNT_REACTIVATED',
                    table: 'users',
                    recordId: user.id,
                    userId: user.id,
                    ipAddress: req === null || req === void 0 ? void 0 : req.ip
                });
                Logger_1.default.info(`✅ Compte réactivé pour: ${user.email}`);
                return {
                    user: userWithoutPassword,
                    token,
                    message: 'Compte réactivé avec succès.'
                };
            }
            catch (error) {
                if (error instanceof customErrors_1.AuthenticationError ||
                    error instanceof customErrors_1.ConflictError ||
                    error instanceof customErrors_1.NotFoundError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec de la réactivation du compte', {
                    email,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue. Veuillez réessayer.', {
                    operation: 'REACTIVATE_ACCOUNT_OPERATION',
                    entity: 'USER',
                    originalError: error.message
                });
            }
        });
    }
    /**
     * RÉCUPÉRATION DU PROFIL UTILISATEUR
     */
    getProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                Logger_1.default.info(`👤 Récupération profil demandée pour: ${userId}`);
                const user = yield this.userRepository.findByIdWithWallet(userId);
                if (!user) {
                    Logger_1.default.warn(`❌ Utilisateur non trouvé: ${userId}`);
                    throw new customErrors_1.NotFoundError('Utilisateur non trouvé', { userId });
                }
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                Logger_1.default.info(`✅ Profil récupéré pour: ${user.email}`);
                return userWithoutPassword;
            }
            catch (error) {
                if (error instanceof customErrors_1.NotFoundError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec de la récupération du profil', {
                    userId,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue. Veuillez réessayer.', {
                    operation: 'GET_PROFILE_OPERATION',
                    entity: 'USER',
                    originalError: error.message
                });
            }
        });
    }
    /**
     * RÉCUPÉRATION DES SESSIONS ACTIVES
     */
    getUserSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                Logger_1.default.info(`💻 Récupération sessions demandée pour: ${userId}`);
                const sessions = yield this.sessionRepository.findByUserId(userId);
                Logger_1.default.info(`✅ ${sessions.length} sessions trouvées pour: ${userId}`);
                return sessions.map(session => ({
                    id: session.id,
                    deviceType: session.deviceType,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt,
                    status: session.status
                }));
            }
            catch (error) {
                Logger_1.default.error('❌ Échec de la récupération des sessions', {
                    userId,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue. Veuillez réessayer.', {
                    operation: 'GET_USER_SESSIONS_OPERATION',
                    entity: 'SESSION',
                    originalError: error.message
                });
            }
        });
    }
    /**
     * RÉVOCATION D'UNE SESSION SPÉCIFIQUE
     */
    revokeSession(userId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                Logger_1.default.info(`🔒 Tentative de révocation session: ${sessionId} pour utilisateur: ${userId}`);
                const session = yield this.sessionRepository.findById(sessionId);
                if (!session) {
                    Logger_1.default.warn(`❌ Session non trouvée: ${sessionId}`);
                    throw new customErrors_1.NotFoundError('Session non trouvée', { sessionId });
                }
                // Vérifier que la session appartient bien à l'utilisateur
                if (session.userId !== userId) {
                    Logger_1.default.warn(`❌ Session n'appartient pas à l'utilisateur: ${session.userId} != ${userId}`);
                    throw new customErrors_1.ForbiddenError('Vous n\'êtes pas autorisé à révoquer cette session', {
                        reason: 'SESSION_OWNERSHIP_MISMATCH'
                    });
                }
                yield this.sessionRepository.invalidateSession(sessionId);
                // Log d'audit
                yield this.auditLogRepository.create({
                    action: 'SESSION_REVOKED',
                    table: 'sessions',
                    recordId: sessionId,
                    userId: userId
                });
                Logger_1.default.info(`✅ Session révoquée: ${sessionId} pour l'utilisateur ${userId}`);
            }
            catch (error) {
                if (error instanceof customErrors_1.NotFoundError || error instanceof customErrors_1.ForbiddenError) {
                    throw error;
                }
                Logger_1.default.error('❌ Échec de la révocation de session', {
                    userId,
                    sessionId,
                    errorMessage: error.message,
                    errorStack: error.stack
                });
                throw new customErrors_1.DatabaseError('Une erreur technique est survenue. Veuillez réessayer.', {
                    operation: 'REVOKE_SESSION_OPERATION',
                    entity: 'SESSION',
                    originalError: error.message
                });
            }
        });
    }
    // ==================== MÉTHODES PRIVÉES ====================
    /**
     * Envoi d'email de réinitialisation de mot de passe
     */
    sendPasswordResetEmail(email, name, resetToken) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const frontendUrl = ((_a = env_1.config.app) === null || _a === void 0 ? void 0 : _a.frontendUrl) || process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
            Logger_1.default.info(`📤 Email de réinitialisation pour ${name} <${email}>`);
            Logger_1.default.info(`🔗 Lien: ${resetLink}`);
            const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; font-size: 28px; margin: 0;">Xbeur</h1>
          <p style="color: #666; font-size: 16px; margin-top: 10px;">Réinitialisation de mot de passe</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; font-size: 22px; margin-top: 0; text-align: center;">Bonjour ${name},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Xbeur.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
          </p>
          <p style="color: #4CAF50; font-size: 14px; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${resetLink}
          </p>
          
          <div style="background-color: #fff4e5; padding: 15px; border-radius: 6px; border-left: 4px solid #ff9800; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>⚠️ Important :</strong>
            </p>
            <ul style="color: #666; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Ce lien est valable pendant <strong>15 minutes</strong></li>
              <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              <li>Ne partagez jamais ce lien avec qui que ce soit</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            Ceci est un email automatique. Veuillez ne pas répondre à cet email.
          </p>
          <p style="margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} Xbeur. Tous droits réservés.
          </p>
        </div>
      </div>
    `;
            // Appeler la méthode correcte
            const emailSent = yield this.emailService.sendEmailSafe({
                to: email,
                subject: '🔐 Réinitialisation de votre mot de passe - Xbeur',
                html
            });
            if (!emailSent) {
                Logger_1.default.warn('⚠️ L\'email n\'a pas pu être envoyé');
                throw new Error('Échec de l\'envoi de l\'email de réinitialisation');
            }
            Logger_1.default.info(`✅ Email de réinitialisation envoyé avec succès à ${email}`);
        });
    }
    /**
     * Enregistrement d'une tentative de connexion échouée
     */
    recordFailedLoginAttempt(userId, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                Logger_1.default.warn(`⚠️ Tentative de connexion échouée pour l'utilisateur ${userId}`, {
                    ip: req === null || req === void 0 ? void 0 : req.ip,
                    userAgent: req === null || req === void 0 ? void 0 : req.headers['user-agent']
                });
                // Ici vous pourriez incrémenter un compteur dans la base de données
                // Exemple: await this.userRepository.incrementFailedAttempts(userId);
            }
            catch (error) {
                Logger_1.default.error('❌ Erreur lors de l\'enregistrement de la tentative échouée', {
                    userId,
                    errorMessage: error.message
                });
            }
        });
    }
    /**
     * Réinitialisation des tentatives de connexion échouées
     */
    resetFailedLoginAttempts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ici vous pourriez réinitialiser le compteur dans la base de données
                // Exemple: await this.userRepository.resetFailedAttempts(userId);
            }
            catch (error) {
                Logger_1.default.error('❌ Erreur lors de la réinitialisation des tentatives échouées', {
                    userId,
                    errorMessage: error.message
                });
            }
        });
    }
}
exports.AuthService = AuthService;

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
exports.UserService = void 0;
// src/services/UserService.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const tokenUtils_1 = require("../utils/tokenUtils");
const customErrors_1 = require("../errors/customErrors");
const userValidator_1 = __importDefault(require("../utils/validators/userValidator"));
const SessionRepository_1 = require("../repositories/SessionRepository");
const Logger_1 = __importDefault(require("../utils/Logger"));
class UserService {
    constructor(userRepository, walletRepository, emailVerificationService, sessionRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.emailVerificationService = emailVerificationService;
        this.sessionRepository = sessionRepository;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOGIN_WINDOW_MS = 15 * 60 * 1000;
        // Log pour vérifier l'instanciation
        console.log('UserService constructor called');
        console.log('UserRepository methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(userRepository)));
    }
    login(loginData, req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Login attempt for:', loginData.email);
                // Validation des données d'entrée
                const validatedData = userValidator_1.default.validateLogin(loginData);
                console.log('Data validated, searching user...');
                // DEBUG: Vérifier si la méthode existe
                console.log('Checking findByEmailWithWallet method...');
                console.log('Method exists:', typeof this.userRepository.findByEmailWithWallet);
                // Recherche de l'utilisateur
                const user = yield this.userRepository.findByEmailWithWallet(validatedData.email);
                console.log('User found:', !!user);
                if (!user) {
                    console.log('User not found:', validatedData.email);
                    throw new customErrors_1.AuthenticationError('Identifiants invalides', {
                        email: validatedData.email,
                        reason: 'USER_NOT_FOUND',
                        ipAddress: req === null || req === void 0 ? void 0 : req.ip,
                        timestamp: new Date().toISOString()
                    });
                }
                console.log('User found, checking account status...');
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
                    throw new customErrors_1.AuthenticationError('Mot de passe incorrect', {
                        userId: user.id,
                        email: user.email,
                        reason: 'INVALID_PASSWORD',
                        suggestion: 'Réinitialisez votre mot de passe si vous l\'avez oublié'
                    });
                }
                // Mise à jour de la dernière connexion
                yield this.userRepository.updateLastLogin(user.id, new Date());
                // Génération des tokens
                const token = (0, tokenUtils_1.generateToken)({
                    userId: user.id,
                    role: user.role,
                    email: user.email
                });
                const refreshToken = crypto_1.default.randomBytes(40).toString('hex');
                const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
                // Création de la session
                const session = yield this.sessionRepository.createSession({
                    userId: user.id,
                    refreshToken,
                    deviceType: deviceInfo.deviceType,
                    ipAddress: deviceInfo.ipAddress,
                    userAgent: deviceInfo.userAgent,
                    expiresAt: sessionExpiry
                });
                // Application des limites de sessions
                yield this.sessionRepository.enforceSessionLimits(user.id);
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
                console.error('❌ Login error details:', {
                    errorName: error.name,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    userEmail: loginData.email
                });
                Logger_1.default.error('❌ Échec de la connexion', {
                    email: loginData.email,
                    errorCode: error.code,
                    errorMessage: error.message,
                    ip: req === null || req === void 0 ? void 0 : req.ip,
                    userAgent: req === null || req === void 0 ? void 0 : req.headers['user-agent']
                });
                // Propagation des erreurs spécifiques
                if (error instanceof customErrors_1.AuthenticationError ||
                    error instanceof customErrors_1.ValidationError ||
                    error instanceof customErrors_1.RateLimitError) {
                    throw error;
                }
                // Erreur générique avec plus de détails
                throw new customErrors_1.DatabaseError('Une erreur est survenue lors de la connexion', 'LOGIN_OPERATION', 'USER', req === null || req === void 0 ? void 0 : req.headers['x-request-id']);
            }
        });
    }
}
exports.UserService = UserService;

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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const UserService_1 = require("../services/UserService");
const UserRepository_1 = require("../repositories/UserRepository");
const WalletRepository_1 = require("../repositories/WalletRepository");
const customErrors_1 = require("../errors/customErrors");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const client_1 = require("@prisma/client");
const EmailVerificationService_1 = require("../services/EmailVerificationService");
const EmailService_1 = require("../services/EmailService");
const RateLimitService_1 = require("../services/RateLimitService");
const SessionRepository_1 = require("../repositories/SessionRepository");
// Initialiser Prisma et les services
const prisma = new client_1.PrismaClient();
const userRepository = new UserRepository_1.UserRepository(prisma);
const walletRepository = new WalletRepository_1.WalletRepository(prisma);
const emailService = new EmailService_1.EmailService();
const emailVerificationService = new EmailVerificationService_1.EmailVerificationService(emailService, userRepository);
const sessionRepository = new SessionRepository_1.SessionRepository(prisma);
// Créer l'instance du service avec injection de dépendances
const userService = new UserService_1.UserService(userRepository, walletRepository, emailVerificationService, sessionRepository);
class UserController {
}
_a = UserController;
/**
 * Connexion d'un utilisateur avec rate limiting et gestion de sessions
 * POST /api/users/login
 */
UserController.login = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Vérifier le rate limiting
    const rateLimitCheck = RateLimitService_1.RateLimitService.checkRateLimit(req);
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
        throw new customErrors_1.RateLimitError('Too many login attempts', rateLimitCheck.rateLimitInfo);
    }
    const loginData = req.body;
    // Passer la requête (req) au service
    const result = yield userService.login(loginData, req);
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
            warning: RateLimitService_1.RateLimitService.isApproachingLimit
                ? RateLimitService_1.RateLimitService.isApproachingLimit(rateLimitCheck.rateLimitInfo)
                    ? 'Approaching rate limit'
                    : undefined
                : undefined
        } : undefined
    });
}));
/**
 * Inscription d'un nouvel utilisateur
 * POST /api/users/register
 */
UserController.register = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Vérifier le rate limiting
    const rateLimitCheck = RateLimitService_1.RateLimitService.checkRateLimit(req);
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
        throw new customErrors_1.RateLimitError('Too many registration attempts', rateLimitCheck.rateLimitInfo);
    }
    const userData = req.body;
    const result = yield userService.register(userData, req);
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
}));
/**
 * Vérification d'email avec OTP
 * POST /api/users/verify-email
 */
UserController.verifyEmail = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Vérifier le rate limiting
    const rateLimitCheck = RateLimitService_1.RateLimitService.checkRateLimit(req);
    if (rateLimitCheck.isBlocked && rateLimitCheck.rateLimitInfo) {
        throw new customErrors_1.RateLimitError('Too many verification attempts', rateLimitCheck.rateLimitInfo);
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
    const result = yield userService.verifyEmail(userId, otpCode, req);
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
}));
exports.default = UserController;

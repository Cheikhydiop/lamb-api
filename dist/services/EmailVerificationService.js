"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationService = void 0;
// src/services/EmailVerificationService.ts
const typedi_1 = require("typedi");
const EmailService_1 = require("./EmailService");
const logger_1 = __importDefault(require("../utils/logger"));
const not_found_error_1 = require("../utils/response/errors/not-found-error");
const UserRepository_1 = require("../repositories/UserRepository");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
// Dans EmailVerificationService.ts
let EmailVerificationService = class EmailVerificationService {
    constructor(emailService, userRepository) {
        this.emailService = emailService;
        this.userRepository = userRepository;
    }
    sendVerificationEmail(userId, email) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                logger_1.default.info(`📧 [EMAIL VERIFICATION] Début pour ${email} (${userId})`);
                // Récupérer l'utilisateur
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { id: userId }
                });
                if (!user) {
                    logger_1.default.error(`❌ [EMAIL VERIFICATION] Utilisateur non trouvé: ${userId}`);
                    throw new not_found_error_1.NotFoundError('Utilisateur non trouvé');
                }
                logger_1.default.info(`✅ [EMAIL VERIFICATION] Utilisateur trouvé: ${user.email}`);
                // Créer et envoyer la vérification
                yield this.createVerification(user);
                logger_1.default.info(`✅ [EMAIL VERIFICATION] Email envoyé avec succès à ${email}`);
            }
            catch (error) {
                logger_1.default.error(`❌ [EMAIL VERIFICATION] Échec pour ${email}`, {
                    userId,
                    email,
                    errorName: (_a = error === null || error === void 0 ? void 0 : error.constructor) === null || _a === void 0 ? void 0 : _a.name,
                    errorMessage: error === null || error === void 0 ? void 0 : error.message,
                    errorStack: error === null || error === void 0 ? void 0 : error.stack
                });
                // ✅ NE PAS TRANSFORMER LES ERREURS - Les laisser remonter telles quelles
                throw error;
            }
        });
    }
    createVerification(user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                logger_1.default.info(`🔐 [CREATE VERIFICATION] Début pour ${user.email}`);
                // Invalider les anciens codes
                yield prismaClient_1.default.otpCode.updateMany({
                    where: {
                        userId: user.id,
                        consumed: false
                    },
                    data: { consumed: true }
                });
                // Générer un nouveau code
                const code = this.generateCode();
                const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
                logger_1.default.info(`📝 [CREATE VERIFICATION] Code généré pour ${user.email}`);
                // Créer l'OTP en base
                const otpCode = yield prismaClient_1.default.otpCode.create({
                    data: {
                        code,
                        purpose: 'EMAIL_VERIFICATION',
                        expiresAt,
                        consumed: false,
                        userId: user.id,
                    }
                });
                logger_1.default.info(`✅ [CREATE VERIFICATION] OTP créé: ${otpCode.id}`);
                if (!user.email) {
                    throw new Error('User email is required for verification');
                }
                // ⚠️ POINT CRITIQUE : Envoyer l'email
                const emailSent = yield this.emailService.sendVerificationCode(user.email, code);
                if (!emailSent) {
                    logger_1.default.warn(`⚠️ [CREATE VERIFICATION] Email non envoyé (mode dev ou erreur silencieuse)`);
                    // En mode dev, on continue quand même
                    // En prod, vous pourriez vouloir throw une erreur
                }
                logger_1.default.info(`✅ [CREATE VERIFICATION] Terminé pour ${user.email}`);
            }
            catch (error) {
                logger_1.default.error(`❌ [CREATE VERIFICATION] Échec pour ${user.email}`, {
                    userId: user.id,
                    email: user.email,
                    errorName: (_a = error === null || error === void 0 ? void 0 : error.constructor) === null || _a === void 0 ? void 0 : _a.name,
                    errorMessage: error === null || error === void 0 ? void 0 : error.message,
                    errorStack: error === null || error === void 0 ? void 0 : error.stack
                });
                // ✅ Laisser remonter l'erreur d'origine
                throw error;
            }
        });
    }
    generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    verifyOTP(email, code, purpose) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findByEmail(email);
            if (!user)
                return false;
            const otp = yield prismaClient_1.default.otpCode.findFirst({
                where: {
                    userId: user.id,
                    code,
                    purpose: purpose,
                    consumed: false,
                    expiresAt: { gt: new Date() }
                }
            });
            if (!otp)
                return false;
            yield prismaClient_1.default.otpCode.update({
                where: { id: otp.id },
                data: { consumed: true }
            });
            return true;
        });
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [EmailService_1.EmailService,
        UserRepository_1.UserRepository])
], EmailVerificationService);

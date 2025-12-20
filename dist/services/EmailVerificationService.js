"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationService = void 0;
// src/services/EmailVerificationService.ts
const typedi_1 = require("typedi");
const Logger_1 = __importDefault(require("../utils/Logger"));
const not_found_error_1 = require("../utils/response/errors/not-found-error");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
// Dans EmailVerificationService.ts
let EmailVerificationService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EmailVerificationService = _classThis = class {
        constructor(emailService, userRepository) {
            this.emailService = emailService;
            this.userRepository = userRepository;
        }
        sendVerificationEmail(userId, email) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    Logger_1.default.info(`📧 [EMAIL VERIFICATION] Début pour ${email} (${userId})`);
                    // Récupérer l'utilisateur
                    const user = yield prismaClient_1.default.user.findUnique({
                        where: { id: userId }
                    });
                    if (!user) {
                        Logger_1.default.error(`❌ [EMAIL VERIFICATION] Utilisateur non trouvé: ${userId}`);
                        throw new not_found_error_1.NotFoundError('Utilisateur non trouvé');
                    }
                    Logger_1.default.info(`✅ [EMAIL VERIFICATION] Utilisateur trouvé: ${user.email}`);
                    // Créer et envoyer la vérification
                    yield this.createVerification(user);
                    Logger_1.default.info(`✅ [EMAIL VERIFICATION] Email envoyé avec succès à ${email}`);
                }
                catch (error) {
                    Logger_1.default.error(`❌ [EMAIL VERIFICATION] Échec pour ${email}`, {
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
                    Logger_1.default.info(`🔐 [CREATE VERIFICATION] Début pour ${user.email}`);
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
                    Logger_1.default.info(`📝 [CREATE VERIFICATION] Code généré pour ${user.email}`);
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
                    Logger_1.default.info(`✅ [CREATE VERIFICATION] OTP créé: ${otpCode.id}`);
                    // ⚠️ POINT CRITIQUE : Envoyer l'email
                    const emailSent = yield this.emailService.sendVerificationCode(user.email, code);
                    if (!emailSent) {
                        Logger_1.default.warn(`⚠️ [CREATE VERIFICATION] Email non envoyé (mode dev ou erreur silencieuse)`);
                        // En mode dev, on continue quand même
                        // En prod, vous pourriez vouloir throw une erreur
                    }
                    Logger_1.default.info(`✅ [CREATE VERIFICATION] Terminé pour ${user.email}`);
                }
                catch (error) {
                    Logger_1.default.error(`❌ [CREATE VERIFICATION] Échec pour ${user.email}`, {
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
    __setFunctionName(_classThis, "EmailVerificationService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EmailVerificationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EmailVerificationService = _classThis;
})();
exports.EmailVerificationService = EmailVerificationService;

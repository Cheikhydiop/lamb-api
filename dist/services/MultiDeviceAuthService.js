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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiDeviceAuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const DeviceDetectionService_1 = require("./DeviceDetectionService");
const logger_1 = __importDefault(require("../utils/logger"));
class MultiDeviceAuthService {
    constructor(prisma, emailService, webSocketService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.webSocketService = webSocketService;
    }
    /**
     * Vérifie s'il y a des sessions actives pour cet utilisateur
     */
    checkActiveSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.prisma.session.findMany({
                where: {
                    userId,
                    status: 'ACTIVE',
                    isVerified: true,
                    expiresAt: { gte: new Date() }
                },
                orderBy: { lastActivity: 'desc' }
            });
            return {
                hasActiveSessions: sessions.length > 0,
                sessions
            };
        });
    }
    /**
     * Vérifie si l'appareil est déjà connu et vérifié
     */
    isKnownDevice(userId, deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.prisma.session.findFirst({
                where: {
                    userId,
                    deviceId,
                    isVerified: true,
                    status: 'ACTIVE',
                    expiresAt: { gte: new Date() }
                }
            });
            return !!session;
        });
    }
    /**
     * Crée une session en attente de vérification
     */
    createPendingSession(userId, deviceInfo, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceId = DeviceDetectionService_1.DeviceDetectionService.generateDeviceId(req.headers['user-agent'] || '', req.ip || '');
            logger_1.default.info(`📱 Création session en attente pour userId: ${userId}, deviceId: ${deviceId}`);
            // Créer la session en attente
            const session = yield this.prisma.session.create({
                data: {
                    userId,
                    deviceType: deviceInfo.deviceType,
                    deviceName: deviceInfo.deviceName,
                    deviceId,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    status: 'PENDING_VERIFICATION',
                    isVerified: false,
                    refreshToken: crypto_1.default.randomBytes(40).toString('hex'),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
                }
            });
            // Générer le code OTP à 6 chiffres
            const otpCode = this.generateOTP();
            yield this.prisma.otpCode.create({
                data: {
                    userId,
                    sessionId: session.id,
                    code: otpCode,
                    purpose: 'DEVICE_VERIFICATION',
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                    ipAddress: req.ip
                }
            });
            logger_1.default.info(`✅ Session en attente créée: ${session.id}, OTP généré`);
            return { session, otpCode };
        });
    }
    /**
     * Vérifie le code OTP et active la session
     */
    verifyDeviceOTP(sessionId, otpCode) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`🔍 Vérification OTP pour session: ${sessionId}`);
            // Récupérer l'OTP
            const otp = yield this.prisma.otpCode.findFirst({
                where: {
                    sessionId,
                    code: otpCode,
                    purpose: 'DEVICE_VERIFICATION',
                    consumed: false,
                    expiresAt: { gte: new Date() }
                },
                include: { session: true }
            });
            if (!otp) {
                logger_1.default.warn(`❌ OTP invalide ou expiré pour session: ${sessionId}`);
                // Incrémenter le compteur de tentatives
                yield this.prisma.otpCode.updateMany({
                    where: {
                        sessionId,
                        purpose: 'DEVICE_VERIFICATION',
                        consumed: false
                    },
                    data: {
                        attempts: { increment: 1 }
                    }
                });
                return {
                    success: false,
                    error: 'Code invalide ou expiré'
                };
            }
            // Vérifier le nombre de tentatives
            if (otp.attempts >= otp.maxAttempts) {
                logger_1.default.warn(`❌ Trop de tentatives pour session: ${sessionId}`);
                return {
                    success: false,
                    error: 'Trop de tentatives. Demandez un nouveau code.'
                };
            }
            // Marquer l'OTP comme consommé
            yield this.prisma.otpCode.update({
                where: { id: otp.id },
                data: {
                    consumed: true,
                    consumedAt: new Date()
                }
            });
            // Activer la session
            const session = yield this.prisma.session.update({
                where: { id: sessionId },
                data: {
                    status: 'ACTIVE',
                    isVerified: true
                }
            });
            logger_1.default.info(`✅ Session activée: ${sessionId}`);
            // Déconnecter les autres sessions
            yield this.revokeOtherSessions(session.userId, sessionId);
            return { success: true, session };
        });
    }
    /**
     * Révoque toutes les autres sessions de l'utilisateur
     */
    revokeOtherSessions(userId, currentSessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`🔒 Révocation des autres sessions pour userId: ${userId}`);
            const otherSessions = yield this.prisma.session.findMany({
                where: {
                    userId,
                    id: { not: currentSessionId },
                    status: 'ACTIVE'
                }
            });
            if (otherSessions.length === 0) {
                logger_1.default.info(`ℹ️ Aucune autre session à révoquer`);
                return;
            }
            // Révoquer toutes les autres sessions
            yield this.prisma.session.updateMany({
                where: {
                    userId,
                    id: { not: currentSessionId },
                    status: 'ACTIVE'
                },
                data: { status: 'REVOKED' }
            });
            logger_1.default.info(`✅ ${otherSessions.length} session(s) révoquée(s)`);
            // Envoyer notifications WebSocket
            for (const session of otherSessions) {
                yield this.notifySessionRevoked(session);
            }
            // Récupérer la nouvelle session pour l'email
            const newSession = yield this.prisma.session.findUnique({
                where: { id: currentSessionId }
            });
            // Envoyer email de notification
            const user = yield this.prisma.user.findUnique({
                where: { id: userId }
            });
            if ((user === null || user === void 0 ? void 0 : user.email) && newSession) {
                yield this.sendDeviceConnectionEmail(user, newSession);
            }
        });
    }
    /**
     * Renvoie un nouveau code OTP pour une session en attente
     */
    resendDeviceOTP(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.prisma.session.findUnique({
                where: { id: sessionId },
                include: { user: true }
            });
            if (!session || session.status !== 'PENDING_VERIFICATION') {
                return { success: false, error: 'Session invalide' };
            }
            // Invalider les anciens OTP
            yield this.prisma.otpCode.updateMany({
                where: {
                    sessionId,
                    purpose: 'DEVICE_VERIFICATION',
                    consumed: false
                },
                data: { consumed: true }
            });
            // Générer nouveau code
            const otpCode = this.generateOTP();
            yield this.prisma.otpCode.create({
                data: {
                    userId: session.userId,
                    sessionId: session.id,
                    code: otpCode,
                    purpose: 'DEVICE_VERIFICATION',
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                }
            });
            // Renvoyer l'email
            const deviceInfo = {
                deviceName: session.deviceName || 'Appareil inconnu',
                browser: 'Navigateur',
                os: 'OS'
            };
            yield this.emailService.sendDeviceVerificationOTP(session.user.email, session.user.name, otpCode, deviceInfo);
            logger_1.default.info(`📧 Nouveau code OTP envoyé pour session: ${sessionId}`);
            return { success: true };
        });
    }
    /**
     * Génère un code OTP à 6 chiffres
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    /**
     * Notifie via WebSocket qu'une session a été révoquée
     */
    notifySessionRevoked(session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.webSocketService) {
                logger_1.default.warn('⚠️ WebSocketService non disponible pour notification');
                return;
            }
            try {
                this.webSocketService.sendToUser(session.userId, {
                    type: 'SESSION_REVOKED',
                    data: {
                        sessionId: session.id,
                        reason: 'NEW_DEVICE_LOGIN',
                        timestamp: new Date().toISOString()
                    }
                });
                logger_1.default.info(`📡 Notification WebSocket envoyée pour session: ${session.id}`);
            }
            catch (error) {
                logger_1.default.error(`❌ Erreur notification WebSocket: ${error.message}`);
            }
        });
    }
    /**
     * Envoie un email de notification de connexion
     */
    sendDeviceConnectionEmail(user, newSession) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.emailService.sendDeviceConnectionConfirmation(user.email, user.name, {
                    deviceName: newSession.deviceName || 'Appareil inconnu',
                    browser: 'Navigateur',
                    os: 'OS'
                }, new Date().toLocaleString('fr-FR'));
                logger_1.default.info(`📧 Email de confirmation envoyé à: ${user.email}`);
            }
            catch (error) {
                logger_1.default.error(`❌ Erreur envoi email: ${error.message}`);
            }
        });
    }
}
exports.MultiDeviceAuthService = MultiDeviceAuthService;

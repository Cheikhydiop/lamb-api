// src/services/MultiDeviceAuthService.ts
import { PrismaClient, Session } from '@prisma/client';
import crypto from 'crypto';
import { DeviceDetectionService } from './DeviceDetectionService';
import { EmailService } from './EmailService';
import { WebSocketService } from './WebSocketService';
import logger from '../utils/logger';
import { Request } from 'express';

export class MultiDeviceAuthService {
    private prisma: PrismaClient;
    private emailService: EmailService;
    private webSocketService?: WebSocketService;

    constructor(
        prisma: PrismaClient,
        emailService: EmailService,
        webSocketService?: WebSocketService
    ) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.webSocketService = webSocketService;
    }

    /**
     * Vérifie s'il y a des sessions actives pour cet utilisateur
     */
    async checkActiveSessions(userId: string): Promise<{
        hasActiveSessions: boolean;
        sessions: Session[];
    }> {
        const sessions = await this.prisma.session.findMany({
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
    }

    /**
     * Vérifie si l'appareil est déjà connu et vérifié
     */
    async isKnownDevice(userId: string, deviceId: string): Promise<boolean> {
        const session = await this.prisma.session.findFirst({
            where: {
                userId,
                deviceId,
                isVerified: true,
                status: 'ACTIVE',
                expiresAt: { gte: new Date() }
            }
        });

        return !!session;
    }

    /**
     * Crée une session en attente de vérification
     */
    async createPendingSession(
        userId: string,
        deviceInfo: any,
        req: Request
    ): Promise<{ session: Session; otpCode: string }> {
        const deviceId = DeviceDetectionService.generateDeviceId(
            req.headers['user-agent'] || '',
            req.ip || ''
        );

        logger.info(`📱 Création session en attente pour userId: ${userId}, deviceId: ${deviceId}`);

        // Créer la session en attente
        const session = await this.prisma.session.create({
            data: {
                userId,
                deviceType: deviceInfo.deviceType,
                deviceName: deviceInfo.deviceName,
                deviceId,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                status: 'PENDING_VERIFICATION',
                isVerified: false,
                refreshToken: crypto.randomBytes(40).toString('hex'),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
            }
        });

        // Générer le code OTP à 6 chiffres
        const otpCode = this.generateOTP();

        await this.prisma.otpCode.create({
            data: {
                userId,
                sessionId: session.id,
                code: otpCode,
                purpose: 'DEVICE_VERIFICATION',
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                ipAddress: req.ip
            }
        });

        logger.info(`✅ Session en attente créée: ${session.id}, OTP généré`);

        return { session, otpCode };
    }

    /**
     * Vérifie le code OTP et active la session
     */
    async verifyDeviceOTP(
        sessionId: string,
        otpCode: string
    ): Promise<{ success: boolean; session?: Session; error?: string }> {
        logger.info(`🔍 Vérification OTP pour session: ${sessionId}`);

        // Récupérer l'OTP
        const otp = await this.prisma.otpCode.findFirst({
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
            logger.warn(`❌ OTP invalide ou expiré pour session: ${sessionId}`);

            // Incrémenter le compteur de tentatives
            await this.prisma.otpCode.updateMany({
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
            logger.warn(`❌ Trop de tentatives pour session: ${sessionId}`);
            return {
                success: false,
                error: 'Trop de tentatives. Demandez un nouveau code.'
            };
        }

        // Marquer l'OTP comme consommé
        await this.prisma.otpCode.update({
            where: { id: otp.id },
            data: {
                consumed: true,
                consumedAt: new Date()
            }
        });

        // Activer la session
        const session = await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'ACTIVE',
                isVerified: true
            }
        });

        logger.info(`✅ Session activée: ${sessionId}`);

        // Déconnecter les autres sessions
        await this.revokeOtherSessions(session.userId, sessionId);

        return { success: true, session };
    }

    /**
     * Révoque toutes les autres sessions de l'utilisateur
     */
    async revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
        logger.info(`🔒 Révocation des autres sessions pour userId: ${userId}`);

        const otherSessions = await this.prisma.session.findMany({
            where: {
                userId,
                id: { not: currentSessionId },
                status: 'ACTIVE'
            }
        });

        if (otherSessions.length === 0) {
            logger.info(`ℹ️ Aucune autre session à révoquer`);
            return;
        }

        // Révoquer toutes les autres sessions
        await this.prisma.session.updateMany({
            where: {
                userId,
                id: { not: currentSessionId },
                status: 'ACTIVE'
            },
            data: { status: 'REVOKED' }
        });

        logger.info(`✅ ${otherSessions.length} session(s) révoquée(s)`);

        // Envoyer notifications WebSocket
        for (const session of otherSessions) {
            await this.notifySessionRevoked(session);
        }

        // Récupérer la nouvelle session pour l'email
        const newSession = await this.prisma.session.findUnique({
            where: { id: currentSessionId }
        });

        // Envoyer email de notification
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (user?.email && newSession) {
            await this.sendDeviceConnectionEmail(user, newSession);
        }
    }

    /**
     * Renvoie un nouveau code OTP pour une session en attente
     */
    async resendDeviceOTP(sessionId: string): Promise<{ success: boolean; error?: string }> {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { user: true }
        });

        if (!session || session.status !== 'PENDING_VERIFICATION') {
            return { success: false, error: 'Session invalide' };
        }

        // Invalider les anciens OTP
        await this.prisma.otpCode.updateMany({
            where: {
                sessionId,
                purpose: 'DEVICE_VERIFICATION',
                consumed: false
            },
            data: { consumed: true }
        });

        // Générer nouveau code
        const otpCode = this.generateOTP();

        await this.prisma.otpCode.create({
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

        await this.emailService.sendDeviceVerificationOTP(
            session.user.email!,
            session.user.name,
            otpCode,
            deviceInfo
        );

        logger.info(`📧 Nouveau code OTP envoyé pour session: ${sessionId}`);

        return { success: true };
    }

    /**
     * Génère un code OTP à 6 chiffres
     */
    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Notifie via WebSocket qu'une session a été révoquée
     */
    private async notifySessionRevoked(session: Session): Promise<void> {
        if (!this.webSocketService) {
            logger.warn('⚠️ WebSocketService non disponible pour notification');
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

            logger.info(`📡 Notification WebSocket envoyée pour session: ${session.id}`);
        } catch (error: any) {
            logger.error(`❌ Erreur notification WebSocket: ${error.message}`);
        }
    }

    /**
     * Envoie un email de notification de connexion
     */
    private async sendDeviceConnectionEmail(user: any, newSession: Session): Promise<void> {
        try {
            await this.emailService.sendDeviceConnectionConfirmation(
                user.email,
                user.name,
                {
                    deviceName: newSession.deviceName || 'Appareil inconnu',
                    browser: 'Navigateur',
                    os: 'OS'
                },
                new Date().toLocaleString('fr-FR')
            );

            logger.info(`📧 Email de confirmation envoyé à: ${user.email}`);
        } catch (error: any) {
            logger.error(`❌ Erreur envoi email: ${error.message}`);
        }
    }
}

import { Request, Response, NextFunction } from 'express';
import { Service } from 'typedi';
import { AuditService } from '../services/AuditService';
import logger from '../utils/Logger';

// Enums adaptés à votre modèle
export enum AuditAction {
  // Authentification
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',

  // Wallet & Transactions
  TOKEN_PURCHASE = 'TOKEN_PURCHASE',
  WITHDRAWAL_REQUEST = 'WITHDRAWAL_REQUEST',
  WITHDRAWAL_COMPLETE = 'WITHDRAWAL_COMPLETE',
  BALANCE_CHECK = 'BALANCE_CHECK',

  // Bets
  BET_CREATE = 'BET_CREATE',
  BET_ACCEPT = 'BET_ACCEPT',
  BET_CANCEL = 'BET_CANCEL',
  BET_WIN = 'BET_WIN',

  // Fights
  FIGHT_CREATE = 'FIGHT_CREATE',
  FIGHT_UPDATE = 'FIGHT_UPDATE',
  FIGHT_RESULT_SET = 'FIGHT_RESULT_SET',

  // Fighters
  FIGHTER_CREATE = 'FIGHTER_CREATE',
  FIGHTER_UPDATE = 'FIGHTER_UPDATE',

  // Admin
  USER_SUSPEND = 'USER_SUSPEND',
  USER_ACTIVATE = 'USER_ACTIVATE',
  USER_UPDATE = 'USER_UPDATE',
  SYSTEM_CONFIG_UPDATE = 'SYSTEM_CONFIG_UPDATE',

  // Sécurité
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  LOGIN_ATTEMPT_FAILED = 'LOGIN_ATTEMPT_FAILED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  WITHDRAWAL_APPROVE = 'WITHDRAWAL_APPROVE',
  WITHDRAWAL_REJECT = 'WITHDRAWAL_REJECT',

  // Sessions
  SESSION_CREATE = 'SESSION_CREATE',
  SESSION_REVOKE = 'SESSION_REVOKE',

  // OTP
  OTP_GENERATE = 'OTP_GENERATE',
  OTP_VERIFY = 'OTP_VERIFY',

  // Notifications
  NOTIFICATION_SEND = 'NOTIFICATION_SEND',
}

export enum AuditResourceType {
  USER = 'USER',
  WALLET = 'WALLET',
  BET = 'BET',
  FIGHT = 'FIGHT',
  FIGHTER = 'FIGHTER',
  TRANSACTION = 'TRANSACTION',
  WITHDRAWAL = 'WITHDRAWAL',
  SESSION = 'SESSION',
  NOTIFICATION = 'NOTIFICATION',
  OTP = 'OTP',
  SYSTEM = 'SYSTEM',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditConfig {
  action: AuditAction;
  resourceType: AuditResourceType;
  severity?: AuditSeverity;
  getResourceId?: (req: Request, res: Response) => string | undefined;
  getResourceName?: (req: Request, res: Response) => string | undefined;
  getDetails?: (req: Request, res: Response) => any;
  shouldAudit?: (req: Request, res: Response) => boolean;
}

@Service()
export class AuditMiddleware {
  constructor(private auditService: AuditService) { }

  /**
   * Middleware d'audit automatique
   */
  audit(config: AuditConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      const originalJson = res.json;

      // Intercepter la réponse pour récupérer les données
      res.send = function (data: any) {
        this.locals.auditData = data;
        return originalSend.call(this, data);
      };

      res.json = function (data: any) {
        this.locals.auditData = data;
        return originalJson.call(this, data);
      };

      try {
        await next();

        // Créer le log d'audit après l'exécution
        await this.createAuditLog(req, res, config);
      } catch (error) {
        // Créer le log d'audit en cas d'erreur
        await this.createAuditLog(req, res, config, error);
        throw error;
      }
    };
  }

  /**
   * Créer un log d'audit
   */
  private async createAuditLog(
    req: Request,
    res: Response,
    config: AuditConfig,
    error?: any
  ) {
    try {
      // Vérifier si on doit auditer
      if (config.shouldAudit && !config.shouldAudit(req, res)) {
        return;
      }

      // Vérifier que l'utilisateur est authentifié
      // Adapté à votre structure d'authentification
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        // Log pour actions non authentifiées (login, register)
        if (![AuditAction.USER_LOGIN, AuditAction.USER_REGISTER].includes(config.action)) {
          return;
        }
      }

      // Déterminer si l'action a réussi
      const isSuccessful = !error && res.statusCode >= 200 && res.statusCode < 300;

      // Récupérer les détails
      const resourceId = config.getResourceId ? config.getResourceId(req, res) : undefined;
      const resourceName = config.getResourceName ? config.getResourceName(req, res) : undefined;
      const details = config.getDetails ? config.getDetails(req, res) : undefined;

      // Récupérer l'adresse IP
      const ipAddress = req.ip ||
        req.headers['x-forwarded-for']?.toString() ||
        req.socket.remoteAddress;

      // Récupérer l'user agent
      const userAgent = req.get('User-Agent');

      // Créer le log d'audit
      await this.auditService.createAuditLog({
        action: config.action,
        userId: userId,
        resourceType: config.resourceType,
        resourceId: resourceId,
        resourceName: resourceName,
        severity: config.severity || (error ? AuditSeverity.HIGH : AuditSeverity.LOW),
        details: {
          ...details,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          isSuccessful,
          error: error?.message,
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
      });

      logger.info(`Audit log created: ${config.action} - ${isSuccessful ? 'SUCCESS' : 'FAILED'}`);
    } catch (auditError: any) {
      const errorMessage = auditError instanceof Error ? auditError.message : String(auditError);
      logger.error(`Failed to create audit log: ${errorMessage}`);
    }
  }

  // ====================== MIDDLEWARES SPÉCIFIQUES ======================

  /**
   * Middleware d'audit pour les connexions utilisateur
   */
  auditUserLogin() {
    return this.audit({
      action: AuditAction.USER_LOGIN,
      resourceType: AuditResourceType.USER,
      severity: AuditSeverity.LOW,
      getResourceId: (req, res) => (req as any).user?.id,
      getResourceName: (req) => (req as any).user?.phone || (req as any).user?.email,
      getDetails: (req) => ({
        phone: req.body.phone,
        loginMethod: req.body.loginMethod || 'phone',
        deviceInfo: req.get('User-Agent'),
      }),
      shouldAudit: (req, res) => res.statusCode !== 401, // Ne pas logguer les échecs d'auth
    });
  }

  /**
   * Middleware d'audit pour les inscriptions
   */
  auditUserRegister() {
    return this.audit({
      action: AuditAction.USER_REGISTER,
      resourceType: AuditResourceType.USER,
      severity: AuditSeverity.MEDIUM,
      getResourceId: (req, res) => (res.locals.auditData as any)?.id,
      getResourceName: (req) => req.body.phone,
      getDetails: (req) => ({
        phone: req.body.phone,
        email: req.body.email,
        name: req.body.name,
      }),
    });
  }

  /**
   * Middleware d'audit pour les achats de tokens
   */
  auditTokenPurchase() {
    return this.audit({
      action: AuditAction.TOKEN_PURCHASE,
      resourceType: AuditResourceType.TRANSACTION,
      severity: AuditSeverity.HIGH,
      getResourceId: (req, res) => (res.locals.auditData as any)?.id,
      getDetails: (req) => ({
        amount: req.body.amount,
        provider: req.body.provider,
        phone: req.body.phone,
        transactionRef: req.body.externalRef,
      }),
    });
  }

  /**
   * Middleware d'audit pour les retraits
   */
  auditWithdrawal() {
    return this.audit({
      action: AuditAction.WITHDRAWAL_REQUEST,
      resourceType: AuditResourceType.TRANSACTION,
      severity: AuditSeverity.HIGH,
      getResourceId: (req, res) => (res.locals.auditData as any)?.id,
      getDetails: (req) => ({
        amount: req.body.amount,
        provider: req.body.provider,
        phone: req.body.phone,
        walletBalanceBefore: (req as any).wallet?.balance,
      }),
    });
  }

  /**
   * Middleware d'audit pour la création de paris
   */
  auditBetCreate() {
    return this.audit({
      action: AuditAction.BET_CREATE,
      resourceType: AuditResourceType.BET,
      severity: AuditSeverity.MEDIUM,
      getResourceId: (req, res) => (res.locals.auditData as any)?.id,
      getDetails: (req) => ({
        amount: req.body.amount,
        fightId: req.body.fightId,
        chosenFighter: req.body.chosenFighter,
        taggedUserId: req.body.taggedUserId,
      }),
    });
  }

  /**
   * Middleware d'audit pour l'acceptation de paris
   */
  auditBetAccept() {
    return this.audit({
      action: AuditAction.BET_ACCEPT,
      resourceType: AuditResourceType.BET,
      severity: AuditSeverity.MEDIUM,
      getResourceId: (req, res) => req.params.id,
      getDetails: (req) => ({
        betId: req.params.id,
        acceptorId: (req as any).user?.id,
      }),
    });
  }

  /**
   * Middleware d'audit pour l'annulation de paris
   */
  auditBetCancel() {
    return this.audit({
      action: AuditAction.BET_CANCEL,
      resourceType: AuditResourceType.BET,
      severity: AuditSeverity.MEDIUM,
      getResourceId: (req, res) => req.params.id,
      getDetails: (req) => ({
        betId: req.params.id,
        cancellationReason: req.body.reason,
      }),
    });
  }

  /**
   * Middleware d'audit pour la création de combats (admin)
   */
  auditFightCreate() {
    return this.audit({
      action: AuditAction.FIGHT_CREATE,
      resourceType: AuditResourceType.FIGHT,
      severity: AuditSeverity.MEDIUM,
      getResourceId: (req, res) => (res.locals.auditData as any)?.id,
      getDetails: (req) => ({
        title: req.body.title,
        fighterAId: req.body.fighterAId,
        fighterBId: req.body.fighterBId,
        scheduledAt: req.body.scheduledAt,
        location: req.body.location,
      }),
    });
  }

  /**
   * Middleware d'audit pour la définition des résultats de combat
   */
  auditFightResultSet() {
    return this.audit({
      action: AuditAction.FIGHT_RESULT_SET,
      resourceType: AuditResourceType.FIGHT,
      severity: AuditSeverity.HIGH,
      getResourceId: (req, res) => req.params.id,
      getDetails: (req) => ({
        fightId: req.params.id,
        winner: req.body.winner,
        victoryMethod: req.body.victoryMethod,
        notes: req.body.notes,
        impactedBetsCount: (res: Response) => (res.locals.auditData as any)?.impactedBets,
      }),
    });
  }

  /**
   * Middleware d'audit pour la suspension d'utilisateurs (admin)
   */
  auditUserSuspend() {
    return this.audit({
      action: AuditAction.USER_SUSPEND,
      resourceType: AuditResourceType.USER,
      severity: AuditSeverity.HIGH,
      getResourceId: (req, res) => req.params.id,
      getResourceName: (req) => req.body.reason || 'Suspension administrative',
      getDetails: (req) => ({
        targetUserId: req.params.id,
        reason: req.body.reason,
        duration: req.body.duration,
        suspendedBy: (req as any).user?.id,
      }),
    });
  }

  /**
   * Middleware d'audit pour les changements de mot de passe
   */
  auditPasswordChange() {
    return this.audit({
      action: AuditAction.PASSWORD_CHANGE,
      resourceType: AuditResourceType.USER,
      severity: AuditSeverity.MEDIUM,
      getDetails: (req) => ({
        passwordChangedAt: new Date().toISOString(),
        changedBy: (req as any).user?.id,
      }),
    });
  }

  /**
   * Middleware d'audit pour les tentatives de login échouées
   */
  auditFailedLogin() {
    return this.audit({
      action: AuditAction.LOGIN_ATTEMPT_FAILED,
      resourceType: AuditResourceType.USER,
      severity: AuditSeverity.MEDIUM,
      getResourceName: (req) => req.body.phone,
      getDetails: (req) => ({
        phone: req.body.phone,
        attemptCount: (req as any).loginAttempts || 1,
        ipAddress: req.ip,
      }),
      shouldAudit: (req, res) => res.statusCode === 401, // Logguer seulement les échecs
    });
  }

  /**
   * Middleware d'audit pour les sessions
   */
  auditSessionCreate() {
    return this.audit({
      action: AuditAction.SESSION_CREATE,
      resourceType: AuditResourceType.SESSION,
      severity: AuditSeverity.LOW,
      getDetails: (req) => ({
        deviceType: req.body.deviceType || 'UNKNOWN',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }),
    });
  }

  /**
   * Middleware d'audit pour les transactions sensibles
   */
  auditHighValueTransaction(minAmount: number = 100000) { // 100,000 tokens
    return this.audit({
      action: AuditAction.TOKEN_PURCHASE,
      resourceType: AuditResourceType.TRANSACTION,
      severity: AuditSeverity.CRITICAL,
      getDetails: (req) => ({
        amount: req.body.amount,
        provider: req.body.provider,
        isHighValue: true,
        threshold: minAmount,
      }),
      shouldAudit: (req, res) => {
        const amount = parseInt(req.body.amount) || 0;
        return amount >= minAmount && res.statusCode === 200;
      },
    });
  }

  /**
   * Middleware d'audit générique pour les actions admin
   */
  auditAdminAction(action: AuditAction, resourceType: AuditResourceType, severity: AuditSeverity = AuditSeverity.MEDIUM) {
    return this.audit({
      action,
      resourceType,
      severity,
      getResourceId: (req, res) => req.params.id,
      getDetails: (req) => ({
        targetId: req.params.id,
        adminId: (req as any).user?.id,
        changes: req.body,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Middleware d'audit pour les activités suspectes
   */
  auditSuspiciousActivity(details: any) {
    return this.audit({
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      resourceType: AuditResourceType.SYSTEM,
      severity: AuditSeverity.CRITICAL,
      getDetails: () => details,
    });
  }
}
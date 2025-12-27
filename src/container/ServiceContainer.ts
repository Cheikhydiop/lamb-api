import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaClient } from '@prisma/client';
import prisma from '../config/prismaClient';
import logger from '../utils/logger';

// Import Services
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { WebSocketService } from '../services/WebSocketService';
import { EmailService } from '../services/EmailService';
import { EmailVerificationService } from '../services/EmailVerificationService';
import { AuditService } from '../services/AuditService';
import { BetService } from '../services/BetService';
import { MultiDeviceAuthService } from '../services/MultiDeviceAuthService';
import { UserSettingsService } from '../services/UserSettingsService';

// Import Repositories
import { UserRepository } from '../repositories/UserRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { OtpCodeRepository } from '../repositories/OtpCodeRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';

// Import Middlewares
import { AuditMiddleware } from '../middlewares/AuditMiddleware';

export class ServiceContainer {
  private static instance: ServiceContainer;
  private initialized = false;

  public prisma: PrismaClient = prisma;

  private constructor() { }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('Service container already initialized');
      return;
    }

    logger.info('Initializing service container...');

    try {
      // Initialize dependencies
      this.initializePrisma();
      this.initializeRepositories();
      this.initializeServices();

      this.initialized = true;
      logger.info('Service container initialized successfully');
    } catch (error: any) {
      logger.error(`Service container initialization failed: ${error.message}`);
      throw error;
    }
  }

  private initializePrisma(): void {
    Container.set('prisma', this.prisma);
    Container.set(PrismaClient, this.prisma);
  }

  private initializeRepositories(): void {
    const userRepository = new UserRepository(this.prisma);
    Container.set(UserRepository, userRepository);
    Container.set('userRepository', userRepository);

    const walletRepository = new WalletRepository(this.prisma);
    Container.set(WalletRepository, walletRepository);
    Container.set('walletRepository', walletRepository);

    const sessionRepository = new SessionRepository(this.prisma);
    Container.set(SessionRepository, sessionRepository);
    Container.set('sessionRepository', sessionRepository);

    const otpCodeRepository = new OtpCodeRepository(this.prisma);
    Container.set(OtpCodeRepository, otpCodeRepository);
    Container.set('otpCodeRepository', otpCodeRepository);

    const auditLogRepository = new AuditLogRepository(this.prisma);
    Container.set(AuditLogRepository, auditLogRepository);
    Container.set('auditLogRepository', auditLogRepository);

    logger.info('Repositories initialized');
  }

  private initializeServices(): void {
    // Service instantiation with manual dependency injection from Container

    // Infrastructure
    const emailService = new EmailService();
    Container.set(EmailService, emailService);
    Container.set('emailService', emailService);

    const webSocketService = new WebSocketService();
    Container.set(WebSocketService, webSocketService);
    Container.set('webSocketService', webSocketService);

    // Core
    const auditService = new AuditService(this.prisma);
    Container.set(AuditService, auditService);

    const auditMiddleware = new AuditMiddleware(auditService);
    Container.set(AuditMiddleware, auditMiddleware);

    // Domain
    const emailVerificationService = new EmailVerificationService(
      emailService,
      Container.get(UserRepository)
    );
    Container.set(EmailVerificationService, emailVerificationService);
    Container.set('emailVerificationService', emailVerificationService);


    const userService = new UserService(
      Container.get(UserRepository),
      Container.get(WalletRepository),
      emailVerificationService,
      Container.get(SessionRepository),
      this.prisma
    );
    Container.set(UserService, userService);
    Container.set('userService', userService);

    const authService = new AuthService(
      Container.get(UserRepository),
      Container.get(WalletRepository),
      emailVerificationService,
      Container.get(SessionRepository),
      emailService,
      Container.get(OtpCodeRepository),
      Container.get(AuditLogRepository),
      this.prisma,
      webSocketService
    );
    Container.set(AuthService, authService);
    Container.set('authService', authService);

    const betService = new BetService(
      this.prisma,
      webSocketService
    );
    Container.set(BetService, betService);
    Container.set('betService', betService);

    const multiDeviceAuthService = new MultiDeviceAuthService(
      this.prisma,
      emailService,
      webSocketService
    );
    Container.set(MultiDeviceAuthService, multiDeviceAuthService);
    Container.set('multiDeviceAuthService', multiDeviceAuthService);

    const userSettingsService = new UserSettingsService(this.prisma);
    Container.set(UserSettingsService, userSettingsService);
    Container.set('userSettingsService', userSettingsService);

    logger.info('Services initialized');
  }

  // Getters for public access (Backward Compatibility)
  public get userRepository(): UserRepository { return Container.get(UserRepository); }
  public get walletRepository(): WalletRepository { return Container.get(WalletRepository); }
  public get sessionRepository(): SessionRepository { return Container.get(SessionRepository); }
  public get otpCodeRepository(): OtpCodeRepository { return Container.get(OtpCodeRepository); }
  public get auditLogRepository(): AuditLogRepository { return Container.get(AuditLogRepository); }

  public get userService(): UserService { return Container.get(UserService); }
  public get authService(): AuthService { return Container.get(AuthService); }
  public get emailService(): EmailService { return Container.get(EmailService); }
  public get emailVerificationService(): EmailVerificationService { return Container.get(EmailVerificationService); }
  public get webSocketService(): WebSocketService { return Container.get(WebSocketService); }
  public get auditService(): AuditService { return Container.get(AuditService); }
  public get auditMiddleware(): AuditMiddleware { return Container.get(AuditMiddleware); }
  public get betService(): BetService { return Container.get(BetService); }
  public get multiDeviceAuthService(): MultiDeviceAuthService { return Container.get(MultiDeviceAuthService); }
  public get userSettingsService(): UserSettingsService { return Container.get(UserSettingsService); }
}

export const initializeServices = async (): Promise<ServiceContainer> => {
  const container = ServiceContainer.getInstance();
  await container.initialize();
  return container;
};

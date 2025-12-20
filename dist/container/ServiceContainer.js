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
exports.initializeServices = exports.ServiceContainer = void 0;
require("reflect-metadata");
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const logger_1 = __importDefault(require("../utils/logger"));
// Import Services
const UserService_1 = require("../services/UserService");
const AuthService_1 = require("../services/AuthService");
const WebSocketService_1 = require("../services/WebSocketService");
const EmailService_1 = require("../services/EmailService");
const EmailVerificationService_1 = require("../services/EmailVerificationService");
const AuditService_1 = require("../services/AuditService");
const BetService_1 = require("../services/BetService");
const MultiDeviceAuthService_1 = require("../services/MultiDeviceAuthService");
// Import Repositories
const UserRepository_1 = require("../repositories/UserRepository");
const WalletRepository_1 = require("../repositories/WalletRepository");
const SessionRepository_1 = require("../repositories/SessionRepository");
const OtpCodeRepository_1 = require("../repositories/OtpCodeRepository");
const AuditLogRepository_1 = require("../repositories/AuditLogRepository");
// Import Middlewares
const AuditMiddleware_1 = require("../middlewares/AuditMiddleware");
class ServiceContainer {
    constructor() {
        this.initialized = false;
        this.prisma = prismaClient_1.default;
    }
    static getInstance() {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
        }
        return ServiceContainer.instance;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized) {
                logger_1.default.info('Service container already initialized');
                return;
            }
            logger_1.default.info('Initializing service container...');
            try {
                // Initialize dependencies
                this.initializePrisma();
                this.initializeRepositories();
                this.initializeServices();
                this.initialized = true;
                logger_1.default.info('Service container initialized successfully');
            }
            catch (error) {
                logger_1.default.error(`Service container initialization failed: ${error.message}`);
                throw error;
            }
        });
    }
    initializePrisma() {
        typedi_1.Container.set('prisma', this.prisma);
        typedi_1.Container.set(client_1.PrismaClient, this.prisma);
    }
    initializeRepositories() {
        const userRepository = new UserRepository_1.UserRepository(this.prisma);
        typedi_1.Container.set(UserRepository_1.UserRepository, userRepository);
        typedi_1.Container.set('userRepository', userRepository);
        const walletRepository = new WalletRepository_1.WalletRepository(this.prisma);
        typedi_1.Container.set(WalletRepository_1.WalletRepository, walletRepository);
        typedi_1.Container.set('walletRepository', walletRepository);
        const sessionRepository = new SessionRepository_1.SessionRepository(this.prisma);
        typedi_1.Container.set(SessionRepository_1.SessionRepository, sessionRepository);
        typedi_1.Container.set('sessionRepository', sessionRepository);
        const otpCodeRepository = new OtpCodeRepository_1.OtpCodeRepository(this.prisma);
        typedi_1.Container.set(OtpCodeRepository_1.OtpCodeRepository, otpCodeRepository);
        typedi_1.Container.set('otpCodeRepository', otpCodeRepository);
        const auditLogRepository = new AuditLogRepository_1.AuditLogRepository(this.prisma);
        typedi_1.Container.set(AuditLogRepository_1.AuditLogRepository, auditLogRepository);
        typedi_1.Container.set('auditLogRepository', auditLogRepository);
        logger_1.default.info('Repositories initialized');
    }
    initializeServices() {
        // Service instantiation with manual dependency injection from Container
        // Infrastructure
        const emailService = new EmailService_1.EmailService();
        typedi_1.Container.set(EmailService_1.EmailService, emailService);
        typedi_1.Container.set('emailService', emailService);
        const webSocketService = new WebSocketService_1.WebSocketService();
        typedi_1.Container.set(WebSocketService_1.WebSocketService, webSocketService);
        typedi_1.Container.set('webSocketService', webSocketService);
        // Core
        const auditService = new AuditService_1.AuditService(this.prisma);
        typedi_1.Container.set(AuditService_1.AuditService, auditService);
        const auditMiddleware = new AuditMiddleware_1.AuditMiddleware(auditService);
        typedi_1.Container.set(AuditMiddleware_1.AuditMiddleware, auditMiddleware);
        // Domain
        const emailVerificationService = new EmailVerificationService_1.EmailVerificationService(emailService, typedi_1.Container.get(UserRepository_1.UserRepository));
        typedi_1.Container.set(EmailVerificationService_1.EmailVerificationService, emailVerificationService);
        typedi_1.Container.set('emailVerificationService', emailVerificationService);
        const userService = new UserService_1.UserService(typedi_1.Container.get(UserRepository_1.UserRepository), typedi_1.Container.get(WalletRepository_1.WalletRepository), emailVerificationService, typedi_1.Container.get(SessionRepository_1.SessionRepository), this.prisma);
        typedi_1.Container.set(UserService_1.UserService, userService);
        typedi_1.Container.set('userService', userService);
        const authService = new AuthService_1.AuthService(typedi_1.Container.get(UserRepository_1.UserRepository), typedi_1.Container.get(WalletRepository_1.WalletRepository), emailVerificationService, typedi_1.Container.get(SessionRepository_1.SessionRepository), emailService, typedi_1.Container.get(OtpCodeRepository_1.OtpCodeRepository), typedi_1.Container.get(AuditLogRepository_1.AuditLogRepository), this.prisma, webSocketService);
        typedi_1.Container.set(AuthService_1.AuthService, authService);
        typedi_1.Container.set('authService', authService);
        const betService = new BetService_1.BetService(this.prisma, webSocketService);
        typedi_1.Container.set(BetService_1.BetService, betService);
        typedi_1.Container.set('betService', betService);
        const multiDeviceAuthService = new MultiDeviceAuthService_1.MultiDeviceAuthService(this.prisma, emailService, webSocketService);
        typedi_1.Container.set(MultiDeviceAuthService_1.MultiDeviceAuthService, multiDeviceAuthService);
        typedi_1.Container.set('multiDeviceAuthService', multiDeviceAuthService);
        logger_1.default.info('Services initialized');
    }
    // Getters for public access (Backward Compatibility)
    get userRepository() { return typedi_1.Container.get(UserRepository_1.UserRepository); }
    get walletRepository() { return typedi_1.Container.get(WalletRepository_1.WalletRepository); }
    get sessionRepository() { return typedi_1.Container.get(SessionRepository_1.SessionRepository); }
    get otpCodeRepository() { return typedi_1.Container.get(OtpCodeRepository_1.OtpCodeRepository); }
    get auditLogRepository() { return typedi_1.Container.get(AuditLogRepository_1.AuditLogRepository); }
    get userService() { return typedi_1.Container.get(UserService_1.UserService); }
    get authService() { return typedi_1.Container.get(AuthService_1.AuthService); }
    get emailService() { return typedi_1.Container.get(EmailService_1.EmailService); }
    get emailVerificationService() { return typedi_1.Container.get(EmailVerificationService_1.EmailVerificationService); }
    get webSocketService() { return typedi_1.Container.get(WebSocketService_1.WebSocketService); }
    get auditService() { return typedi_1.Container.get(AuditService_1.AuditService); }
    get auditMiddleware() { return typedi_1.Container.get(AuditMiddleware_1.AuditMiddleware); }
    get betService() { return typedi_1.Container.get(BetService_1.BetService); }
    get multiDeviceAuthService() { return typedi_1.Container.get(MultiDeviceAuthService_1.MultiDeviceAuthService); }
}
exports.ServiceContainer = ServiceContainer;
const initializeServices = () => __awaiter(void 0, void 0, void 0, function* () {
    const container = ServiceContainer.getInstance();
    yield container.initialize();
    return container;
});
exports.initializeServices = initializeServices;

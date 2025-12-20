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
const prismaClient_1 = __importDefault(require("../config/prismaClient")); // Import singleton
const Logger_1 = __importDefault(require("../utils/Logger"));
const UserService_1 = require("../services/UserService");
const AuthService_1 = require("../services/AuthService");
const WebSocketService_1 = require("../services/WebSocketService");
const EmailService_1 = require("../services/EmailService");
const EmailVerificationService_1 = require("../services/EmailVerificationService");
const UserRepository_1 = require("../repositories/UserRepository");
const WalletRepository_1 = require("../repositories/WalletRepository");
const SessionRepository_1 = require("../repositories/SessionRepository");
const OtpCodeRepository_1 = require("../repositories/OtpCodeRepository");
const AuditLogRepository_1 = require("../repositories/AuditLogRepository");
class ServiceContainer {
    constructor() {
        this.initialized = false;
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
                Logger_1.default.info('Service container already initialized');
                return;
            }
            Logger_1.default.info('Initializing service container...');
            try {
                this.initializePrisma();
                this.initializeRepositories();
                this.initializeServices();
                this.initialized = true;
                Logger_1.default.info('Service container initialized successfully');
            }
            catch (error) {
                Logger_1.default.error('Failed to initialize service container', error);
                throw error;
            }
        });
    }
    initializePrisma() {
        this.prisma = prismaClient_1.default;
    }
    initializeRepositories() {
        this.userRepository = new UserRepository_1.UserRepository(this.prisma);
        this.walletRepository = new WalletRepository_1.WalletRepository(this.prisma);
        this.sessionRepository = new SessionRepository_1.SessionRepository(this.prisma);
        this.otpCodeRepository = new OtpCodeRepository_1.OtpCodeRepository(this.prisma); // Assuming constructor signature
        this.auditLogRepository = new AuditLogRepository_1.AuditLogRepository(this.prisma); // Assuming constructor signature
        Logger_1.default.info('Repositories initialized');
    }
    initializeServices() {
        // Infrastructure Services
        this.emailService = new EmailService_1.EmailService();
        this.webSocketService = new WebSocketService_1.WebSocketService();
        // Domain Services
        this.emailVerificationService = new EmailVerificationService_1.EmailVerificationService(this.emailService, this.userRepository);
        this.userService = new UserService_1.UserService(this.userRepository, this.walletRepository, this.emailVerificationService, this.sessionRepository, this.prisma);
        this.authService = new AuthService_1.AuthService(this.userRepository, this.walletRepository, this.emailVerificationService, this.sessionRepository, this.emailService, this.otpCodeRepository, this.auditLogRepository, this.prisma, this.webSocketService);
        Logger_1.default.info('Services initialized');
    }
}
exports.ServiceContainer = ServiceContainer;
const initializeServices = () => __awaiter(void 0, void 0, void 0, function* () {
    const container = ServiceContainer.getInstance();
    yield container.initialize();
    return container;
});
exports.initializeServices = initializeServices;

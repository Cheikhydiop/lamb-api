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
exports.webSocketService = exports.server = exports.config = exports.prisma = exports.app = void 0;
// index.ts ou app.ts - CODE COMPLET SÉCURISÉ AVEC WEBSOCKET
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const prismaClient_1 = __importDefault(require("./config/prismaClient")); // Import singleton
exports.prisma = prismaClient_1.default;
// import Container from 'typedi'; // Removed TypeDI
const env_1 = require("./config/env");
Object.defineProperty(exports, "config", { enumerable: true, get: function () { return env_1.config; } });
const errorHandler_1 = require("./middlewares/errorHandler");
const index_1 = __importDefault(require("./routes/index"));
const logger_1 = __importDefault(require("./utils/logger"));
const ipExtractor_1 = require("./middlewares/ipExtractor");
const rateLimitMiddleware_1 = require("./middlewares/rateLimitMiddleware");
const bigIntSerializer_1 = require("./middlewares/bigIntSerializer");
const CronService_1 = require("./services/CronService"); // Used manually
const sanitizationMiddleware_1 = require("./middlewares/sanitizationMiddleware");
const idempotencyMiddleware_1 = require("./middlewares/idempotencyMiddleware");
const ServiceContainer_1 = require("./container/ServiceContainer");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
// ========== IMPORTS DES MIDDLEWARES DE SÉCURITÉ ==========
const security_1 = require("./middlewares/security");
const app = (0, express_1.default)();
exports.app = app;
// Créer le serveur HTTP explicitement
const server = http_1.default.createServer(app);
exports.server = server;
// TRÈS IMPORTANT pour avoir la vraie IP derrière un proxy
app.set('trust proxy', 1);
// ========== FIX BIGINT GLOBAL ==========
BigInt.prototype.toJSON = function () {
    return this.toString(); // Convertir BigInt en string
};
// ========== MIDDLEWARES DE SÉCURITÉ (EN PREMIER!) ==========
// 1. Headers de sécurité Helmet + custom
app.use(security_1.securityHeaders);
// 2. Route pour les rapports de violation CSP (AVANT body parsers)
app.post('/api/v1/csp-violation-report', express_1.default.json({ type: 'application/csp-report' }), security_1.cspViolationReport);
// ========== MIDDLEWARES DE BASE ==========
// Middleware pour extraire l'IP
app.use(ipExtractor_1.ipExtractor);
// Body parsers - MOVED UP so sanitization works!
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Middleware de sérialisation BigInt (pour JSON)
app.use(bigIntSerializer_1.bigIntSerializer);
// Swagger Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// ==================== MIDDLEWARES DE SÉCURITÉ GLOBAUX ====================
// 1. Rate Limiting Global
app.use((0, rateLimitMiddleware_1.rateLimitMiddleware)({
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 100, // 100 requests per minute per IP globally
    message: 'Too many requests from this IP, please try again later.'
}));
app.use(rateLimitMiddleware_1.rateLimitInfoMiddleware);
// 2. Sanitization (XSS)
app.use(sanitizationMiddleware_1.sanitizationMiddleware);
// 3. Idempotency
app.use(idempotencyMiddleware_1.idempotencyMiddleware);
// Compression
app.use((0, compression_1.default)());
// CORS
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Allow any localhost origin for development
        if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === env_1.config.corsOrigin) {
            return callback(null, true);
        }
        // Check specific allowed origins from config
        if (env_1.config.corsOrigin.split(',').includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Device-Id', 'X-App-Version'],
    maxAge: 86400 // 24 hours
}));
// Middleware pour ajouter les infos de rate limiting
app.use(rateLimitMiddleware_1.rateLimitInfoMiddleware);
// ========== INITIALISATION DES SERVICES ==========
let webSocketService = null; // To hold the instance for graceful shutdown
exports.webSocketService = webSocketService;
// Route pour vérifier l'état du WebSocket
app.get('/api/ws/status', (req, res) => {
    if (webSocketService && webSocketService.isInitialized()) {
        const stats = webSocketService.getConnectionStats();
        res.json({
            success: true,
            status: 'running',
            stats,
            endpoint: `ws://localhost:${env_1.config.port}/ws`
        });
    }
    else {
        res.status(503).json({
            success: false,
            status: 'not_initialized',
            message: 'WebSocket service not available'
        });
    }
});
// Route pour tester le WebSocket (sécurisée en production)
if (env_1.config.nodeEnv !== 'production') {
    app.post('/api/ws/test', (req, res) => {
        try {
            const { message } = req.body;
            if (!webSocketService) {
                res.status(503).json({
                    success: false,
                    message: 'Service WebSocket non initialisé'
                });
                return;
            }
            // Diffuser un message de test
            const testMessage = {
                type: 'SYSTEM_ALERT',
                title: 'Test Message',
                message: message || 'This is a test WebSocket message',
                severity: 'INFO',
                timestamp: new Date().toISOString()
            };
            webSocketService.broadcastSystemAlert(testMessage);
            res.json({
                success: true,
                message: 'Test WebSocket message sent',
                data: testMessage
            });
        }
        catch (error) {
            logger_1.default.error('WebSocket test error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send test message',
                error: error.message
            });
        }
    });
}
// ========== INITIALISATION DES ROUTES ==========
// NOTE: Les routes nécessitent désormais l'utilisation de ServiceContainer au lieu de Container.get()
// Les fichiers de routes doivent être mis à jour.
// Routes(app); // MOVED to startServer to ensure ServiceContainer is initialized
// ========== HANDLERS D'ERREURS ==========
// Handler 404 (DOIT ÊTRE AVANT errorHandler)
app.use(errorHandler_1.notFoundHandler);
// Middleware de gestion des erreurs (DOIT ÊTRE LE DERNIER)
app.use(errorHandler_1.errorHandler);
// ========== FONCTION D'ARRÊT PROPRE ==========
const gracefulShutdown = (signal) => __awaiter(void 0, void 0, void 0, function* () {
    if (signal) {
        logger_1.default.info(`Received ${signal}, shutting down gracefully...`);
    }
    else {
        logger_1.default.info('Shutting down gracefully...');
    }
    try {
        // Arrêter le WebSocket service
        if (webSocketService) {
            webSocketService.destroy();
            logger_1.default.info('WebSocket service stopped');
        }
        yield prismaClient_1.default.$disconnect();
        logger_1.default.info('Database connection closed');
    }
    catch (error) {
        logger_1.default.error('Error during shutdown:', error);
    }
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});
// ========== GESTION DES ERREURS GLOBALES ==========
process.on('uncaughtException', (error) => {
    logger_1.default.error('❌ Uncaught Exception:', error);
    logger_1.default.error('Stack:', error.stack);
    if (env_1.config.nodeEnv !== 'production') {
        logger_1.default.warn('⚠️ Continuing in development mode despite uncaught exception');
    }
    else {
        gracefulShutdown();
    }
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    if (env_1.config.nodeEnv !== 'production') {
        logger_1.default.warn('⚠️ Continuing in development mode despite unhandled rejection');
    }
    else {
        gracefulShutdown();
    }
});
// Gestion des signaux d'arrêt
const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
shutdownSignals.forEach(signal => {
    process.on(signal, () => gracefulShutdown(signal));
});
// ========== FONCTION DE DÉMARRAGE ==========
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.info('🚀 Starting Better API Server...');
        logger_1.default.info(`📁 Environment: ${env_1.config.nodeEnv}`);
        logger_1.default.info(`🔧 Configuration loaded: PORT=${env_1.config.port}, CORS=${env_1.config.corsOrigin}`);
        // Initialiser les services (y compris Prisma)
        const container = yield (0, ServiceContainer_1.initializeServices)();
        // Configurer les routes APRÈS l'initialisation des services
        (0, index_1.default)(app);
        // Récupérer le service WebSocket du conteneur
        exports.webSocketService = webSocketService = container.webSocketService;
        webSocketService.initialize(server);
        logger_1.default.info('✅ WebSocket service initialized');
        // Initialiser CronService (si nécessaire)
        // Nous supposons que CronService peut être instancié manuellement pour l'instant
        // TODO: Ajouter CronService au container
        try {
            const cronService = new CronService_1.CronService();
            // cronService.initialize(); // Uncomment if CronService has initialize method
            logger_1.default.info('✅ Cron Service initialized');
        }
        catch (e) {
            logger_1.default.warn('⚠️ Cron Service initialization specific logic should be checked', e);
        }
        logger_1.default.info('🔌 Attempting to connect to the database...');
        yield prismaClient_1.default.$connect();
        logger_1.default.info('✅ Successfully connected to the database');
        // Test de connexion
        try {
            const userCount = yield prismaClient_1.default.user.count();
            logger_1.default.info(`📊 Database connection test successful. User count: ${userCount}`);
        }
        catch (dbError) {
            logger_1.default.warn('⚠️ Database count failed, but connection is established:', dbError.message);
        }
        // Démarrer le serveur HTTP
        server.listen(env_1.config.port, () => {
            logger_1.default.info(`🎉 Server is running on port ${env_1.config.port}`);
            logger_1.default.info(`🔒 Trust proxy: ${app.get('trust proxy')}`);
            logger_1.default.info(`🌐 CORS Origin: ${env_1.config.corsOrigin}`);
            logger_1.default.info(`🛡️  Security: ENABLED (Helmet + Custom Headers)`);
            if (webSocketService && webSocketService.isInitialized()) {
                logger_1.default.info(`📡 WebSocket available at: ws://localhost:${env_1.config.port}/ws`);
            }
            else {
                logger_1.default.warn('⚠️ WebSocket not available');
            }
            logger_1.default.info('📡 Ready to accept connections!');
            logger_1.default.info('='.repeat(60));
        });
        // Gestion des erreurs du serveur
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger_1.default.error(`❌ Port ${env_1.config.port} is already in use`);
            }
            else {
                logger_1.default.error('❌ Server error:', error);
            }
            gracefulShutdown();
        });
    }
    catch (error) {
        logger_1.default.error('💥 Failed to start server:', error);
        logger_1.default.error('Stack:', error.stack);
        try {
            yield prismaClient_1.default.$disconnect();
        }
        catch (disconnectError) {
            logger_1.default.error('Failed to disconnect from database:', disconnectError);
        }
        process.exit(1);
    }
});
// Démarrer le serveur
if (require.main === module) {
    startServer();
}

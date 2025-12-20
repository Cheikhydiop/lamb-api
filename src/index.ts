// index.ts ou app.ts - CODE COMPLET SÉCURISÉ AVEC WEBSOCKET
import 'reflect-metadata'; // ⚠️ TRÈS IMPORTANT - DOIT ÊTRE EN PREMIER
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import Container from 'typedi';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import Routes from './routes/index';
import logger from './utils/Logger';
import { ipExtractor } from './middlewares/ipExtractor';
import { rateLimitInfoMiddleware, rateLimitMiddleware } from './middlewares/rateLimitMiddleware';
import { bigIntSerializer } from './middlewares/bigIntSerializer';
import { WebSocketService } from './services/WebSocketService';
import { CronService } from './services/CronService';
import { sanitizationMiddleware } from './middlewares/sanitizationMiddleware';
import { idempotencyMiddleware } from './middlewares/idempotencyMiddleware';

// ========== IMPORTS DES MIDDLEWARES DE SÉCURITÉ ==========
import {
  securityHeaders,
  cspViolationReport,
  transactionSecurity,
  websocketSecurity
} from './middlewares/security';

// Initialiser Prisma avec timeout augmenté
const prisma = new PrismaClient({
  log: config.nodeEnv === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  transactionOptions: {
    maxWait: 15000,
    timeout: 30000,
  },
});

// Enregistrer Prisma dans le conteneur TypeDI
Container.set(PrismaClient, prisma);

const app = express();

// Créer le serveur HTTP explicitement
const server = http.createServer(app);

// TRÈS IMPORTANT pour avoir la vraie IP derrière un proxy
app.set('trust proxy', 1);

// ========== FIX BIGINT GLOBAL ==========
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// ========== MIDDLEWARES DE SÉCURITÉ (EN PREMIER!) ==========
// 1. Headers de sécurité Helmet + custom
app.use(securityHeaders);

// 2. Route pour les rapports de violation CSP (AVANT body parsers)
app.post(
  '/api/v1/csp-violation-report',
  express.json({ type: 'application/csp-report' }),
  cspViolationReport
);

// ========== MIDDLEWARES DE BASE ==========
// Middleware pour extraire l'IP
app.use(ipExtractor);

// Body parsers - MOVED UP so sanitization works!
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de sérialisation BigInt (pour JSON)
app.use(bigIntSerializer);

// ==================== MIDDLEWARES DE SÉCURITÉ GLOBAUX ====================
// 1. Rate Limiting Global
app.use(rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 100, // 100 requests per minute per IP globally
  message: 'Too many requests from this IP, please try again later.'
}) as any);
app.use(rateLimitInfoMiddleware as any);

// 2. Sanitization (XSS)
app.use(sanitizationMiddleware as any);

// 3. Idempotency
app.use(idempotencyMiddleware as any);

// Compression
app.use(compression());

// CORS
// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow any localhost origin for development
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === config.corsOrigin) {
      return callback(null, true);
    }

    // Check specific allowed origins from config
    if (config.corsOrigin.split(',').includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-IP', 'X-Request-ID']
}));

// Middleware pour ajouter les infos de rate limiting
app.use(rateLimitInfoMiddleware);

// ========== INITIALISATION WEBSOCKET SÉCURISÉ ==========
let webSocketService: WebSocketService | null = null;

try {
  // Initialiser le service WebSocket
  webSocketService = WebSocketService.getInstance();
  webSocketService.initialize(server);

  logger.info('✅ WebSocket service initialized');

  // Exposer le service pour les autres modules
  Container.set(WebSocketService, webSocketService);

  // Route pour vérifier l'état du WebSocket
  app.get('/api/ws/status', (req, res) => {
    if (webSocketService && webSocketService.isInitialized()) {
      const stats = webSocketService.getConnectionStats();
      res.json({
        success: true,
        status: 'running',
        stats,
        endpoint: `ws://localhost:${config.port}/ws`
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'not_initialized',
        message: 'WebSocket service not available'
      });
    }
  });

  // Initialiser le Cron Service
  try {
    const cronService = Container.get(CronService);
    cronService.init();
  } catch (e) {
    logger.error('Failed to initialize CronService', e);
  }

  // Route pour tester le WebSocket (sécurisée en production)
  if (config.nodeEnv !== 'production') {
    app.post('/api/ws/test', (req, res) => {
      try {
        const { message } = req.body;

        if (!webSocketService) {
          return res.status(503).json({
            success: false,
            message: 'WebSocket service not initialized'
          });
        }

        // Diffuser un message de test
        const testMessage = {
          type: 'SYSTEM_ALERT',
          title: 'Test Message',
          message: message || 'This is a test WebSocket message',
          severity: 'INFO' as const,
          timestamp: new Date().toISOString()
        };

        webSocketService.broadcastSystemAlert(testMessage);

        res.json({
          success: true,
          message: 'Test WebSocket message sent',
          data: testMessage
        });
      } catch (error: any) {
        logger.error('WebSocket test error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to send test message',
          error: error.message
        });
      }
    });
  }

} catch (error: any) {
  logger.error('❌ Failed to initialize WebSocket service:', error);
  logger.warn('⚠️ Continuing without WebSocket support');
}
// ========== FIN INITIALISATION WEBSOCKET ==========

// ========== ROUTES AVEC SÉCURITÉ ADDITIONNELLE ==========
// Note: Les routes sensibles (wallet, transactions) auront
// le middleware transactionSecurity automatiquement
// si vous l'avez configuré dans Routes(app)
Routes(app);

// Ou configurez-les manuellement ici:
/*
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import transactionRoutes from './routes/transaction.routes';
import betRoutes from './routes/bet.routes';
import fightRoutes from './routes/fight.routes';
import adminRoutes from './routes/admin.routes';
import { authenticate, isAdmin } from './middlewares/auth.middleware';

// Routes publiques
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/fights', fightRoutes);

// Routes protégées avec sécurité renforcée
app.use('/api/v1/wallet', authenticate, transactionSecurity, walletRoutes);
app.use('/api/v1/transactions', authenticate, transactionSecurity, transactionRoutes);
app.use('/api/v1/bets', authenticate, betRoutes);

// Routes admin
app.use('/api/v1/admin', authenticate, isAdmin, adminRoutes);
*/

// ========== HANDLERS D'ERREURS ==========
// Handler 404 (DOIT ÊTRE AVANT errorHandler)
app.use(notFoundHandler);

// Middleware de gestion des erreurs (DOIT ÊTRE LE DERNIER)
app.use(errorHandler);

// ========== FONCTION D'ARRÊT PROPRE ==========
const gracefulShutdown = async (signal?: string) => {
  if (signal) {
    logger.info(`Received ${signal}, shutting down gracefully...`);
  } else {
    logger.info('Shutting down gracefully...');
  }

  try {
    // Arrêter le WebSocket service
    if (webSocketService) {
      webSocketService.destroy();
      logger.info('WebSocket service stopped');
    }

    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error: any) {
    logger.error('Error during shutdown:', error);
  }

  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

// ========== GESTION DES ERREURS GLOBALES ==========
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  logger.error('Stack:', error.stack);

  if (config.nodeEnv !== 'production') {
    logger.warn('⚠️ Continuing in development mode despite uncaught exception');
  } else {
    gracefulShutdown();
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);

  if (config.nodeEnv !== 'production') {
    logger.warn('⚠️ Continuing in development mode despite unhandled rejection');
  } else {
    gracefulShutdown();
  }
});

// Gestion des signaux d'arrêt
const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
shutdownSignals.forEach(signal => {
  process.on(signal, () => gracefulShutdown(signal));
});

// ========== FONCTION DE DÉMARRAGE ==========
const startServer = async () => {
  try {
    logger.info('🚀 Starting Better API Server...');
    logger.info(`📁 Environment: ${config.nodeEnv}`);
    logger.info(`🔧 Configuration loaded: PORT=${config.port}, CORS=${config.corsOrigin}`);

    logger.info('🔌 Attempting to connect to the database...');

    await prisma.$connect();
    logger.info('✅ Successfully connected to the database');

    // Test de connexion
    try {
      const userCount = await prisma.user.count();
      logger.info(`📊 Database connection test successful. User count: ${userCount}`);
    } catch (dbError: any) {
      logger.warn('⚠️ Database count failed, but connection is established:', dbError.message);
    }

    // Démarrer le serveur HTTP
    server.listen(config.port, () => {
      logger.info(`🎉 Server is running on port ${config.port}`);
      logger.info(`🔒 Trust proxy: ${app.get('trust proxy')}`);
      logger.info(`🌐 CORS Origin: ${config.corsOrigin}`);
      logger.info(`🛡️  Security: ENABLED (Helmet + Custom Headers)`);

      if (webSocketService && webSocketService.isInitialized()) {
        logger.info(`📡 WebSocket available at: ws://localhost:${config.port}/ws`);
      } else {
        logger.warn('⚠️ WebSocket not available');
      }

      logger.info('📡 Ready to accept connections!');
      logger.info('='.repeat(60));
    });

    // Gestion des erreurs du serveur
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${config.port} is already in use`);
      } else {
        logger.error('❌ Server error:', error);
      }
      gracefulShutdown();
    });

  } catch (error: any) {
    logger.error('💥 Failed to start server:', error);
    logger.error('Stack:', error.stack);

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      logger.error('Failed to disconnect from database:', disconnectError);
    }

    process.exit(1);
  }
};

// Démarrer le serveur
if (require.main === module) {
  startServer();
}

// Export pour les tests
export { app, prisma, config, server, webSocketService };
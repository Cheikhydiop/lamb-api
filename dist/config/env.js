"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_URL = exports.FRONTEND_URL = exports.JWT_SECRET = exports.DATABASE_URL = exports.NODE_ENV = exports.PORT = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../utils/logger"));
// Charger les variables d'environnement
dotenv_1.default.config();
// Validation des variables d'environnement requises
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT'
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger_1.default.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}
// Configuration exportée
exports.config = {
    // Server
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    // Database
    databaseUrl: process.env.DATABASE_URL,
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },
    // Email
    email: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.EMAIL_FROM || 'noreply@better.com',
    },
    // CORS
    corsOrigin: process.env.CORS_ORIGIN || '*',
    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
    // Mobile Money
    wave: {
        apiKey: process.env.WAVE_API_KEY,
        merchantKey: process.env.WAVE_MERCHANT_KEY,
    },
    orangeMoney: {
        apiKey: process.env.ORANGE_MONEY_API_KEY,
        merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY,
    },
    // Payment Configuration
    payment: {
        mode: process.env.PAYMENT_MODE || 'TEST', // TEST or PRODUCTION
        wave: {
            apiKey: process.env.WAVE_API_KEY,
            apiSecret: process.env.WAVE_API_SECRET,
            merchantId: process.env.WAVE_MERCHANT_ID,
            businessPhone: process.env.WAVE_BUSINESS_PHONE,
            webhookSecret: process.env.WAVE_WEBHOOK_SECRET,
            apiUrl: process.env.WAVE_API_URL || 'https://api.wave.com/v1'
        },
        orangeMoney: {
            apiKey: process.env.ORANGE_MONEY_API_KEY,
            apiSecret: process.env.ORANGE_MONEY_API_SECRET,
            merchantId: process.env.ORANGE_MONEY_MERCHANT_ID,
            businessPhone: process.env.ORANGE_MONEY_BUSINESS_PHONE,
            webhookSecret: process.env.ORANGE_MONEY_WEBHOOK_SECRET,
            apiUrl: process.env.ORANGE_MONEY_API_URL || 'https://api.orange.sn/omoney/v1'
        },
        freeMoney: {
            apiKey: process.env.FREE_MONEY_API_KEY,
            apiSecret: process.env.FREE_MONEY_API_SECRET,
            merchantId: process.env.FREE_MONEY_MERCHANT_ID,
            businessPhone: process.env.FREE_MONEY_BUSINESS_PHONE,
            webhookSecret: process.env.FREE_MONEY_WEBHOOK_SECRET,
            apiUrl: process.env.FREE_MONEY_API_URL || 'https://api.free.sn/payment/v1'
        },
        limits: {
            minDeposit: parseInt(process.env.MIN_DEPOSIT_AMOUNT || '500', 10),
            maxDeposit: parseInt(process.env.MAX_DEPOSIT_AMOUNT || '1000000', 10),
            minWithdrawal: parseInt(process.env.MIN_WITHDRAWAL_AMOUNT || '1000', 10),
            maxWithdrawal: parseInt(process.env.MAX_WITHDRAWAL_AMOUNT || '500000', 10)
        }
    },
    // Application URLs - AJOUTÉ
    app: {
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        apiUrl: process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'https://jealous-giraffe-ndigueul-efe7a113.koyeb.app' : 'http://localhost:5000'),
        webUrl: process.env.WEB_URL || 'http://localhost:3000'
    }
};
// Export individuel pour compatibilité
exports.PORT = exports.config.port;
exports.NODE_ENV = exports.config.nodeEnv;
exports.DATABASE_URL = exports.config.databaseUrl;
exports.JWT_SECRET = exports.config.jwt.secret;
exports.FRONTEND_URL = exports.config.app.frontendUrl; // Ajouté
exports.API_URL = exports.config.app.apiUrl; // Ajouté
exports.default = exports.config;

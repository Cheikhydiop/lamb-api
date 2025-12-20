"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = void 0;
// src/middlewares/authRateLimiter.ts
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const RateLimitInfo_1 = require("../utils/RateLimitInfo");
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives par windowMs
    keyGenerator: (req) => {
        // Combiner IP + email pour une meilleure précision
        return `${req.ip}-${req.body.email || 'unknown'}`;
    },
    skipSuccessfulRequests: true, // Ne pas compter les succès
    handler: (req, res) => {
        // Obtenir les infos de rate limiting
        const rateLimitInfo = RateLimitInfo_1.RateLimitUtils.getRateLimitInfo(req);
        const message = rateLimitInfo
            ? RateLimitInfo_1.RateLimitUtils.generateWarningMessage(rateLimitInfo)
            : 'Too many attempts, please try again later';
        res.status(429).json(Object.assign({ success: false, message: message, code: 'RATE_LIMIT_EXCEEDED' }, (rateLimitInfo && {
            retryAfter: Math.ceil(rateLimitInfo.windowMs / 1000),
            resetTime: rateLimitInfo.resetTime
        })));
    },
    standardHeaders: true, // Retourne les headers RFC 6585
    legacyHeaders: false // Désactive les headers X-RateLimit-*
});

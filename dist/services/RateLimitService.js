"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const RateLimitInfo_1 = require("../utils/RateLimitInfo");
class RateLimitService {
    /**
     * Vérifie si une requête est bloquée par le rate limiting
     */
    static checkRateLimit(req) {
        const rateLimitInfo = RateLimitInfo_1.RateLimitUtils.getRateLimitInfo(req);
        if (!rateLimitInfo) {
            return {
                isBlocked: false,
                rateLimitInfo: null,
                remainingAttempts: this.MAX_ATTEMPTS
            };
        }
        return {
            isBlocked: rateLimitInfo.remaining <= 0,
            rateLimitInfo,
            remainingAttempts: rateLimitInfo.remaining
        };
    }
    /**
     * Génère une réponse d'erreur pour le rate limiting
     */
    static createRateLimitError(rateLimitInfo) {
        return RateLimitInfo_1.RateLimitUtils.createRateLimitError(rateLimitInfo);
    }
    /**
     * Vérifie si l'utilisateur approche de la limite
     */
    static isApproachingLimit(rateLimitInfo) {
        return RateLimitInfo_1.RateLimitUtils.isApproachingLimit(rateLimitInfo);
    }
}
exports.RateLimitService = RateLimitService;
RateLimitService.RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
RateLimitService.MAX_ATTEMPTS = 5;

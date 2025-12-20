"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRateLimitMonitor = exports.rateLimitMiddleware = exports.RateLimitUtils = void 0;
/**
 * Utilitaire pour récupérer et gérer les informations de rate limiting
 */
class RateLimitUtils {
    /**
     * Extrait les informations de rate limiting depuis une requête
     * Supporte plusieurs formats de headers (RFC 6585, headers customisés)
     */
    static getRateLimitInfo(req) {
        try {
            // Vérifier si le rate limiting est activé pour cette route
            if (!this.isRateLimitedRoute(req)) {
                return null;
            }
            // Headers selon RFC 6585 et pratiques courantes
            const remaining = this.parseHeader(req, [
                'RateLimit-Remaining',
                'X-RateLimit-Remaining',
                'ratelimit-remaining'
            ]);
            const limit = this.parseHeader(req, [
                'RateLimit-Limit',
                'X-RateLimit-Limit',
                'ratelimit-limit'
            ], this.DEFAULT_LIMIT);
            const resetTimestamp = this.parseHeader(req, [
                'RateLimit-Reset',
                'X-RateLimit-Reset',
                'ratelimit-reset',
                'X-RateLimit-Reset-Timestamp'
            ]);
            const retryAfter = this.parseHeader(req, [
                'Retry-After',
                'X-Retry-After'
            ]);
            // Si aucun header de rate limit n'est trouvé
            if (remaining === null && limit === this.DEFAULT_LIMIT && resetTimestamp === null) {
                return null;
            }
            let resetTime;
            if (resetTimestamp) {
                // Timestamp peut être en secondes UNIX ou en format ISO
                if (/^\d+$/.test(resetTimestamp)) {
                    const timestamp = parseInt(resetTimestamp, 10);
                    // Si le timestamp est en secondes (typique pour UNIX timestamp)
                    if (timestamp < 10000000000) {
                        resetTime = new Date(timestamp * 1000);
                    }
                    else {
                        resetTime = new Date(timestamp);
                    }
                }
                else {
                    // Essayer de parser comme date ISO
                    resetTime = new Date(resetTimestamp);
                }
            }
            else {
                // Calculer le reset time basé sur l'heure actuelle + window par défaut
                resetTime = new Date(Date.now() + this.DEFAULT_WINDOW_MS);
            }
            // Calculer combien de tentatives ont été utilisées
            const used = limit - (remaining !== null ? remaining : 0);
            return {
                remaining: remaining !== null ? remaining : Math.max(0, limit - used),
                limit,
                resetTime,
                windowMs: this.calculateWindowMs(resetTime),
                used,
                retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined
            };
        }
        catch (error) {
            console.error('Error parsing rate limit headers:', error);
            return null;
        }
    }
    /**
     * Parse un header avec plusieurs noms possibles
     */
    static parseHeader(req, headerNames, defaultValue = null) {
        for (const headerName of headerNames) {
            const value = req.get(headerName);
            if (value !== undefined && value !== null) {
                return value;
            }
        }
        return defaultValue !== null ? defaultValue.toString() : null;
    }
    /**
     * Calcule la durée de la fenêtre en ms
     */
    static calculateWindowMs(resetTime) {
        return Math.max(0, resetTime.getTime() - Date.now());
    }
    /**
     * Vérifie si la route est sujette au rate limiting
     */
    static isRateLimitedRoute(req) {
        // Routes qui devraient avoir du rate limiting
        const rateLimitedRoutes = [
            '/api/auth/login',
            '/api/auth/verify-mail',
            '/api/auth/register',
            '/api/auth/reset-password',
            '/api/auth/forgot-password'
        ];
        return rateLimitedRoutes.some(route => req.path.startsWith(route));
    }
    /**
     * Génère un message d'avertissement pour les tentatives échouées
     */
    static generateWarningMessage(rateLimitInfo) {
        const now = Date.now();
        const resetTime = rateLimitInfo.resetTime.getTime();
        const remainingMs = Math.max(0, resetTime - now);
        if (rateLimitInfo.remaining <= 0) {
            if (rateLimitInfo.retryAfter) {
                const retryInSeconds = rateLimitInfo.retryAfter;
                return `Too many attempts. Please try again in ${this.formatTime(retryInSeconds * 1000)}.`;
            }
            const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
            return `Too many attempts. Account temporarily locked. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`;
        }
        if (rateLimitInfo.remaining === 1) {
            return `⚠️ Last attempt remaining! After this, your account will be temporarily locked for ${Math.ceil(remainingMs / (60 * 1000))} minutes.`;
        }
        if (this.isApproachingLimit(rateLimitInfo)) {
            const minutes = Math.ceil(remainingMs / (60 * 1000));
            return `Warning: ${rateLimitInfo.remaining} attempts remaining. Account will be temporarily locked after ${rateLimitInfo.limit} failed attempts for ${minutes} minutes.`;
        }
        return `${rateLimitInfo.remaining} attempts remaining out of ${rateLimitInfo.limit}.`;
    }
    /**
     * Formatte le temps en format lisible
     */
    static formatTime(ms) {
        const minutes = Math.floor(ms / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }
    /**
     * Vérifie si l'utilisateur approche de la limite
     */
    static isApproachingLimit(rateLimitInfo) {
        return rateLimitInfo.remaining <= Math.ceil(rateLimitInfo.limit * 0.3); // 30% restants
    }
    /**
     * Vérifie si l'utilisateur a dépassé la limite
     */
    static isOverLimit(rateLimitInfo) {
        return rateLimitInfo.remaining <= 0;
    }
    /**
     * Génère une réponse d'erreur standardisée pour le rate limiting
     */
    static createRateLimitError(rateLimitInfo) {
        const remainingMs = Math.max(0, rateLimitInfo.resetTime.getTime() - Date.now());
        const retryAfter = Math.ceil(remainingMs / 1000);
        return {
            success: false,
            message: this.generateWarningMessage(rateLimitInfo),
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
            resetTime: rateLimitInfo.resetTime
        };
    }
    /**
     * Calcule le temps d'attente recommandé avant la prochaine tentative
     */
    static calculateBackoffTime(rateLimitInfo, attemptCount) {
        if (this.isOverLimit(rateLimitInfo)) {
            return rateLimitInfo.retryAfter ||
                Math.max(1000, Math.min(30000, Math.pow(2, attemptCount) * 1000)); // Exponential backoff
        }
        // Backoff progressif basé sur le nombre de tentatives
        return Math.min(5000, Math.pow(1.5, attemptCount) * 100);
    }
    /**
     * Crée un objet de métriques pour le monitoring
     */
    static createMetrics(req, rateLimitInfo) {
        return {
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            rateLimitInfo: {
                remaining: rateLimitInfo.remaining,
                limit: rateLimitInfo.limit,
                used: rateLimitInfo.used,
                resetTime: rateLimitInfo.resetTime.toISOString(),
                windowMs: rateLimitInfo.windowMs
            }
        };
    }
    /**
     * Méthode de secours pour les tests et développement
     */
    static createMockRateLimitInfo(options = {}) {
        var _a, _b, _c, _d, _e;
        const defaultResetTime = new Date(Date.now() + this.DEFAULT_WINDOW_MS);
        return {
            remaining: (_a = options.remaining) !== null && _a !== void 0 ? _a : 4,
            limit: (_b = options.limit) !== null && _b !== void 0 ? _b : this.DEFAULT_LIMIT,
            resetTime: (_c = options.resetTime) !== null && _c !== void 0 ? _c : defaultResetTime,
            windowMs: (_d = options.windowMs) !== null && _d !== void 0 ? _d : this.DEFAULT_WINDOW_MS,
            used: (_e = options.used) !== null && _e !== void 0 ? _e : 1,
            retryAfter: options.retryAfter
        };
    }
}
exports.RateLimitUtils = RateLimitUtils;
RateLimitUtils.DEFAULT_LIMIT = 5;
RateLimitUtils.DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
/**
 * Middleware pour ajouter les infos de rate limiting à la réponse
 */
const rateLimitMiddleware = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        const rateLimitInfo = RateLimitUtils.getRateLimitInfo(req);
        if (rateLimitInfo && (req.path.includes('/auth/') || req.path.includes('/login'))) {
            // Ajouter les headers de rate limiting à la réponse
            res.setHeader('RateLimit-Limit', rateLimitInfo.limit);
            res.setHeader('RateLimit-Remaining', rateLimitInfo.remaining);
            res.setHeader('RateLimit-Reset', Math.floor(rateLimitInfo.resetTime.getTime() / 1000));
            // Ajouter les infos au corps de la réponse pour les clients frontend
            if (data && typeof data === 'object') {
                data.rateLimitInfo = {
                    remaining: rateLimitInfo.remaining,
                    limit: rateLimitInfo.limit,
                    resetTime: rateLimitInfo.resetTime.toISOString(),
                    warning: RateLimitUtils.generateWarningMessage(rateLimitInfo)
                };
            }
        }
        return originalJson.call(this, data);
    };
    next();
};
exports.rateLimitMiddleware = rateLimitMiddleware;
/**
 * Hook pour React/React Native pour surveiller le rate limiting
 */
const useRateLimitMonitor = () => {
    return {
        checkRateLimit: (response) => {
            if (response === null || response === void 0 ? void 0 : response.rateLimitInfo) {
                const info = response.rateLimitInfo;
                const resetTime = new Date(info.resetTime);
                const remainingMs = resetTime.getTime() - Date.now();
                return Object.assign(Object.assign({}, info), { isLimited: info.remaining <= 0, timeUntilReset: remainingMs, formattedTimeUntilReset: RateLimitUtils['formatTime'](remainingMs) });
            }
            return null;
        }
    };
};
exports.useRateLimitMonitor = useRateLimitMonitor;

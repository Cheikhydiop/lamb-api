"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginAttemptManager = void 0;
const logger_1 = __importDefault(require("./logger"));
// Store en mémoire pour compter les tentatives par IP
const failedLoginAttempts = new Map();
// Nettoyer le store toutes les 15 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of failedLoginAttempts.entries()) {
        if (now > data.resetTime) {
            failedLoginAttempts.delete(ip);
        }
    }
}, 15 * 60 * 1000);
class LoginAttemptManager {
    /**
     * Efface le compteur d'échecs pour une IP (appelé lors d'une connexion réussie)
     */
    static clearFailedAttempts(ip) {
        if (failedLoginAttempts.has(ip)) {
            failedLoginAttempts.delete(ip);
            logger_1.default.info(`✅ Successful login for IP ${ip} - failed attempts counter reset`);
        }
    }
    /**
     * Incrémente le compteur d'échecs et retourne les informations de rate limiting
     */
    static recordFailedAttempt(ip) {
        const now = Date.now();
        // Récupérer ou initialiser le compteur pour cette IP
        let attempts = failedLoginAttempts.get(ip);
        if (!attempts || now > attempts.resetTime) {
            attempts = { count: 0, resetTime: now + this.WINDOW_MS };
        }
        // Incrémenter le compteur d'échecs
        attempts.count++;
        const resetTime = new Date(now + this.WINDOW_MS);
        attempts.resetTime = resetTime.getTime();
        failedLoginAttempts.set(ip, attempts);
        const remaining = Math.max(0, this.MAX_ATTEMPTS - attempts.count);
        const isBlocked = attempts.count >= this.MAX_ATTEMPTS;
        logger_1.default.info(`🔍 IP ${ip} - Attempt ${attempts.count}/${this.MAX_ATTEMPTS}, ${remaining} remaining - Reset in ${this.WINDOW_MS / 1000}s`);
        if (isBlocked) {
            logger_1.default.error(`🚨 SECURITY ALERT: Rate limit exceeded for IP ${ip} - ${attempts.count} failed attempts - Wait ${this.WINDOW_MS / 1000}s`);
        }
        return {
            count: attempts.count,
            remaining,
            resetTime,
            isBlocked
        };
    }
    /**
     * Vérifie si une IP est actuellement bloquée
     */
    static isBlocked(ip) {
        const now = Date.now();
        const attempts = failedLoginAttempts.get(ip);
        if (!attempts || now > attempts.resetTime) {
            return false;
        }
        return attempts.count >= this.MAX_ATTEMPTS;
    }
    /**
     * Méthode utile pour les tests - affiche l'état actuel d'une IP
     */
    static getAttemptStatus(ip) {
        const now = Date.now();
        const attempts = failedLoginAttempts.get(ip);
        if (!attempts || now > attempts.resetTime) {
            return null;
        }
        return {
            count: attempts.count,
            timeUntilReset: Math.max(0, attempts.resetTime - now),
            isBlocked: attempts.count >= this.MAX_ATTEMPTS
        };
    }
}
exports.LoginAttemptManager = LoginAttemptManager;
LoginAttemptManager.WINDOW_MS = 10000; // 10 secondes pour les tests
LoginAttemptManager.MAX_ATTEMPTS = 5; // Augmenté pour les tests

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
// In-memory store for idempotency keys (Key -> { response, expiry })
// In production, use Redis!
const idempotencyStore = new Map();
// Cleanup interval (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of idempotencyStore.entries()) {
        if (data.expiry < now) {
            idempotencyStore.delete(key);
        }
    }
}, 5 * 60 * 1000);
const idempotencyMiddleware = (req, res, next) => {
    // Only apply to state-changing methods
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next();
    }
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (!idempotencyKey) {
        // If explicit idempotency is required for specific routes, handle that in the route handler or a stricter middleware variant.
        // For global middleware, we just skip if no header is present.
        return next();
    }
    const cachedResponse = idempotencyStore.get(idempotencyKey);
    const now = Date.now();
    if (cachedResponse && cachedResponse.expiry > now) {
        logger_1.default.info(`Idempotency hit for key: ${idempotencyKey}`);
        return res.status(cachedResponse.status).header('X-Idempotency-Hit', 'true').json(cachedResponse.body);
    }
    // Intercept the response to cache it
    const originalJson = res.json;
    // Override res.json to capture the body
    res.json = function (body) {
        // Only cache successful or specific error codes? 
        // Usually we cache the result of the operation regardless of success/failure if it's "processed".
        // But for simplicity let's cache everything that returns JSON.
        if (res.statusCode < 500) { // Don't cache server errors usually
            idempotencyStore.set(idempotencyKey, {
                status: res.statusCode,
                body: body,
                expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours expiry
            });
        }
        // Call the original json method
        return originalJson.call(this, body);
    };
    next();
};
exports.idempotencyMiddleware = idempotencyMiddleware;

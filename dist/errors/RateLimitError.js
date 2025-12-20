"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = void 0;
class RateLimitError extends Error {
    constructor(message, rateLimitInfo, code = 'RATE_LIMIT_EXCEEDED') {
        super(message);
        this.code = code;
        this.statusCode = 429;
        this.isOperational = true;
        this.name = 'RateLimitError';
        this.rateLimitInfo = rateLimitInfo;
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
    toJSON() {
        return Object.assign({ success: false, name: this.name, message: this.message, code: this.code, statusCode: this.statusCode }, (this.rateLimitInfo && {
            rateLimitInfo: {
                remaining: this.rateLimitInfo.remaining,
                limit: this.rateLimitInfo.limit,
                resetTime: this.rateLimitInfo.resetTime,
                retryAfter: Math.ceil((this.rateLimitInfo.resetTime.getTime() - Date.now()) / 1000)
            }
        }));
    }
}
exports.RateLimitError = RateLimitError;

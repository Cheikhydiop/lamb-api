"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.PAGINATION = exports.OTP_EXPIRY = exports.REFRESH_TOKEN_EXPIRY = exports.JWT_EXPIRY = exports.MAX_BET_AMOUNT = exports.MIN_BET_AMOUNT = exports.COMMISSION_RATE = void 0;
exports.COMMISSION_RATE = 0.1; // 10%
exports.MIN_BET_AMOUNT = BigInt(100);
exports.MAX_BET_AMOUNT = BigInt(1000000);
exports.JWT_EXPIRY = '15m';
exports.REFRESH_TOKEN_EXPIRY = '7d';
exports.OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
exports.PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0,
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};

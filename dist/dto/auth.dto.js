"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenDTO = exports.VerifyOTPDTO = exports.LoginDTO = exports.RegisterDTO = void 0;
const zod_1 = require("zod");
exports.RegisterDTO = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    phone: zod_1.z.string().regex(/^\+221[0-9]{9}$/, 'Numéro de téléphone invalide. Format attendu: +221XXXXXXXXX (numéro sénégalais)'),
    email: zod_1.z.string().email('Invalid email'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
exports.LoginDTO = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email'),
    password: zod_1.z.string(),
});
exports.VerifyOTPDTO = zod_1.z.object({
    phone: zod_1.z.string(),
    code: zod_1.z.string().length(6, 'OTP must be 6 digits'),
    purpose: zod_1.z.enum(['LOGIN', 'RESET_PASSWORD', 'PHONE_VERIFICATION']),
});
exports.RefreshTokenDTO = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});

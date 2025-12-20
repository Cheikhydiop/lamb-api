"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = require("jsonwebtoken");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    register(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if user exists
            const existingUser = yield this.prisma.user.findFirst({
                where: { OR: [{ email: data.email }, { phone: data.phone }] },
            });
            if (existingUser) {
                throw new Error('User with this email or phone already exists');
            }
            // Hash password
            const hashedPassword = yield bcrypt.hash(data.password, 10);
            // Create user
            const user = yield this.prisma.user.create({
                data: Object.assign(Object.assign({}, data), { password: hashedPassword, wallet: {
                        create: {},
                    } }),
                include: { wallet: true },
            });
            // Generate OTP
            yield this.generateOTP(user.id, user.phone, 'PHONE_VERIFICATION');
            // Generate tokens
            const tokens = this.generateTokens(user.id, user.email);
            return { user, tokens };
        });
    }
    login(data, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.prisma.user.findUnique({
                where: { email: data.email },
                include: { wallet: true },
            });
            if (!user) {
                throw new Error('Invalid email or password');
            }
            const isPasswordValid = yield bcrypt.compare(data.password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }
            // Generate tokens
            const tokens = this.generateTokens(user.id, user.email);
            // Create session
            yield this.prisma.session.create({
                data: {
                    userId: user.id,
                    refreshToken: tokens.refreshToken,
                    ipAddress,
                    userAgent,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            // Update last login
            yield this.prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });
            return { user, tokens };
        });
    }
    generateOTP(userId, phone, purpose) {
        return __awaiter(this, void 0, void 0, function* () {
            const code = Math.random().toString().slice(2, 8);
            yield this.prisma.otpCode.create({
                data: {
                    userId,
                    code,
                    purpose,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                },
            });
            // TODO: Send OTP via SMS to phone
            return code;
        });
    }
    verifyOTP(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.prisma.user.findUnique({
                where: { phone: data.phone },
            });
            if (!user) {
                throw new Error('User not found');
            }
            const otp = yield this.prisma.otpCode.findFirst({
                where: {
                    userId: user.id,
                    code: data.code,
                    purpose: data.purpose,
                    consumed: false,
                    expiresAt: { gt: new Date() },
                },
            });
            if (!otp) {
                throw new Error('Invalid or expired OTP');
            }
            // Mark OTP as consumed
            yield this.prisma.otpCode.update({
                where: { id: otp.id },
                data: { consumed: true },
            });
            // Update user
            const updatedUser = yield this.prisma.user.update({
                where: { id: user.id },
                data: {
                    isEmailVerified: data.purpose === 'PHONE_VERIFICATION',
                    isActive: true,
                },
            });
            return updatedUser;
        });
    }
    generateTokens(userId, email) {
        const accessToken = (0, jsonwebtoken_1.sign)({ userId, email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '15m' });
        const refreshToken = (0, jsonwebtoken_1.sign)({ userId }, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    refreshToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = (0, jsonwebtoken_1.verify)(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
                const session = yield this.prisma.session.findUnique({
                    where: { refreshToken },
                });
                if (!session || session.status !== 'ACTIVE') {
                    throw new Error('Invalid session');
                }
                const user = yield this.prisma.user.findUnique({
                    where: { id: payload.userId },
                });
                if (!user) {
                    throw new Error('User not found');
                }
                return this.generateTokens(user.id, user.email);
            }
            catch (error) {
                throw new Error('Invalid refresh token');
            }
        });
    }
    logout(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.session.update({
                where: { refreshToken },
                data: { status: 'REVOKED' },
            });
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], AuthService);

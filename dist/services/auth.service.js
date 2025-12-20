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
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const typedi_1 = require("typedi");
const jsonwebtoken_1 = require("jsonwebtoken");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuthService = _classThis = class {
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
    __setFunctionName(_classThis, "AuthService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
})();
exports.AuthService = AuthService;

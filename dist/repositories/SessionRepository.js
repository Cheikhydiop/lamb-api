"use strict";
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
exports.SessionRepository = exports.SessionStatus = exports.DeviceType = void 0;
exports.createSessionRepository = createSessionRepository;
// 1. Définissez vos propres enums localement
var DeviceType;
(function (DeviceType) {
    DeviceType["MOBILE"] = "MOBILE";
    DeviceType["DESKTOP"] = "DESKTOP";
    DeviceType["TABLET"] = "TABLET";
    DeviceType["UNKNOWN"] = "UNKNOWN";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["ACTIVE"] = "ACTIVE";
    SessionStatus["REVOKED"] = "REVOKED";
    SessionStatus["EXPIRED"] = "EXPIRED";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
// 3. Helper pour convertir vos enums en strings pour Prisma
const toPrismaDeviceType = (deviceType) => deviceType;
const toPrismaSessionStatus = (status) => status;
const typedi_1 = require("typedi");
let SessionRepository = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SessionRepository = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
        }
        createSession(data) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                return this.prisma.session.create({
                    data: {
                        userId: data.userId,
                        refreshToken: data.refreshToken,
                        deviceType: toPrismaDeviceType(data.deviceType || DeviceType.UNKNOWN),
                        deviceName: data.deviceName,
                        deviceId: data.deviceId,
                        ipAddress: data.ipAddress,
                        userAgent: data.userAgent,
                        expiresAt: data.expiresAt,
                        status: toPrismaSessionStatus(data.status || SessionStatus.ACTIVE),
                        isVerified: (_a = data.isVerified) !== null && _a !== void 0 ? _a : false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                role: true
                            }
                        }
                    }
                });
            });
        }
        findByRefreshToken(refreshToken) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.prisma.session.findFirst({
                    where: {
                        refreshToken,
                        status: toPrismaSessionStatus(SessionStatus.ACTIVE),
                        expiresAt: { gt: new Date() }
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                role: true,
                                isActive: true
                            }
                        }
                    }
                });
            });
        }
        findActiveSessionsByUser(userId_1) {
            return __awaiter(this, arguments, void 0, function* (userId, limit = 5) {
                return this.prisma.session.findMany({
                    where: {
                        userId,
                        status: toPrismaSessionStatus(SessionStatus.ACTIVE),
                        expiresAt: { gt: new Date() }
                    },
                    select: {
                        id: true,
                        deviceType: true,
                        ipAddress: true,
                        userAgent: true,
                        expiresAt: true,
                        createdAt: true,
                        updatedAt: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit
                });
            });
        }
        detectDeviceType(userAgent) {
            if (!userAgent)
                return DeviceType.UNKNOWN;
            const ua = userAgent.toLowerCase();
            if (/(tablet|ipad|playbook|silk)/i.test(ua)) {
                return DeviceType.TABLET;
            }
            if (/(mobile|android|iphone|ipod|blackberry|webos)/i.test(ua)) {
                return DeviceType.MOBILE;
            }
            if (/(windows nt|macintosh|linux|x11)/i.test(ua)) {
                return DeviceType.DESKTOP;
            }
            return DeviceType.UNKNOWN;
        }
        // Dans SessionRepository.ts - méthode extractDeviceInfoFromRequest
        extractDeviceInfoFromRequest(req) {
            const userAgent = req.headers['user-agent'];
            const deviceType = this.detectDeviceType(userAgent);
            // Utiliser directement req.clientIp qui est maintenant toujours défini
            const ipAddress = req.clientIp;
            // Log pour débogage
            if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Device Info:', {
                    ip: ipAddress,
                    userAgent: (userAgent === null || userAgent === void 0 ? void 0 : userAgent.substring(0, 50)) + (userAgent && userAgent.length > 50 ? '...' : ''),
                    deviceType
                });
            }
            return {
                deviceType,
                userAgent,
                ipAddress
            };
        }
        // MÉTHODE CORRIGÉE - Extraction d'IP améliorée
        extractClientIp(req) {
            var _a, _b, _c, _d;
            try {
                // 1. Vérifier le header x-forwarded-for (le plus courant derrière proxy)
                const xForwardedFor = req.headers['x-forwarded-for'];
                if (xForwardedFor) {
                    // Peut être un string ou un tableau
                    const ipList = Array.isArray(xForwardedFor)
                        ? xForwardedFor[0]
                        : xForwardedFor;
                    // Prendre la première IP (celle du client)
                    const clientIp = ipList.split(',')[0].trim();
                    if (clientIp && clientIp !== '') {
                        return clientIp;
                    }
                }
                // 2. Vérifier les autres headers courants
                const headersToCheck = [
                    'x-real-ip',
                    'x-client-ip',
                    'cf-connecting-ip', // Cloudflare
                    'fastly-client-ip', // Fastly
                    'true-client-ip', // Akamai
                    'x-cluster-client-ip',
                    'forwarded'
                ];
                for (const header of headersToCheck) {
                    const value = req.headers[header];
                    if (value) {
                        const ip = Array.isArray(value) ? value[0] : value;
                        // Extraire l'IP du header Forwarded: for=192.0.2.60;proto=http;by=203.0.113.43
                        if (header === 'forwarded' && ip.includes('for=')) {
                            const match = ip.match(/for=([^;,\s]+)/);
                            if (match && match[1]) {
                                // Enlever les guillemets et les crochets
                                return match[1].replace(/^\[|\]|"/g, '');
                            }
                        }
                        return ip;
                    }
                }
                // 3. Vérifier la propriété req.ip (si Express a déjà extrait l'IP)
                if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') {
                    return req.ip;
                }
                // 4. Vérifier req.socket.remoteAddress (dernier recours)
                if ((_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress) {
                    const remoteAddr = req.socket.remoteAddress;
                    // Filtrer les adresses locales
                    if (!['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(remoteAddr)) {
                        // Enlever le préfixe IPv6-mapped IPv4
                        return remoteAddr.replace('::ffff:', '');
                    }
                }
                // 5. Vérifier req.connection.remoteAddress (ancienne API)
                if ((_b = req.connection) === null || _b === void 0 ? void 0 : _b.remoteAddress) {
                    const remoteAddr = req.connection.remoteAddress;
                    if (!['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(remoteAddr)) {
                        return remoteAddr.replace('::ffff:', '');
                    }
                }
                // Si aucune IP n'a été trouvée
                console.warn('⚠️ No client IP found. Headers available:', {
                    'x-forwarded-for': req.headers['x-forwarded-for'],
                    'x-real-ip': req.headers['x-real-ip'],
                    'x-client-ip': req.headers['x-client-ip'],
                    'cf-connecting-ip': req.headers['cf-connecting-ip'],
                    'req.ip': req.ip,
                    'socket.remoteAddress': (_c = req.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress,
                    'connection.remoteAddress': (_d = req.connection) === null || _d === void 0 ? void 0 : _d.remoteAddress
                });
                return 'unknown';
            }
            catch (error) {
                console.error('❌ Error extracting IP:', error);
                return 'unknown';
            }
        }
        cleanupExpiredSessions() {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield this.prisma.session.updateMany({
                    where: {
                        status: toPrismaSessionStatus(SessionStatus.ACTIVE),
                        expiresAt: { lt: new Date() }
                    },
                    data: {
                        status: toPrismaSessionStatus(SessionStatus.EXPIRED),
                        updatedAt: new Date()
                    }
                });
                return result.count;
            });
        }
        cleanupOldSessions() {
            return __awaiter(this, arguments, void 0, function* (daysOld = 30) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysOld);
                const result = yield this.prisma.session.deleteMany({
                    where: {
                        status: {
                            in: [
                                toPrismaSessionStatus(SessionStatus.REVOKED),
                                toPrismaSessionStatus(SessionStatus.EXPIRED)
                            ]
                        },
                        updatedAt: { lt: cutoffDate }
                    }
                });
                return result.count;
            });
        }
        enforceSessionLimits(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                const activeSessions = yield this.prisma.session.findMany({
                    where: {
                        userId,
                        status: toPrismaSessionStatus(SessionStatus.ACTIVE),
                        expiresAt: { gt: new Date() }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                if (activeSessions.length === 0)
                    return;
                // Grouper par type d'appareil
                const sessionsByDeviceType = new Map();
                Object.values(DeviceType).forEach(type => {
                    sessionsByDeviceType.set(type, []);
                });
                activeSessions.forEach(session => {
                    // Convertir le string de Prisma vers votre enum
                    const deviceType = this.stringToDeviceType(session.deviceType);
                    const sessions = sessionsByDeviceType.get(deviceType) || [];
                    sessions.push(session);
                    sessionsByDeviceType.set(deviceType, sessions);
                });
                const sessionsToKeep = [];
                const sessionsToRevoke = [];
                for (const [deviceType, sessions] of sessionsByDeviceType.entries()) {
                    if (sessions.length > 0) {
                        sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                        sessionsToKeep.push(sessions[0].id);
                        if (sessions.length > 1) {
                            sessionsToRevoke.push(...sessions.slice(1).map(s => s.id));
                        }
                    }
                }
                // Limite globale: max 5 sessions
                if (activeSessions.length > 5) {
                    const allSessions = [...activeSessions]
                        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                    const keepIds = allSessions.slice(0, 5).map(s => s.id);
                    const revokeIds = allSessions.slice(5).map(s => s.id);
                    revokeIds.forEach(id => {
                        if (!sessionsToRevoke.includes(id)) {
                            sessionsToRevoke.push(id);
                        }
                    });
                    sessionsToKeep.length = 0;
                    sessionsToKeep.push(...keepIds.slice(0, 5));
                }
                // Révoquer les sessions en excès
                if (sessionsToRevoke.length > 0) {
                    yield this.prisma.session.updateMany({
                        where: {
                            id: { in: sessionsToRevoke },
                            status: toPrismaSessionStatus(SessionStatus.ACTIVE)
                        },
                        data: {
                            status: toPrismaSessionStatus(SessionStatus.REVOKED),
                            updatedAt: new Date()
                        }
                    });
                }
            });
        }
        stringToDeviceType(value) {
            switch (value) {
                case 'MOBILE': return DeviceType.MOBILE;
                case 'DESKTOP': return DeviceType.DESKTOP;
                case 'TABLET': return DeviceType.TABLET;
                default: return DeviceType.UNKNOWN;
            }
        }
        stringToSessionStatus(value) {
            switch (value) {
                case 'ACTIVE': return SessionStatus.ACTIVE;
                case 'REVOKED': return SessionStatus.REVOKED;
                case 'EXPIRED': return SessionStatus.EXPIRED;
                default: return SessionStatus.EXPIRED;
            }
        }
        revokeSession(sessionId) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.prisma.session.update({
                    where: { id: sessionId },
                    data: {
                        status: toPrismaSessionStatus(SessionStatus.REVOKED),
                        updatedAt: new Date()
                    }
                });
            });
        }
        revokeAllUserSessions(userId, excludeSessionId) {
            return __awaiter(this, void 0, void 0, function* () {
                const where = {
                    userId,
                    status: toPrismaSessionStatus(SessionStatus.ACTIVE)
                };
                if (excludeSessionId) {
                    where.id = { not: excludeSessionId };
                }
                const result = yield this.prisma.session.updateMany({
                    where,
                    data: {
                        status: toPrismaSessionStatus(SessionStatus.REVOKED),
                        updatedAt: new Date()
                    }
                });
                return result.count;
            });
        }
        updateSession(sessionId, data) {
            return __awaiter(this, void 0, void 0, function* () {
                const updateData = { updatedAt: new Date() };
                if (data.status)
                    updateData.status = toPrismaSessionStatus(data.status);
                if (data.ipAddress)
                    updateData.ipAddress = data.ipAddress;
                if (data.userAgent)
                    updateData.userAgent = data.userAgent;
                if (data.deviceType)
                    updateData.deviceType = toPrismaDeviceType(data.deviceType);
                if (data.expiresAt)
                    updateData.expiresAt = data.expiresAt;
                return this.prisma.session.update({
                    where: { id: sessionId },
                    data: updateData
                });
            });
        }
        findSessionById(sessionId) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.prisma.session.findUnique({
                    where: { id: sessionId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                role: true
                            }
                        }
                    }
                });
            });
        }
        getSessionStats() {
            return __awaiter(this, void 0, void 0, function* () {
                const [totalSessions, activeSessions, expiredSessions, revokedSessions, byDeviceType, byStatus] = yield Promise.all([
                    this.prisma.session.count(),
                    this.prisma.session.count({
                        where: {
                            status: toPrismaSessionStatus(SessionStatus.ACTIVE),
                            expiresAt: { gt: new Date() }
                        }
                    }),
                    this.prisma.session.count({
                        where: { status: toPrismaSessionStatus(SessionStatus.EXPIRED) }
                    }),
                    this.prisma.session.count({
                        where: { status: toPrismaSessionStatus(SessionStatus.REVOKED) }
                    }),
                    this.prisma.session.groupBy({
                        by: ['deviceType'],
                        _count: true,
                        where: { status: toPrismaSessionStatus(SessionStatus.ACTIVE) }
                    }),
                    this.prisma.session.groupBy({
                        by: ['status'],
                        _count: true
                    })
                ]);
                return {
                    totalSessions,
                    activeSessions,
                    expiredSessions,
                    revokedSessions,
                    byDeviceType,
                    byStatus
                };
            });
        }
        isValidSession(sessionId) {
            return __awaiter(this, void 0, void 0, function* () {
                const session = yield this.prisma.session.findFirst({
                    where: {
                        id: sessionId,
                        status: toPrismaSessionStatus(SessionStatus.ACTIVE),
                        expiresAt: { gt: new Date() }
                    }
                });
                return !!session;
            });
        }
        refreshSession(sessionId, newExpiry) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.prisma.session.update({
                        where: { id: sessionId },
                        data: {
                            expiresAt: newExpiry,
                            updatedAt: new Date()
                        }
                    });
                    return true;
                }
                catch (error) {
                    console.error('Error refreshing session:', error);
                    return false;
                }
            });
        }
        rotateRefreshToken(oldToken, newToken, newExpiry) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.prisma.session.update({
                    where: { refreshToken: oldToken },
                    data: {
                        refreshToken: newToken,
                        expiresAt: newExpiry,
                        updatedAt: new Date()
                    }
                });
            });
        }
        performMaintenance() {
            return __awaiter(this, void 0, void 0, function* () {
                const expiredCleaned = yield this.cleanupExpiredSessions();
                const oldDeleted = yield this.cleanupOldSessions();
                return {
                    expiredCleaned,
                    oldDeleted
                };
            });
        }
        findSessionsByUser(userId, options) {
            return __awaiter(this, void 0, void 0, function* () {
                const where = { userId };
                if (options === null || options === void 0 ? void 0 : options.status) {
                    where.status = toPrismaSessionStatus(options.status);
                }
                if (options === null || options === void 0 ? void 0 : options.deviceType) {
                    where.deviceType = toPrismaDeviceType(options.deviceType);
                }
                return this.prisma.session.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: (options === null || options === void 0 ? void 0 : options.limit) || 20
                });
            });
        }
        // Méthode utilitaire pour loguer les informations de la requête
        logRequestInfo(req, email, success = false) {
            const ip = this.extractClientIp(req);
            const userAgent = req.headers['user-agent'] || 'unknown';
            const deviceType = this.detectDeviceType(userAgent);
            console.log(`📝 Login Attempt:
      📧 Email: ${email}
      ✅ Success: ${success ? 'YES' : 'NO'}
      🌐 IP: ${ip}
      🖥️  Device: ${deviceType}
      🕵️  User-Agent: ${userAgent.substring(0, 100)}${userAgent.length > 100 ? '...' : ''}
      🔗 URL: ${req.originalUrl}
      📍 Method: ${req.method}
    `);
            return { ip, userAgent, deviceType };
        }
        isKnownDevice(userId, deviceId) {
            return __awaiter(this, void 0, void 0, function* () {
                const count = yield this.prisma.session.count({
                    where: {
                        userId,
                        deviceId,
                        isVerified: true
                    }
                });
                return count > 0;
            });
        }
    };
    __setFunctionName(_classThis, "SessionRepository");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SessionRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SessionRepository = _classThis;
})();
exports.SessionRepository = SessionRepository;
// 4. Fonction utilitaire pour créer le repository
function createSessionRepository(prisma) {
    return new SessionRepository(prisma);
}

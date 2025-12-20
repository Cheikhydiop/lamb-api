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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = exports.WebSocketEvent = void 0;
const typedi_1 = require("typedi");
const socket_io_1 = require("socket.io");
const Logger_1 = __importDefault(require("../utils/Logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
// Types de messages WebSocket (Events Socket.io)
var WebSocketEvent;
(function (WebSocketEvent) {
    WebSocketEvent["CONNECTION_STATUS"] = "connection_status";
    WebSocketEvent["AUTH_ERROR"] = "auth_error";
    WebSocketEvent["FIGHT_STATUS_UPDATE"] = "fight_status_update";
    WebSocketEvent["FIGHT_RESULT"] = "fight_result";
    WebSocketEvent["FIGHT_STARTED"] = "fight_started";
    WebSocketEvent["FIGHT_FINISHED"] = "fight_finished";
    WebSocketEvent["FIGHT_CANCELLED"] = "fight_cancelled";
    WebSocketEvent["BET_CREATED"] = "bet_created";
    WebSocketEvent["BET_ACCEPTED"] = "bet_accepted";
    WebSocketEvent["BET_CANCELLED"] = "bet_cancelled";
    WebSocketEvent["BET_WON"] = "bet_won";
    WebSocketEvent["BET_LOST"] = "bet_lost";
    WebSocketEvent["TRANSACTION_CONFIRMED"] = "transaction_confirmed";
    WebSocketEvent["TRANSACTION_FAILED"] = "transaction_failed";
    WebSocketEvent["WALLET_UPDATE"] = "wallet_update";
    WebSocketEvent["NOTIFICATION"] = "notification";
    WebSocketEvent["SYSTEM_ALERT"] = "system_alert";
    WebSocketEvent["SUBSCRIBE_FIGHT"] = "subscribe_fight";
    WebSocketEvent["UNSUBSCRIBE_FIGHT"] = "unsubscribe_fight";
    WebSocketEvent["SUBSCRIBE_BETS"] = "subscribe_bets";
    WebSocketEvent["UNSUBSCRIBE_BETS"] = "unsubscribe_bets";
    WebSocketEvent["PING"] = "ping";
    WebSocketEvent["PONG"] = "pong";
})(WebSocketEvent || (exports.WebSocketEvent = WebSocketEvent = {}));
let WebSocketService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var WebSocketService = _classThis = class {
        constructor() {
            this.io = null;
            this.initialized = false;
            if (WebSocketService.instance) {
                return WebSocketService.instance;
            }
            WebSocketService.instance = this;
        }
        initialize(server) {
            if (this.initialized) {
                Logger_1.default.info('Socket.io server already initialized');
                return;
            }
            this.io = new socket_io_1.Server(server, {
                cors: {
                    origin: env_1.default.corsOrigin,
                    methods: ['GET', 'POST'],
                    credentials: true
                },
                path: '/ws'
            });
            // Authentication Middleware
            this.io.use((socket, next) => {
                const token = socket.handshake.query.token;
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, env_1.default.jwt.secret);
                    socket.data.userId = decoded.userId;
                    socket.data.role = decoded.role;
                    next();
                }
                catch (err) {
                    next(new Error('Invalid or expired token'));
                }
            });
            this.io.on('connection', (socket) => {
                this.handleConnection(socket);
            });
            this.initialized = true;
            Logger_1.default.info('Socket.io server initialized on path /ws');
        }
        static getInstance() {
            if (!WebSocketService.instance) {
                WebSocketService.instance = new WebSocketService();
            }
            return WebSocketService.instance;
        }
        isInitialized() {
            return this.initialized;
        }
        destroy() {
            if (this.io) {
                this.io.close();
                this.io = null;
            }
            this.initialized = false;
            WebSocketService.instance = null;
            Logger_1.default.info('WebSocket service destroyed');
        }
        handleConnection(socket) {
            const userId = socket.data.userId;
            Logger_1.default.info(`[Socket.io] User ${userId} connected (${socket.id})`);
            // Join user-specific room for private notifications/updates
            socket.join(`user:${userId}`);
            socket.on(WebSocketEvent.SUBSCRIBE_FIGHT, (payload) => {
                if (payload.fightId) {
                    socket.join(`fight:${payload.fightId}`);
                    Logger_1.default.info(`[Socket.io] User ${userId} joined room fight:${payload.fightId}`);
                    socket.emit('subscription_confirmed', { type: 'fight', fightId: payload.fightId });
                }
            });
            socket.on(WebSocketEvent.UNSUBSCRIBE_FIGHT, (payload) => {
                if (payload.fightId) {
                    socket.leave(`fight:${payload.fightId}`);
                    Logger_1.default.info(`[Socket.io] User ${userId} left room fight:${payload.fightId}`);
                }
            });
            socket.on('disconnect', (reason) => {
                Logger_1.default.info(`[Socket.io] User ${userId} disconnected: ${reason}`);
            });
            // Welcome message
            socket.emit(WebSocketEvent.CONNECTION_STATUS, {
                status: 'connected',
                userId,
                serverTime: new Date().toISOString()
            });
        }
        // ================ MÉTHODES DE BROADCAST ================
        broadcastFightUpdate(fightId, update) {
            if (!this.io)
                return;
            this.io.to(`fight:${fightId}`).emit(WebSocketEvent.FIGHT_STATUS_UPDATE, update);
            Logger_1.default.info(`[Socket.io] Broadcast fight update to room fight:${fightId}`);
        }
        broadcastBetUpdate(betUpdate) {
            if (!this.io)
                return;
            this.io.to(`user:${betUpdate.userId}`).emit(this.getBetEvent(betUpdate.status), betUpdate);
        }
        getBetEvent(status) {
            switch (status) {
                case 'PENDING': return WebSocketEvent.BET_CREATED;
                case 'ACCEPTED': return WebSocketEvent.BET_ACCEPTED;
                case 'CANCELLED': return WebSocketEvent.BET_CANCELLED;
                case 'WON': return WebSocketEvent.BET_WON;
                case 'LOST': return WebSocketEvent.BET_LOST;
                default: return WebSocketEvent.BET_CREATED;
            }
        }
        broadcastTransactionUpdate(transactionUpdate) {
            if (!this.io)
                return;
            const event = transactionUpdate.status === 'CONFIRMED'
                ? WebSocketEvent.TRANSACTION_CONFIRMED
                : WebSocketEvent.TRANSACTION_FAILED;
            this.io.to(`user:${transactionUpdate.userId}`).emit(event, transactionUpdate);
        }
        broadcastWalletUpdate(walletUpdate) {
            if (!this.io)
                return;
            this.io.to(`user:${walletUpdate.userId}`).emit(WebSocketEvent.WALLET_UPDATE, walletUpdate);
        }
        broadcastNotification(notification, userId) {
            if (!this.io)
                return;
            this.io.to(`user:${userId}`).emit(WebSocketEvent.NOTIFICATION, notification);
        }
        broadcastSystemAlert(alert) {
            if (!this.io)
                return;
            this.io.emit(WebSocketEvent.SYSTEM_ALERT, Object.assign(Object.assign({}, alert), { timestamp: new Date().toISOString() }));
        }
        getConnectionStats() {
            if (!this.io)
                return { totalConnections: 0 };
            return {
                totalConnections: this.io.sockets.sockets.size,
            };
        }
    };
    __setFunctionName(_classThis, "WebSocketService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebSocketService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    _classThis.instance = null;
    (() => {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebSocketService = _classThis;
})();
exports.WebSocketService = WebSocketService;

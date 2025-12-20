"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = exports.WebSocketEvent = void 0;
// import { Service } from 'typedi';
const socket_io_1 = require("socket.io");
const logger_1 = __importDefault(require("../utils/logger"));
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
// @Service() - Removed TypeDI
class WebSocketService {
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
            logger_1.default.info('Socket.io server already initialized');
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
        logger_1.default.info('Socket.io server initialized on path /ws');
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
        logger_1.default.info('WebSocket service destroyed');
    }
    handleConnection(socket) {
        const userId = socket.data.userId;
        logger_1.default.info(`[Socket.io] User ${userId} connected (${socket.id})`);
        // Join user-specific room for private notifications/updates
        socket.join(`user:${userId}`);
        socket.on(WebSocketEvent.SUBSCRIBE_FIGHT, (payload) => {
            if (payload.fightId) {
                socket.join(`fight:${payload.fightId}`);
                logger_1.default.info(`[Socket.io] User ${userId} joined room fight:${payload.fightId}`);
                socket.emit('subscription_confirmed', { type: 'fight', fightId: payload.fightId });
            }
        });
        socket.on(WebSocketEvent.UNSUBSCRIBE_FIGHT, (payload) => {
            if (payload.fightId) {
                socket.leave(`fight:${payload.fightId}`);
                logger_1.default.info(`[Socket.io] User ${userId} left room fight:${payload.fightId}`);
            }
        });
        socket.on('disconnect', (reason) => {
            logger_1.default.info(`[Socket.io] User ${userId} disconnected: ${reason}`);
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
        logger_1.default.info(`[Socket.io] Broadcast fight update to room fight:${fightId}`);
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
    sendToUser(userId, payload) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit(payload.type, payload.data);
    }
    getConnectionStats() {
        if (!this.io)
            return { totalConnections: 0 };
        return {
            totalConnections: this.io.sockets.sockets.size,
        };
    }
}
exports.WebSocketService = WebSocketService;
WebSocketService.instance = null;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
const socket_io_1 = require("socket.io");
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
class WebSocketManager {
    constructor(server) {
        this.userSockets = new Map();
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST'],
            },
        });
        this.prisma = typedi_1.Container.get(client_1.PrismaClient);
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use((socket, next) => {
            const userId = socket.handshake.auth.userId;
            if (!userId) {
                return next(new Error('Missing userId'));
            }
            socket.userId = userId;
            next();
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            const userId = socket.userId;
            logger_1.default.info(`User connected: ${userId}`);
            // Track user sockets
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, []);
            }
            this.userSockets.get(userId).push(socket);
            // Join user's room
            socket.join(`user:${userId}`);
            // Handle disconnection
            socket.on('disconnect', () => {
                logger_1.default.info(`User disconnected: ${userId}`);
                const sockets = this.userSockets.get(userId);
                if (sockets) {
                    const index = sockets.indexOf(socket);
                    if (index > -1) {
                        sockets.splice(index, 1);
                    }
                    if (sockets.length === 0) {
                        this.userSockets.delete(userId);
                    }
                }
            });
            // Subscribe to fight updates
            socket.on('subscribe:fight', (fightId) => {
                socket.join(`fight:${fightId}`);
                logger_1.default.debug(`User ${userId} subscribed to fight ${fightId}`);
            });
            socket.on('unsubscribe:fight', (fightId) => {
                socket.leave(`fight:${fightId}`);
                logger_1.default.debug(`User ${userId} unsubscribed from fight ${fightId}`);
            });
            // Subscribe to bet updates
            socket.on('subscribe:bets', () => {
                socket.join(`user:${userId}:bets`);
                logger_1.default.debug(`User ${userId} subscribed to bets`);
            });
        });
    }
    // Broadcast fight update
    broadcastFightUpdate(fightId, data) {
        this.io.to(`fight:${fightId}`).emit('fight:update', Object.assign(Object.assign({ fightId }, data), { timestamp: new Date().toISOString() }));
    }
    // Broadcast fight result
    broadcastFightResult(fightId, result) {
        this.io.to(`fight:${fightId}`).emit('fight:result', Object.assign(Object.assign({ fightId }, result), { timestamp: new Date().toISOString() }));
    }
    // Notify user about new notification
    notifyUser(userId, notification) {
        this.io.to(`user:${userId}`).emit('notification', Object.assign(Object.assign({}, notification), { timestamp: new Date().toISOString() }));
    }
    // Notify user about bet status change
    notifyBetUpdate(userId, betId, status) {
        this.io.to(`user:${userId}:bets`).emit('bet:update', {
            betId,
            status,
            timestamp: new Date().toISOString(),
        });
    }
    // Broadcast to all connected users
    broadcast(event, data) {
        this.io.emit(event, Object.assign(Object.assign({}, data), { timestamp: new Date().toISOString() }));
    }
    // Get connected users count
    getConnectedUsersCount() {
        return this.userSockets.size;
    }
    // Check if user is online
    isUserOnline(userId) {
        return this.userSockets.has(userId);
    }
    // Get all connected users
    getConnectedUsers() {
        return Array.from(this.userSockets.keys());
    }
}
exports.WebSocketManager = WebSocketManager;
exports.default = WebSocketManager;

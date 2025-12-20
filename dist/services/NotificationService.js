"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const WebSocketService_1 = require("./WebSocketService");
let NotificationService = class NotificationService {
    constructor(prisma, webSocketService) {
        this.prisma = prisma;
        this.webSocketService = webSocketService;
    }
    /**
     * Create and send notification (save to DB + send via WebSocket)
     */
    sendNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create in database
                const notification = yield this.prisma.notification.create({
                    data: {
                        userId: data.userId,
                        type: data.type,
                        title: data.title,
                        message: data.message,
                        data: data.data || client_1.Prisma.JsonNull,
                    },
                });
                // Send via WebSocket if service is initialized
                if (this.webSocketService && this.webSocketService.isInitialized()) {
                    this.webSocketService.broadcastNotification({
                        type: data.type,
                        title: data.title,
                        message: data.message,
                        data: data.data,
                        timestamp: new Date().toISOString()
                    }, data.userId);
                }
                logger_1.default.info(`Notification sent to user ${data.userId}: ${data.type}`);
                return notification;
            }
            catch (error) {
                logger_1.default.error('Error sending notification', error);
                throw error;
            }
        });
    }
    /**
     * Create notification without sending (DB only)
     */
    createNotification(userId, type, title, message, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield this.prisma.notification.create({
                    data: {
                        userId,
                        type,
                        title,
                        message,
                        data: data || client_1.Prisma.JsonNull,
                    },
                });
                logger_1.default.info(`Notification created for user ${userId}: ${type}`);
                return notification;
            }
            catch (error) {
                logger_1.default.error('Error creating notification', error);
                throw error;
            }
        });
    }
    getNotifications(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 20, offset = 0) {
            try {
                const notifications = yield this.prisma.notification.findMany({
                    where: { userId },
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: 'desc' },
                });
                // Parse JSON data field
                return notifications.map(n => (Object.assign(Object.assign({}, n), { data: n.data ? JSON.parse(n.data) : null })));
            }
            catch (error) {
                logger_1.default.error('Error fetching notifications', error);
                throw error;
            }
        });
    }
    getUnreadNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notifications = yield this.prisma.notification.findMany({
                    where: { userId, isRead: false },
                    orderBy: { createdAt: 'desc' },
                });
                return notifications.map(n => (Object.assign(Object.assign({}, n), { data: n.data ? JSON.parse(n.data) : null })));
            }
            catch (error) {
                logger_1.default.error('Error fetching unread notifications', error);
                throw error;
            }
        });
    }
    markAsRead(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield this.prisma.notification.update({
                    where: { id: notificationId, userId }, // Ensure user owns notification
                    data: {
                        isRead: true,
                        readAt: new Date(),
                    },
                });
                logger_1.default.info(`Notification marked as read: ${notificationId}`);
                return notification;
            }
            catch (error) {
                logger_1.default.error('Error marking notification as read', error);
                throw error;
            }
        });
    }
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.prisma.notification.updateMany({
                    where: { userId, isRead: false },
                    data: {
                        isRead: true,
                        readAt: new Date(),
                    },
                });
                logger_1.default.info(`Marked ${result.count} notifications as read for user ${userId}`);
                return result;
            }
            catch (error) {
                logger_1.default.error('Error marking all notifications as read', error);
                throw error;
            }
        });
    }
    deleteNotification(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.notification.delete({
                    where: { id: notificationId, userId }, // Ensure user owns notification
                });
                logger_1.default.info(`Notification deleted: ${notificationId}`);
            }
            catch (error) {
                logger_1.default.error('Error deleting notification', error);
                throw error;
            }
        });
    }
    getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield this.prisma.notification.count({
                    where: { userId, isRead: false },
                });
                return count;
            }
            catch (error) {
                logger_1.default.error('Error getting unread count', error);
                throw error;
            }
        });
    }
    /**
     * Broadcast notification to multiple users
     */
    broadcastToUsers(userIds, type, title, message, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notifications = yield Promise.all(userIds.map(userId => this.sendNotification({ userId, type, title, message, data })));
                logger_1.default.info(`Broadcast notification to ${userIds.length} users`);
                return notifications;
            }
            catch (error) {
                logger_1.default.error('Error broadcasting notifications', error);
                throw error;
            }
        });
    }
    /**
     * Broadcast to ALL active users
     */
    broadcastAll(type, title, message, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all active user IDs
                const users = yield this.prisma.user.findMany({
                    where: { isActive: true, isBanned: false },
                    select: { id: true }
                });
                const userIds = users.map(u => u.id);
                logger_1.default.info(`Broadcasting to all ${userIds.length} active users`);
                return this.broadcastToUsers(userIds, type, title, message, data);
            }
            catch (error) {
                logger_1.default.error('Error broadcasting to all users', error);
                throw error;
            }
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [client_1.PrismaClient,
        WebSocketService_1.WebSocketService])
], NotificationService);

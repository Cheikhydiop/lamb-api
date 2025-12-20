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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const typedi_1 = require("typedi");
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
let NotificationService = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var NotificationService = _classThis = class {
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
    __setFunctionName(_classThis, "NotificationService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NotificationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NotificationService = _classThis;
})();
exports.NotificationService = NotificationService;

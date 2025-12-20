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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const typedi_1 = require("typedi");
const NotificationService_1 = require("../services/NotificationService");
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    /**
     * Get all notifications for current user
     * GET /api/notifications
     */
    getNotifications(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const limit = parseInt(req.query.limit) || 20;
                const offset = parseInt(req.query.offset) || 0;
                const notifications = yield this.notificationService.getNotifications(userId, limit, offset);
                res.json({
                    success: true,
                    data: notifications
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get unread notifications
     * GET /api/notifications/unread
     */
    getUnreadNotifications(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const notifications = yield this.notificationService.getUnreadNotifications(userId);
                res.json({
                    success: true,
                    data: notifications
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get unread count
     * GET /api/notifications/unread/count
     */
    getUnreadCount(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const count = yield this.notificationService.getUnreadCount(userId);
                res.json({
                    success: true,
                    data: { count }
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Mark notification as read
     * PATCH /api/notifications/:id/read
     */
    markAsRead(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { id } = req.params;
                const notification = yield this.notificationService.markAsRead(id, userId);
                res.json({
                    success: true,
                    data: notification,
                    message: 'Notification marquée comme lue'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Mark all notifications as read
     * PATCH /api/notifications/read-all
     */
    markAllAsRead(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const result = yield this.notificationService.markAllAsRead(userId);
                res.json({
                    success: true,
                    data: result,
                    message: `${result.count} notifications marquées comme lues`
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Delete notification
     * DELETE /api/notifications/:id
     */
    deleteNotification(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { id } = req.params;
                yield this.notificationService.deleteNotification(id, userId);
                res.json({
                    success: true,
                    message: 'Notification supprimée'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Admin: Send notification to specific user
     * POST /api/notifications/admin/send
     */
    sendAdminNotification(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, type, title, message, data } = req.body;
                const notification = yield this.notificationService.sendNotification({
                    userId,
                    type,
                    title,
                    message,
                    data
                });
                res.json({
                    success: true,
                    data: notification,
                    message: 'Notification envoyée avec succès'
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Admin: Broadcast notification to all users
     * POST /api/notifications/admin/broadcast
     */
    broadcastAdminNotification(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { type, title, message, data } = req.body;
                const results = yield this.notificationService.broadcastAll(type, title, message, data);
                res.json({
                    success: true,
                    data: { sent: results.length },
                    message: `Notification diffusée à ${results.length} utilisateurs`
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
};
exports.NotificationController = NotificationController;
exports.NotificationController = NotificationController = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [NotificationService_1.NotificationService])
], NotificationController);

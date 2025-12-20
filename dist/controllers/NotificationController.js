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
exports.NotificationController = void 0;
const typedi_1 = require("typedi");
let NotificationController = (() => {
    let _classDecorators = [(0, typedi_1.Service)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var NotificationController = _classThis = class {
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
    __setFunctionName(_classThis, "NotificationController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NotificationController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NotificationController = _classThis;
})();
exports.NotificationController = NotificationController;

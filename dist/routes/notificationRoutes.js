"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const typedi_1 = __importDefault(require("typedi"));
const NotificationController_1 = require("../controllers/NotificationController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const notificationController = typedi_1.default.get(NotificationController_1.NotificationController);
// All routes require authentication
router.use(authMiddleware_1.requireAuth);
/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 */
router.get('/', (req, res, next) => notificationController.getNotifications(req, res, next));
/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notifications
 * @access  Private
 */
router.get('/unread', (req, res, next) => notificationController.getUnreadNotifications(req, res, next));
/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread/count', (req, res, next) => notificationController.getUnreadCount(req, res, next));
/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));
/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', (req, res, next) => notificationController.deleteNotification(req, res, next));
/**
 * @route   POST /api/notifications/admin/send
 * @desc    Send notification to user (Admin)
 * @access  Private/Admin
 */
router.post('/admin/send', authMiddleware_1.requireAdmin, (req, res, next) => notificationController.sendAdminNotification(req, res, next));
/**
 * @route   POST /api/notifications/admin/broadcast
 * @desc    Broadcast notification (Admin)
 * @access  Private/Admin
 */
router.post('/admin/broadcast', authMiddleware_1.requireAdmin, (req, res, next) => notificationController.broadcastAdminNotification(req, res, next));
exports.default = router;

import { Router } from 'express';
import Container from 'typedi';
import { NotificationController } from '../controllers/NotificationController';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 */
router.get(
    '/',
    (req, res, next) => {
        const notificationController = Container.get(NotificationController);
        notificationController.getNotifications(req, res, next);
    }
);

/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notifications
 * @access  Private
 */
router.get(
    '/unread',
    (req, res, next) => {
        const notificationController = Container.get(NotificationController);
        notificationController.getUnreadNotifications(req, res, next);
    }
);

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get(
    '/unread/count',
    (req, res, next) => {
        const notificationController = Container.get(NotificationController);
        notificationController.getUnreadCount(req, res, next);
    }
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch(
    '/:id/read',
    (req, res, next) => {
        const notificationController = Container.get(NotificationController);
        notificationController.markAsRead(req, res, next);
    }
);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch(
    '/read-all',
    (req, res, next) => {
        const notificationController = Container.get(NotificationController);
        notificationController.markAllAsRead(req, res, next);
    }
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete(
    '/:id',
    (req, res, next) => {
        const notificationController = Container.get(NotificationController);
        notificationController.deleteNotification(req, res, next);
    }
);

/**
 * @route   POST /api/notifications/admin/send
 * @desc    Send notification to user (Admin)
 * @access  Private/Admin
 */
router.post(
    '/admin/send',
    requireAdmin,
    (req, res, next) => {
        const notificationController = Container.get(NotificationController);
        notificationController.sendAdminNotification(req, res, next);
    }
);

/**
 * @route   POST /api/notifications/admin/broadcast
 * @desc    Broadcast notification (Admin)
 * @access  Private/Admin
 */
router.post(
    '/admin/broadcast',
    requireAdmin,
    (req, res, next) => {
        const notificationController = Container.get(NotificationController);
        notificationController.broadcastAdminNotification(req, res, next);
    }
);

export default router;

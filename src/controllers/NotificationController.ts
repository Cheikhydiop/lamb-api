import { Request, Response, NextFunction } from 'express';
import { Service } from 'typedi';
import { NotificationService } from '../services/NotificationService';
import logger from '../utils/logger';

@Service()
export class NotificationController {
    constructor(private notificationService: NotificationService) { }

    /**
     * Get all notifications for current user
     * GET /api/notifications
     */
    async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.userId;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;

            const notifications = await this.notificationService.getNotifications(userId, limit, offset);

            res.json({
                success: true,
                data: notifications
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get unread notifications
     * GET /api/notifications/unread
     */
    async getUnreadNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.userId;

            const notifications = await this.notificationService.getUnreadNotifications(userId);

            res.json({
                success: true,
                data: notifications
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get unread count
     * GET /api/notifications/unread/count
     */
    async getUnreadCount(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.userId;

            const count = await this.notificationService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark notification as read
     * PATCH /api/notifications/:id/read
     */
    async markAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.userId;
            const { id } = req.params;

            const notification = await this.notificationService.markAsRead(id, userId);

            res.json({
                success: true,
                data: notification,
                message: 'Notification marquée comme lue'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark all notifications as read
     * PATCH /api/notifications/read-all
     */
    async markAllAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.userId;

            const result = await this.notificationService.markAllAsRead(userId);

            res.json({
                success: true,
                data: result,
                message: `${result.count} notifications marquées comme lues`
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete notification
     * DELETE /api/notifications/:id
     */
    async deleteNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.userId;
            const { id } = req.params;

            await this.notificationService.deleteNotification(id, userId);

            res.json({
                success: true,
                message: 'Notification supprimée'
            });
        } catch (error) {
            next(error);
        }
    }


    /**
     * Admin: Send notification to specific user
     * POST /api/notifications/admin/send
     */
    async sendAdminNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, type, title, message, data } = req.body;

            const notification = await this.notificationService.sendNotification({
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
        } catch (error) {
            next(error);
        }
    }

    /**
     * Admin: Broadcast notification to all users
     * POST /api/notifications/admin/broadcast
     */
    async broadcastAdminNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, title, message, data } = req.body;

            const results = await this.notificationService.broadcastAll(
                type,
                title,
                message,
                data
            );

            res.json({
                success: true,
                data: { sent: results.length },
                message: `Notification diffusée à ${results.length} utilisateurs`
            });
        } catch (error) {
            next(error);
        }
    }
}

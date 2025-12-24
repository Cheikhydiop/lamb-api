import { Service } from 'typedi';
import { PrismaClient, NotificationType, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { WebSocketService } from './WebSocketService';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

@Service()
export class NotificationService {
  constructor(
    private prisma: PrismaClient,
    private webSocketService: WebSocketService
  ) { }

  /**
   * Create and send notification (save to DB + send via WebSocket)
   */
  async sendNotification(data: CreateNotificationData) {
    try {
      // Create in database
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || Prisma.JsonNull,
        },
      });

      // Send via WebSocket if service is initialized
      if (this.webSocketService && this.webSocketService.isInitialized()) {
        this.webSocketService.broadcastNotification(
          {
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data,
            timestamp: new Date().toISOString()
          },
          data.userId
        );
      }

      logger.info(`Notification sent to user ${data.userId}: ${data.type}`);
      return notification;
    } catch (error) {
      logger.error('Error sending notification', error);
      throw error;
    }
  }

  /**
   * Create notification without sending (DB only)
   */
  async createNotification(userId: string, type: NotificationType, title: string, message: string, data?: any) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data || Prisma.JsonNull,
        },
      });
      logger.info(`Notification created for user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification', error);
      throw error;
    }
  }

  async getNotifications(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });

      // Prisma already returns Json fields as objects, no need to parse
      return notifications.map(n => ({
        ...n,
        data: n.data || null
      }));
    } catch (error) {
      logger.error('Error fetching notifications', error);
      throw error;
    }
  }

  async getUnreadNotifications(userId: string) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
      });

      // Prisma already returns Json fields as objects, no need to parse
      return notifications.map(n => ({
        ...n,
        data: n.data || null
      }));
    } catch (error) {
      logger.error('Error fetching unread notifications', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id: notificationId, userId }, // Ensure user owns notification
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      logger.info(`Notification marked as read: ${notificationId}`);
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
      logger.info(`Marked ${result.count} notifications as read for user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string, userId: string) {
    try {
      await this.prisma.notification.delete({
        where: { id: notificationId, userId }, // Ensure user owns notification
      });
      logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      logger.error('Error deleting notification', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });
      return count;
    } catch (error) {
      logger.error('Error getting unread count', error);
      throw error;
    }
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcastToUsers(userIds: string[], type: NotificationType, title: string, message: string, data?: any) {
    try {
      const notifications = await Promise.all(
        userIds.map(userId => this.sendNotification({ userId, type, title, message, data }))
      );
      logger.info(`Broadcast notification to ${userIds.length} users`);
      return notifications;
    } catch (error) {
      logger.error('Error broadcasting notifications', error);
      throw error;
    }
  }

  /**
   * Broadcast to ALL active users
   */
  async broadcastAll(type: NotificationType, title: string, message: string, data?: any) {
    try {
      // Get all active user IDs
      const users = await this.prisma.user.findMany({
        where: { isActive: true, isBanned: false },
        select: { id: true }
      });

      const userIds = users.map(u => u.id);
      logger.info(`Broadcasting to all ${userIds.length} active users`);

      return this.broadcastToUsers(userIds, type, title, message, data);
    } catch (error) {
      logger.error('Error broadcasting to all users', error);
      throw error;
    }
  }
}

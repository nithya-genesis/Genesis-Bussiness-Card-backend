import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';

export class NotificationController {
  public static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const notifications = await prisma.notification.findMany({
        where: {
          userId: user.userId,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const unreadCount = await prisma.notification.count({
        where: {
          userId: user.userId,
          isRead: false,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await prisma.notification.updateMany({
        where: {
          id: String(id),
          userId: user.userId,
        },
        data: { isRead: true, readAt: new Date() },
      });

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await prisma.notification.updateMany({
        where: {
          userId: user.userId,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
}

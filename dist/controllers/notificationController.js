"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const prisma_js_1 = require("../models/prisma.js");
class NotificationController {
    static async getNotifications(req, res, next) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const notifications = await prisma_js_1.prisma.notification.findMany({
                where: {
                    userId: user.userId,
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            const unreadCount = await prisma_js_1.prisma.notification.count({
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
        }
        catch (err) {
            next(err);
        }
    }
    static async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            await prisma_js_1.prisma.notification.updateMany({
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
        }
        catch (err) {
            next(err);
        }
    }
    static async markAllAsRead(req, res, next) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            await prisma_js_1.prisma.notification.updateMany({
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
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;

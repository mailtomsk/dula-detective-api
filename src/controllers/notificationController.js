import { PrismaClient } from '@prisma/client';
import { success, error } from '../utils/apiResponse.js';

const prisma = new PrismaClient();

export async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.userId;
    const skip = (page - 1) * limit;
    const take = Math.min(parseInt(limit), 100);

    const whereClause = {
      user_id: userId,
      ...(unreadOnly === 'true' && { read: false })
    };

    const [totalItems, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { user_id: userId, read: false } }),
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take
      })
    ]);

    return success(res, {
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        read: n.read,
        createdAt: n.created_at
      })),
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / take),
        totalItems,
        hasNext: skip + take < totalItems,
        hasPrev: skip > 0
      }
    });
  } catch (e) {
    return error(res, "Failed to fetch notifications", 500, [{ details: e.message }]);
  }
}

export async function markNotificationRead(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id: parseInt(id), user_id: userId }
    });

    if (!notification) {
      return error(res, "Notification not found", 404);
    }

    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { read: true, updated_at: new Date(Date.now()) }
    });

    return success(res, null, "Notification marked as read");
  } catch (e) {
    return error(res, "Failed to mark as read", 500, [{ details: e.message }]);
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user.userId;

    await prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true, updated_at: new Date(Date.now()) }
    });

    return success(res, null, "All notifications marked as read");
  } catch (e) {
    return error(res, "Failed to mark all as read", 500, [{ details: e.message }]);
  }
}

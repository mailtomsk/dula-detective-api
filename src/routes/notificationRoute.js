import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.put('/:id/read', authMiddleware, markNotificationRead);
router.put('/read-all', authMiddleware, markAllNotificationsRead);

export default router;

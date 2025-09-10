import { body } from 'express-validator';

export const updateSettingsValidator = [
  // General
  body('general.appName').optional().isString().withMessage('App Name must be a string'),
  body('general.description').optional().isString(),
  body('general.contactEmail').optional().isEmail().withMessage('Invalid email'),
  body('general.contactPhone').optional().isString(),
  body('general.timezone').optional().isString(),

  // Notifications
  body('notifications.emailNotifications').optional().isBoolean(),
  body('notifications.adminNotifications').optional().isBoolean(),
  body('notifications.alertThreshold').optional().isInt(),

  // System
  body('system.apiRateLimit').optional().isInt(),
  body('system.dataRetentionDays').optional().isInt(),
  body('system.backupFrequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Invalid backup frequency'),
];

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all settings
export const getSettings = async (req, res) => {
  try {
    const [general, notifications, system] = await Promise.all([
      prisma.setting.findFirst(),
      prisma.notificationSetting.findFirst(),
      prisma.systemSetting.findFirst()
    ]);

    res.json({ general, notifications, system });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load settings', error: error.message });
  }
};

// Update all settings
export const updateSettings = async (req, res) => {
    const { general, notifications, system } = req.body;
  
    try {
      const updatePromises = [];
  
      if (general) {
        updatePromises.push(
          prisma.setting.upsert({
            where: { id: 1 },
            update: general,
            create: {
              id: 1,
              ...general
            }
          })
        );
      } else {
        updatePromises.push(Promise.resolve(null));
      }
  
      if (notifications) {
        updatePromises.push(
          prisma.notificationSetting.upsert({
            where: { id: 1 },
            update: notifications,
            create: {
              id: 1,
              ...notifications
            }
          })
        );
      } else {
        updatePromises.push(Promise.resolve(null));
      }
  
      if (system) {
        updatePromises.push(
          prisma.systemSetting.upsert({
            where: { id: 1 },
            update: system,
            create: {
              id: 1,
              ...system
            }
          })
        );
      } else {
        updatePromises.push(Promise.resolve(null));
      }
  
      const [updatedGeneral, updatedNotifications, updatedSystem] = await Promise.all(updatePromises);
  
      res.json({
        message: 'Settings updated successfully',
        general: updatedGeneral,
        notifications: updatedNotifications,
        system: updatedSystem
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update settings', error: error.message });
    }
  };
  

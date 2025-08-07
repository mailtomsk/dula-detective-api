import express from 'express';
import { validate } from '../../middlewares/validate.js';
import authenticateToken from '../../middlewares/adminAuthMiddleware.js';
import { updateSettingsValidator } from '../../validators/admin/settingsValidator.js';
import { getSettings, updateSettings } from '../../controllers/admin/settingsController.js';

const router = express.Router();

router.get('/', authenticateToken, getSettings);
router.put('/', authenticateToken, updateSettingsValidator, validate, updateSettings);

export default router;
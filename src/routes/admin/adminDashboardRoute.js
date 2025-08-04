import express from 'express';
import { getDashboardStats } from '../../controllers/admin/dashboardController.js';
import authenticateToken from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getDashboardStats);

export default router;

import express from 'express';
import { getAppStats, getUserStats } from '../controllers/statsController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/app', getAppStats);
router.get('/user', authMiddleware, getUserStats);

export default router;

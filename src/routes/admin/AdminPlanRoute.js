import express from 'express';
import { validate } from '../../middlewares/validate.js';
import authenticateToken from '../../middlewares/adminAuthMiddleware.js';
import { PlanContoller } from '../../controllers/admin/PlanController.js';
const router = express.Router();

router.get('/', authenticateToken, PlanContoller.getPlans);
router.post('/change-status', authenticateToken, PlanContoller.changeStatus);


export default router;


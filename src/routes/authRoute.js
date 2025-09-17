import express from 'express';
import basicAuth from '../middlewares/basicAuth.js';
import { register, login, refresh, forgotPassword, verifyOtp, resetPassword } from '../controllers/authController.js';
import { PlanContoller } from '../controllers/PlanController.js';

const router = express.Router();

// Routes require basicAuth
router.post('/register', basicAuth, register);
router.post('/login', basicAuth, login);
router.post('/refresh', basicAuth, refresh);
router.post('/forgot-password', basicAuth, forgotPassword);
router.post('/reset-password', basicAuth, resetPassword);
router.post('/verify-otp', basicAuth, verifyOtp);
router.get('/plans', PlanContoller.getPlans);


export default router;

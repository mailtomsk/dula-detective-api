import express from 'express';
import basicAuth from '../middlewares/basicAuth.js';
import { register, login, refresh, forgotPassword, verifyOtp, resetPassword } from '../controllers/authController.js';
import { PlanContoller } from '../controllers/PlanController.js';
import { StripController } from '../controllers/StripController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes require basicAuth
router.post('/register', basicAuth, register);
router.post('/login', basicAuth, login);
router.post('/refresh', basicAuth, refresh);
router.post('/forgot-password', basicAuth, forgotPassword);
router.post('/reset-password', basicAuth, resetPassword);
router.post('/verify-otp', basicAuth, verifyOtp);
router.get('/plans', PlanContoller.getPlans);

router.post('/plans/paymentlink', authMiddleware, StripController.createSession);

router.post('/plans/update-plan', authMiddleware, StripController.upldateUserPlan);

router.get('/plans/payment-sucess', StripController.paymentSucess);



export default router;

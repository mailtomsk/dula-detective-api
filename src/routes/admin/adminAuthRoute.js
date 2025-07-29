import express from 'express';
import { validate } from '../../middlewares/validate.js';
import { authValidator } from '../../validators/admin/authValidator.js';
import { login } from '../../controllers/admin/authController.js';

const router = express.Router();

router.post('/login', authValidator, validate, login);

export default router;

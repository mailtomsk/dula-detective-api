import express from 'express';
import multer from 'multer';
import { getProfile, updateProfile, uploadProfileImage } from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/profile/image', authMiddleware, upload.single('image'), uploadProfileImage);

export default router;

import express from 'express';
import multer from 'multer';
import { UserProfileController } from '../controllers/UserProfileController.js';
import authMiddleware from '../middlewares/authMiddleware.js';


const router = express.Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/profile', authMiddleware, UserProfileController.getProfile);
router.put('/profile', authMiddleware, UserProfileController.updateProfile);
router.post('/profile/image', authMiddleware, upload.single('image'), UserProfileController.uploadProfileImage);

export default router;

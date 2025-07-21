import express from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/authMiddleware.js';
import {ask, vision, getAnalysisHistory, getAnalysisDetails, deleteAnalysis } from '../controllers/openaiController.js';

const router = express.Router();
const upload = multer();

router.post('/ask', ask);
router.post('/scan', upload.single('file'), authMiddleware, vision);
router.get('/history', authMiddleware, getAnalysisHistory);
router.get('/:id', authMiddleware, getAnalysisDetails);
router.delete('/:id', authMiddleware, deleteAnalysis);

export default router;

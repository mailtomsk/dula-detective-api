import express from 'express';
import multer from 'multer';
import upload, { handleMulterError } from '../middlewares/upload.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {ask, vision, getAnalysisHistory, getAnalysisDetails, deleteAnalysis } from '../controllers/openaiController.js';

const router = express.Router();

router.post('/ask', ask);
router.post('/scan', authMiddleware, upload.single('file'), handleMulterError, vision);
router.get('/history', authMiddleware, getAnalysisHistory);
router.get('/:id', authMiddleware, getAnalysisDetails);
router.delete('/:id', authMiddleware, deleteAnalysis);

export default router;

import express from 'express';
import upload from '../middlewares/upload.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {ask, vision, getAnalysisHistory, getAnalysisDetails, deleteAnalysis } from '../controllers/openaiController.js';

const router = express.Router();

router.post('/ask', ask);
router.post('/scan', upload.single('file'), authMiddleware, vision);
router.get('/history', authMiddleware, getAnalysisHistory);
router.get('/:id', authMiddleware, getAnalysisDetails);
router.delete('/:id', authMiddleware, deleteAnalysis);

export default router;

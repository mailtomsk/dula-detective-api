import express from 'express';
import multer from 'multer';
import upload, { handleMulterError } from '../middlewares/upload.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {ask, vision, getAnalysisHistory, getAnalysisDetails, deleteAnalysis } from '../controllers/openaiController.js';

const router = express.Router();

router.post('/ask', ask);
router.post('/scan', upload.single('file'), handleMulterError, (req, res) => {
    try {
        res.json({ success: true, file: req.file });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/history', authMiddleware, getAnalysisHistory);
router.get('/:id', authMiddleware, getAnalysisDetails);
router.delete('/:id', authMiddleware, deleteAnalysis);

export default router;

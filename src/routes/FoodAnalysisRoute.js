import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { FoodAnalysisContoller } from '../controllers/FoodAnalysisController.js';


const router = express.Router();

router.post('/barcode', authMiddleware, FoodAnalysisContoller.barcodeAnalysis);
router.post('/barcode/info', authMiddleware, FoodAnalysisContoller.barcodeInfo);
router.get('/history', authMiddleware, FoodAnalysisContoller.getAnalysisHistory);
router.get('/:id', authMiddleware, FoodAnalysisContoller.getAnalysisDetails);
router.delete('/:id', authMiddleware, FoodAnalysisContoller.deleteAnalysis);

export default router;
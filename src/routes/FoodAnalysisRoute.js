import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { FoodAnalysisContoller } from '../controllers/FoodAnalysisController.js';


const router = express.Router();

router.post('/barcode', authMiddleware, FoodAnalysisContoller.barcodeAnalysis);

export default router;
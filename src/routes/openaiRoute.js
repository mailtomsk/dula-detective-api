import express from 'express';
import multer from 'multer';
import * as openaiController from '../controllers/openaiController.js';

const router = express.Router();
const upload = multer();

router.post('/ask', openaiController.ask);
router.post('/scan', upload.single('file'), openaiController.vision);

export default router;

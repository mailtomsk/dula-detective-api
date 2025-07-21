import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    getArticles,
    getArticleDetails,
    getTrendingTopics
  } from '../controllers/insightsController.js';

const router = express.Router();

router.get('/articles', authMiddleware, getArticles);
router.get('/articles/:id', authMiddleware, getArticleDetails);
router.get('/trending', authMiddleware, getTrendingTopics);

export default router;

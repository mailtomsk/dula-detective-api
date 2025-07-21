import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { getFullImageUrl } from '../utils/helpers.js';
import { success, error } from '../utils/apiResponse.js';

dotenv.config();

const prisma = new PrismaClient();

export async function getArticles(req, res) {
  try {
    const {
      category = 'all',
      page = 1,
      limit = 10
    } = req.query;

    const take = Math.min(parseInt(limit), 50);
    const skip = (parseInt(page) - 1) * take;

    const where = category !== 'all' ? { category } : {};

    const [totalItems, articles] = await Promise.all([
      prisma.insightArticle.count({ where }),
      prisma.insightArticle.findMany({
        where,
        orderBy: { published_at: 'desc' },
        skip,
        take
      })
    ]);

    return success(res, {
      articles: articles.map(article => ({
        id: article.article_id,
        title: article.title,
        description: article.description,
        category: article.category,
        readTime: article.read_time,
        imageUrl: article.image_url,
        publishedAt: article.published_at,
        trending: article.trending
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / take),
        totalItems,
        hasNext: skip + take < totalItems,
        hasPrev: skip > 0
      }
    });
  } catch (e) {
    return error(res, "Failed to fetch articles", 500, [{ details: e.message }]);
  }
}

export async function getArticleDetails(req, res) {
  try {
    const articleId = req.params.id;

    const article = await prisma.insightArticle.findUnique({
      where: { article_id: articleId }
    });

    if (!article) return error(res, "Article not found", 404);

    return success(res, {
      article: {
        id: article.article_id,
        title: article.title,
        description: article.description,
        content: article.content,
        category: article.category,
        readTime: article.read_time,
        imageUrl: article.image_url,
        author: {
          name: article.author_name,
          bio: article.author_bio
        },
        tags: article.tags,
        publishedAt: article.published_at,
        updatedAt: article.updated_at
      }
    });
  } catch (e) {
    return error(res, "Failed to fetch article details", 500, [{ details: e.message }]);
  }
}

export async function getTrendingTopics(req, res) {
  try {
    const articles = await prisma.insightArticle.findMany({
      where: { trending: true },
      orderBy: { published_at: 'desc' },
      take: 10
    });

    const topics = articles.map(article => ({
      name: article.title,
      trend: "+10%",
      searchVolume: Math.floor(Math.random() * 10000 + 2000), // Mock
      category: article.category
    }));

    return success(res, { topics });
  } catch (e) {
    return error(res, "Failed to fetch trending topics", 500, [{ details: e.message }]);
  }
}


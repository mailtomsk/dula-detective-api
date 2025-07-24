import { PrismaClient } from '@prisma/client';
import { success, error } from '../utils/apiResponse.js';
import { subDays, startOfWeek, startOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export async function getAppStats(req, res) {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    const [totalScansToday, totalScansAllTime, avgAccuracy, avgProcessing, activeUsers] = await Promise.all([
      prisma.scanAnalysis.count({ where: { created_at: { gte: startOfToday } } }),
      prisma.scanAnalysis.count(),
      prisma.scanAnalysis.aggregate({
        _avg: { confidence: true }
      }),
      prisma.scanAnalysis.aggregate({
        _avg: { processing_time: true }
      }),
      prisma.user.count()
    ]);

    return success(res, {
      stats: {
        totalScansToday,
        totalScansAllTime,
        averageAccuracy: +(avgAccuracy._avg.confidence || 0).toFixed(2),
        averageProcessingTime: +(avgProcessing._avg.processing_time || 0).toFixed(2),
        activeUsers,
        lastUpdated: new Date()
      }
    });
  } catch (e) {
    return error(res, 'Failed to fetch app stats', 500, [{ details: e.message }]);
  }
}

export async function getUserStats(req, res) {
  try {
    const userId = req.user.userId;
    const today = new Date();
    const startWeek = startOfWeek(today, { weekStartsOn: 1 });
    const startMonth = startOfMonth(today);

    const [totalScans, scansWeek, scansMonth, avgConfidence] = await Promise.all([
      prisma.scanAnalysis.count({ where: { user_id: userId } }),
      prisma.scanAnalysis.count({ where: { user_id: userId, created_at: { gte: startWeek } } }),
      prisma.scanAnalysis.count({ where: { user_id: userId, created_at: { gte: startMonth } } }),
      prisma.scanAnalysis.aggregate({
        _avg: { confidence: true },
        where: { user_id: userId }
      })
    ]);

    const safetyCounts = await prisma.scanAnalysis.groupBy({
      by: ['overall_status'],
      where: { user_id: userId },
      _count: true
    });

    const mostScannedCategoryAgg = await prisma.scanAnalysis.groupBy({
      by: ['analysis_type'],
      where: { user_id: userId },
      _count: true,
      orderBy: { _count: { id: 'desc' } },
      take: 1
    });

    const past7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      return d.toISOString().split('T')[0];
    });

    const scansByDate = await prisma.scanAnalysis.groupBy({
      by: ['created_at'],
      where: {
        user_id: userId,
        created_at: { gte: subDays(new Date(), 6) }
      },
      _count: true
    });

    const dailyActivity = past7Days.map(date => {
      const match = scansByDate.find(r => r.created_at.toISOString().startsWith(date));
      return { date, scans: match?._count || 0 };
    });

    return success(res, {
      stats: {
        totalScans,
        scansThisWeek: scansWeek,
        scansThisMonth: scansMonth,
        savedAnalyses: 0,
        sharedAnalyses: 0,
        averageAccuracy: +(avgConfidence._avg.confidence || 0).toFixed(2),
        mostScannedCategory: mostScannedCategoryAgg[0]?.analysis_type || null,
        safetyBreakdown: {
          safe: safetyCounts.find(s => s.overall_status === 'safe')?._count || 0,
          caution: safetyCounts.find(s => s.overall_status === 'caution')?._count || 0,
          dangerous: safetyCounts.find(s => s.overall_status === 'dangerous')?._count || 0
        },
        weeklyActivity: dailyActivity
      }
    });
  } catch (e) {
    return error(res, 'Failed to fetch user stats', 500, [{ details: e.message }]);
  }
}

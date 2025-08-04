import { PrismaClient } from '@prisma/client';
import { startOfToday, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [totalUsers, premiumUsers, freeUsers, totalScans, todayScans] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: 'premium' } }),
      prisma.user.count({ where: { plan: 'free' } }),
      prisma.scanAnalysis.count(),
      prisma.scanAnalysis.count({ where: { created_at: { gte: startOfToday() } } }),
    ]);

    // Previous month
    const [lastMonthUsers, lastMonthScans, lastMonthTodayScans] = await Promise.all([
        prisma.user.count({ where: { created_at: { gte: lastMonthStart, lte: lastMonthEnd } } }),
        prisma.scanAnalysis.count({ where: { created_at: { gte: lastMonthStart, lte: lastMonthEnd } } }),
        prisma.scanAnalysis.count({
          where: {
            created_at: {
              gte: startOfToday(subMonths(now, 1)),
              lte: endOfMonth(subMonths(now, 1)),
            },
          },
        }),
      ]);
  
      const userGrowthPercent = lastMonthUsers === 0 ? 100 : Math.round(((totalUsers - lastMonthUsers) / lastMonthUsers) * 100);
      const scanGrowthPercent = lastMonthScans === 0 ? 100 : Math.round(((totalScans - lastMonthScans) / lastMonthScans) * 100);
      const todayScanGrowthPercent = lastMonthTodayScans === 0 ? 100 : Math.round(((todayScans - lastMonthTodayScans) / lastMonthTodayScans) * 100);
      const premiumUserPercent = totalUsers === 0 ? 0 : Math.round((premiumUsers / totalUsers) * 1000) / 10;  


    const scanCategories = await prisma.scanAnalysis.groupBy({
      by: ['analysis_type'],
      _count: { analysis_type: true },
    });

    const topIngredients = await prisma.scanAnalysis.findMany({
      select: {
        ingredients: true,
      },
    });

    // Flatten and count ingredient frequencies
    const ingredientCountMap = {};
    topIngredients.forEach(({ ingredients }) => {
      if (Array.isArray(ingredients)) {
        ingredients.forEach(({ name }) => {
          if (name) {
            ingredientCountMap[name] = (ingredientCountMap[name] || 0) + 1;
          }
        });
      }
    });

    const topFlaggedIngredients = Object.entries(ingredientCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    
    // Latest 10 Recent scans 
    const recentScansRaw = await prisma.scanAnalysis.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });
  
      const recentScans = recentScansRaw.map(scan => ({
        id: scan.id.toString(),
        userId: scan.user?.id?.toString() || '',
        userName: scan.user?.name || 'Unknown',
        foodName: scan.product_name || 'Unknown Food',
        scanType: scan.analysis_type || '',
        result: scan.overall_status || '', // e.g. safe / caution / dangerous
        flaggedIngredients: Array.isArray(scan.ingredients)
          ? scan.ingredients.map(ing => ing.name)
          : [],
        timestamp: scan.created_at.toISOString(),
        confidence: scan.confidence || null,
      }));

    res.json({
      totalUsers,
      premiumUsers,
      freeUsers,
      totalScans,
      todayScans,
      humanScans: scanCategories.find((s) => s.analysis_type === 'human')?._count.analysis_type || 0,
      petScans: scanCategories.find((s) => s.analysis_type === 'pet')?._count.analysis_type || 0,
      topFlaggedIngredients,
      recentScans,
      growth: {
        users: userGrowthPercent,
        scans: scanGrowthPercent,
        todayScans: todayScanGrowthPercent,
        premiumUsers: premiumUserPercent,
      }    
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};

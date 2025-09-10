import { getFullImageUrl } from './helpers.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const formatUserProfileResponse = async (user) => {

    const [totalScans, avgConfidence] = await Promise.all([
        prisma.scanAnalysis.count({ where: { user_id: user.id } }),
        prisma.scanAnalysis.aggregate({
            _avg: { confidence: true },
            where: { user_id: user.id }
        })
    ]);
    
    const stats = {
        totalScans: totalScans,
        savedAnalyses: 12,
        sharedAnalyses: 8,
        averageAccuracy: (avgConfidence._avg.confidence || 0).toFixed(2),
    };

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            profileImage: getFullImageUrl(user.profile_image, 'avatar') || null,
            membershipType: user.plan || 'free',
            createdAt: user.createdAt ?? user.created_at,
            stats: stats,
            preferences: {
                notifications: user.notifications ?? true,
                darkMode: user.dark_mode ?? false,
                defaultAnalysisType: user.default_analysis_type ?? 'human'
            }
        }
    };
};

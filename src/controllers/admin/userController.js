import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { getFullImageUrl } from '../../utils/helpers.js';

const prisma = new PrismaClient();

// Get users with filter
export const getUsers = async (req, res) => {
    const {search = '', type, page = 1, limit = 25} = req.query;
  
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;
  
    const where = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
      ...(type && type !== 'ALL' ? { plan: type } : {}),
    };
  
    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { id: 'desc' },
      include: {
        _count: {
          select: { scanAnalyses: true }
        }
      }
    });
  
    // Get total count for pagination and stats
    const [totalCount, activeCount, premiumCount, enterpriseCount] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: {is_active: true } }),
      prisma.user.count({ where: {plan: 'premium' } }),
      prisma.user.count({ where: {plan: 'enterprise' } }),
    ]);

    //Formatted response
    const transformedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        totalScans: user._count.scanAnalyses,
        profile_image: user.profile_image ? getFullImageUrl(user.profile_image, 'avatar') || null : null,
        is_active: user.is_active,
        created_at: user.created_at,
      }));
      
  
    res.json({
        users: transformedUsers,
        stats: {
            total: totalCount,
            active: activeCount,
            premium: premiumCount,
            enterprise: enterpriseCount,
        },
        pagination: {
            total: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: pageNumber,
            limit,
        },
    });
};

// Get an user
export const getUserById = async (req, res) => {
  const userId = parseInt(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  // Get scan counts grouped by overall_status
  const grouped = await prisma.scanAnalysis.groupBy({
    by: ['overall_status'],
    where: { user_id: userId },
    _count: true,
  });

  const scanSummary = {
    totalScans: grouped.reduce((sum, g) => sum + g._count, 0),
    safe: grouped.find(g => g.overall_status === 'safe')?._count || 0,
    caution: grouped.find(g => g.overall_status === 'caution')?._count || 0,
    dangerous: grouped.find(g => g.overall_status === 'dangerous')?._count || 0,
  };

  res.json({
    user,
    scanSummary
  });
};

// Create a user
export const createUser = async (req, res) => {
  const { name, email, password, plan = 'FREE', is_active = true } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: 'Email already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      plan,
      is_active,
      created_at: new Date(),
    },
  });

  res.status(201).json(user);
};

// Update a user
export const updateUser = async (req, res) => {
  const { name, email, plan, is_active } = req.body;
  const id = parseInt(req.params.id);

  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      plan,
      is_active,
    },
  });

  res.json(user);
};

//Delete user
export const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const deleted = await prisma.user.delete({
    where: { id }
  });

  res.json({ message: 'User deleted successfully' });
};

//Update toggle status
export const toggleUserStatus = async (req, res) => {
  const id = parseInt(req.params.id);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const updated = await prisma.user.update({
    where: { id },
    data: { is_active: !user.is_active },
  });

  res.json(updated);
};

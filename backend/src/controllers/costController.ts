import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getCostStats = async (req: AuthRequest, res: Response) => {
    try {
        const totalCost = await prisma.costLog.aggregate({
            _sum: { cost: true }
        });

        const costByUser = await prisma.costLog.groupBy({
            by: ['userId'],
            _sum: { cost: true }
        });

        // Get user names for the breakdown
        const userIds = costByUser.map(c => c.userId).filter(id => id !== null) as string[];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true }
        });

        const enrichedCostByUser = costByUser.map(c => {
            const user = users.find(u => u.id === c.userId);
            return {
                userId: c.userId,
                name: user?.name || 'Unknown',
                email: user?.email || 'Unknown',
                totalCost: c._sum.cost || 0
            };
        });

        const recentLogs = await prisma.costLog.findMany({
            take: 50,
            orderBy: { timestamp: 'desc' }
        });

        // Enrich logs with user names
        const enrichedLogs = await Promise.all(recentLogs.map(async (log) => {
            const user = log.userId ? await prisma.user.findUnique({ where: { id: log.userId }, select: { name: true } }) : null;
            return {
                ...log,
                userName: user?.name || 'System'
            };
        }));


        res.json({
            totalCost: totalCost._sum.cost || 0,
            costByUser: enrichedCostByUser,
            recentLogs: enrichedLogs
        });
    } catch (error) {
        console.error('Error fetching cost stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

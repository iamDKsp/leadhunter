import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getCostStats = async (req: AuthRequest, res: Response) => {
    try {
        const { period, userId } = req.query;

        // Base where filter for optional period or user filtering
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Calculate global totals
        const [totalAgg, todayAgg, weekAgg, monthAgg, totalCount] = await Promise.all([
            prisma.costLog.aggregate({
                _sum: { cost: true }
            }),
            prisma.costLog.aggregate({
                where: { timestamp: { gte: startOfToday } },
                _sum: { cost: true },
                _count: { id: true }
            }),
            prisma.costLog.aggregate({
                where: { timestamp: { gte: sevenDaysAgo } },
                _sum: { cost: true },
                _count: { id: true }
            }),
            prisma.costLog.aggregate({
                where: { timestamp: { gte: startOfMonth } },
                _sum: { cost: true },
                _count: { id: true }
            }),
            prisma.costLog.count()
        ]);

        const totalCostVal = totalAgg._sum.cost || 0;

        // Group by endpoint for SKU breakdown
        const endpointGroups = await prisma.costLog.groupBy({
            by: ['endpoint'],
            _sum: { cost: true },
            _count: { id: true }
        });

        const endpointCatalog: Record<string, { label: string; sku: string; unitPrice: number; description: string }> = {
            textsearch: {
                label: 'Places API - Text Search (New)',
                sku: 'Text Search (Enterprise / Pro)',
                unitPrice: 0.20,
                description: 'Busca de locais com telefones, horários e website por página (20 locais/página)'
            },
            placedetails: {
                label: 'Places API - Detalhes do Local (New)',
                sku: 'Place Details (Enterprise)',
                unitPrice: 0.15,
                description: 'Consulta direta e enriquecimento de telefone/website por ID do local'
            },
            placephoto: {
                label: 'Places API - Fotos de Fachada (New)',
                sku: 'Place Photos',
                unitPrice: 0.04,
                description: 'Download e armazenamento local de foto oficial de fachada'
            }
        };

        const breakdownByEndpoint = endpointGroups.map(eg => {
            const meta = endpointCatalog[eg.endpoint] || {
                label: eg.endpoint,
                sku: eg.endpoint,
                unitPrice: eg._sum.cost ? eg._sum.cost / eg._count.id : 0,
                description: 'Operação de API registrada'
            };
            return {
                endpoint: eg.endpoint,
                label: meta.label,
                sku: meta.sku,
                unitPrice: meta.unitPrice,
                description: meta.description,
                count: eg._count.id,
                totalCost: eg._sum.cost || 0,
                percentage: totalCostVal > 0 ? Number(((eg._sum.cost || 0) / totalCostVal * 100).toFixed(1)) : 0
            };
        });

        // Group by user
        const costByUser = await prisma.costLog.groupBy({
            by: ['userId'],
            _sum: { cost: true },
            _count: { id: true }
        });

        const userIds = costByUser.map(c => c.userId).filter(id => id !== null) as string[];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                customTag: true,
                customTagColor: true
            }
        });

        // Compute detailed stats per user
        const enrichedCostByUser = await Promise.all(costByUser.map(async (c) => {
            const user = users.find(u => u.id === c.userId);
            const userCost = c._sum.cost || 0;
            const requestCount = c._count.id || 0;

            const [searchesCount, photosCount] = await Promise.all([
                prisma.costLog.count({
                    where: { userId: c.userId, endpoint: 'textsearch' }
                }),
                prisma.costLog.count({
                    where: { userId: c.userId, endpoint: 'placephoto' }
                })
            ]);

            return {
                userId: c.userId,
                name: user?.name || 'Usuário Desconhecido',
                email: user?.email || 'Sem e-mail',
                avatar: user?.avatar || null,
                role: user?.role || 'SELLER',
                customTag: user?.customTag || null,
                customTagColor: user?.customTagColor || null,
                totalCost: userCost,
                requestCount: requestCount,
                searchesCount: searchesCount,
                photosCount: photosCount,
                percentageOfTotal: totalCostVal > 0 ? Number(((userCost / totalCostVal) * 100).toFixed(1)) : 0
            };
        }));

        // Sort users by total cost desc
        enrichedCostByUser.sort((a, b) => b.totalCost - a.totalCost);

        // Build where filter for recent logs if period/user filter is requested
        const logsWhere: any = {};
        if (userId && typeof userId === 'string' && userId !== 'ALL') {
            logsWhere.userId = userId;
        }
        if (period === 'today') {
            logsWhere.timestamp = { gte: startOfToday };
        } else if (period === 'week') {
            logsWhere.timestamp = { gte: sevenDaysAgo };
        } else if (period === 'month') {
            logsWhere.timestamp = { gte: startOfMonth };
        }

        const recentLogs = await prisma.costLog.findMany({
            where: logsWhere,
            take: 80,
            orderBy: { timestamp: 'desc' }
        });

        // Enrich logs with user details including avatar
        const allLogUserIds = Array.from(new Set(recentLogs.map(l => l.userId).filter(Boolean))) as string[];
        const logUsers = await prisma.user.findMany({
            where: { id: { in: allLogUserIds } },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true
            }
        });

        const logUserMap = new Map(logUsers.map(u => [u.id, u]));

        const enrichedLogs = recentLogs.map((log) => {
            const user = log.userId ? logUserMap.get(log.userId) : null;
            const meta = endpointCatalog[log.endpoint];
            return {
                ...log,
                userName: user?.name || 'Sistema',
                userEmail: user?.email || null,
                userAvatar: user?.avatar || null,
                userRole: user?.role || null,
                endpointLabel: meta?.label || log.endpoint,
                sku: meta?.sku || 'SKU Padrão'
            };
        });

        // USD conversion (rate approx R$ 5,90)
        const BRL_TO_USD_RATE = 5.90;
        const totalCostUSD = Number((totalCostVal / BRL_TO_USD_RATE).toFixed(2));

        res.json({
            currency: 'BRL',
            totalCost: totalCostVal,
            totalCostUSD: totalCostUSD,
            totalRequests: totalCount,
            avgCostPerSearch: enrichedCostByUser.length > 0 && totalCount > 0 ? Number((totalCostVal / totalCount).toFixed(2)) : 0.20,
            periods: {
                today: {
                    cost: todayAgg._sum.cost || 0,
                    requests: todayAgg._count.id || 0
                },
                week: {
                    cost: weekAgg._sum.cost || 0,
                    requests: weekAgg._count.id || 0
                },
                month: {
                    cost: monthAgg._sum.cost || 0,
                    requests: monthAgg._count.id || 0
                }
            },
            breakdownByEndpoint: breakdownByEndpoint,
            costByUser: enrichedCostByUser,
            recentLogs: enrichedLogs
        });
    } catch (error) {
        console.error('Error fetching cost stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

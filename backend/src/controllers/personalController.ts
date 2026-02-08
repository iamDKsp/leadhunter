import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /personal/metrics - User's lead stats
export const getMetrics = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // Get user's assigned leads
        const leads = await prisma.company.findMany({
            where: { responsibleId: userId },
            select: {
                id: true,
                successChance: true,
                contacted: true,
                value: true,
            },
        });

        const totalLeads = leads.length;
        const contacted = leads.filter((l) => l.contacted).length;
        const hotLeads = leads.filter((l) => (l.successChance ?? 0) >= 70).length;
        const averageScore =
            totalLeads > 0
                ? Math.round(
                    leads.reduce((acc, l) => acc + (l.successChance ?? 0), 0) /
                    totalLeads
                )
                : 0;
        const totalValue = leads.reduce((acc, l) => acc + (l.value ?? 0), 0);
        const averageTicket = totalLeads > 0 ? Math.round(totalValue / totalLeads) : 0;

        res.json({
            totalLeads,
            contacted,
            hotLeads,
            averageScore,
            totalValue,
            averageTicket,
        });
    } catch (error) {
        console.error('Error getting personal metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
};

// GET /personal/hot-leads - Top leads by success chance
export const getHotLeads = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const leads = await prisma.company.findMany({
            where: {
                responsibleId: userId,
                successChance: { gte: 50 },
            },
            orderBy: { successChance: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                type: true,
                phone: true,
                address: true,
                successChance: true,
                value: true,
            },
        });

        res.json(
            leads.map((lead) => ({
                id: lead.id,
                name: lead.name,
                category: lead.type?.toUpperCase() || 'LEAD',
                phone: lead.phone,
                address: lead.address,
                score: lead.successChance ?? 0,
                value: lead.value ?? 0,
            }))
        );
    } catch (error) {
        console.error('Error getting hot leads:', error);
        res.status(500).json({ error: 'Failed to get hot leads' });
    }
};

// GET /personal/tasks - User's pending tasks
export const getTasks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const tasks = await prisma.task.findMany({
            where: { userId },
            orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
            include: {
                company: { select: { name: true } },
            },
        });

        res.json(
            tasks.map((task) => ({
                id: task.id,
                title: task.title,
                leadName: task.company?.name || 'Sem lead',
                dueDate: task.dueDate
                    ? formatDueDate(task.dueDate)
                    : 'Sem prazo',
                priority: task.priority,
                type: task.type,
                completed: task.completed,
            }))
        );
    } catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({ error: 'Failed to get tasks' });
    }
};

// POST /personal/tasks - Create new task
export const createTask = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { title, description, companyId, dueDate, priority, type } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                companyId: companyId || null,
                userId,
                dueDate: dueDate ? new Date(dueDate) : null,
                priority: priority || 'medium',
                type: type || 'general',
            },
            include: { company: { select: { name: true } } },
        });

        res.status(201).json({
            id: task.id,
            title: task.title,
            leadName: task.company?.name || 'Sem lead',
            dueDate: task.dueDate ? formatDueDate(task.dueDate) : 'Sem prazo',
            priority: task.priority,
            type: task.type,
            completed: task.completed,
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

// PATCH /personal/tasks/:id - Update/complete task
export const updateTask = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { title, description, companyId, dueDate, priority, completed, type } = req.body;

        // Ensure user owns the task
        const existing = await prisma.task.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                title: title ?? existing.title,
                description: description ?? existing.description,
                companyId: companyId !== undefined ? companyId : existing.companyId,
                dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
                priority: priority ?? existing.priority,
                type: type ?? existing.type,
                completed: completed ?? existing.completed,
            },
            include: { company: { select: { name: true } } },
        });

        res.json({
            id: task.id,
            title: task.title,
            leadName: task.company?.name || 'Sem lead',
            dueDate: task.dueDate ? formatDueDate(task.dueDate) : 'Sem prazo',
            priority: task.priority,
            type: task.type,
            completed: task.completed,
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// DELETE /personal/tasks/:id - Delete task
export const deleteTask = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const existing = await prisma.task.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await prisma.task.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

// GET /personal/goals - User's weekly goals
export const getGoals = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // Get current week start (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);

        let goals = await prisma.goal.findMany({
            where: { userId, weekStart },
        });

        // If no goals for this week, create defaults
        if (goals.length === 0) {
            const defaultGoals = [
                { title: 'Novos Leads', target: 15, unit: 'leads', icon: 'leads' },
                { title: 'Ligações Realizadas', target: 30, unit: 'ligações', icon: 'calls' },
                { title: 'Reuniões Agendadas', target: 5, unit: 'reuniões', icon: 'meetings' },
                { title: 'Vendas Fechadas', target: 3, unit: 'vendas', icon: 'sales' },
            ];

            goals = await Promise.all(
                defaultGoals.map((g) =>
                    prisma.goal.create({
                        data: { ...g, userId, weekStart },
                    })
                )
            );
        }

        res.json(
            goals.map((g) => ({
                id: g.id,
                title: g.title,
                target: g.target,
                current: g.current,
                unit: g.unit,
                icon: g.icon,
            }))
        );
    } catch (error) {
        console.error('Error getting goals:', error);
        res.status(500).json({ error: 'Failed to get goals' });
    }
};

// PATCH /personal/goals/:id - Update goal progress
export const updateGoal = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { current, target } = req.body;

        const existing = await prisma.goal.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const goal = await prisma.goal.update({
            where: { id },
            data: {
                current: current ?? existing.current,
                target: target ?? existing.target,
            },
        });

        res.json({
            id: goal.id,
            title: goal.title,
            target: goal.target,
            current: goal.current,
            unit: goal.unit,
            icon: goal.icon,
        });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
};

// GET /personal/activity - Recent activity log
export const getActivity = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const activities = await prisma.activityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                company: { select: { name: true } },
            },
        });

        res.json(
            activities.map((a) => ({
                id: a.id,
                type: a.type,
                title: a.title,
                leadName: a.company?.name || '',
                time: formatTimeAgo(a.createdAt),
                status: a.status,
            }))
        );
    } catch (error) {
        console.error('Error getting activity:', error);
        res.status(500).json({ error: 'Failed to get activity' });
    }
};

// POST /personal/activity - Log an activity
export const createActivity = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { type, title, companyId, status } = req.body;

        if (!type || !title) {
            return res.status(400).json({ error: 'Type and title are required' });
        }

        const activity = await prisma.activityLog.create({
            data: {
                type,
                title,
                userId,
                companyId: companyId || null,
                status: status || 'completed',
            },
            include: { company: { select: { name: true } } },
        });

        res.status(201).json({
            id: activity.id,
            type: activity.type,
            title: activity.title,
            leadName: activity.company?.name || '',
            time: formatTimeAgo(activity.createdAt),
            status: activity.status,
        });
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
};

// GET /personal/performance - Monthly performance data
export const getPerformance = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // Get leads created in the last 6 months grouped by month
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const leads = await prisma.company.findMany({
            where: {
                responsibleId: userId,
                createdAt: { gte: sixMonthsAgo },
            },
            select: {
                createdAt: true,
                contacted: true,
                value: true,
            },
        });

        // Group by month
        const monthlyData: Record<
            string,
            { leads: number; conversions: number; value: number }
        > = {};

        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        leads.forEach((lead) => {
            const monthKey = months[lead.createdAt.getMonth()];
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { leads: 0, conversions: 0, value: 0 };
            }
            monthlyData[monthKey].leads++;
            if (lead.contacted) {
                monthlyData[monthKey].conversions++;
            }
            monthlyData[monthKey].value += lead.value ?? 0;
        });

        // Convert to array for last 6 months
        const now = new Date();
        const result = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = months[d.getMonth()];
            result.push({
                month: monthKey,
                leads: monthlyData[monthKey]?.leads || 0,
                conversions: monthlyData[monthKey]?.conversions || 0,
                value: monthlyData[monthKey]?.value || 0,
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error getting performance:', error);
        res.status(500).json({ error: 'Failed to get performance' });
    }
};

// Helper: Format due date
function formatDueDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    if (taskDate.getTime() === today.getTime()) {
        return `Hoje, ${time}`;
    } else if (taskDate.getTime() === tomorrow.getTime()) {
        return `Amanhã, ${time}`;
    } else if (taskDate < today) {
        return 'Atrasada';
    } else {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}, ${time}`;
    }
}

// Helper: Format time ago
function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
}

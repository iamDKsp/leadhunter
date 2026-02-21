import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Assign a lead to a user (seller)
export const assignLead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // Lead (company) ID
        const { userId } = req.body; // User to assign to
        const assignedById = req.user?.userId;

        if (!assignedById) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Get current lead to track previous responsible
        const currentLead = await prisma.company.findUnique({
            where: { id },
            select: { responsibleId: true }
        });

        if (!currentLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Update the lead with new responsible
        const lead = await prisma.company.update({
            where: { id },
            data: {
                responsibleId: userId,
                status: 'ACTIVE'
            },
            include: {
                responsible: { select: { id: true, name: true, email: true } },
                folder: true
            }
        });

        // Create assignment history record
        await prisma.leadAssignmentHistory.create({
            data: {
                companyId: id,
                previousUserId: currentLead.responsibleId,
                newUserId: userId,
                assignedById: assignedById
            }
        });

        res.json(lead);
    } catch (error) {
        console.error('Assign lead error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Unassign a lead (remove responsible)
export const unassignLead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const assignedById = req.user?.userId;

        if (!assignedById) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get current lead to track previous responsible
        const currentLead = await prisma.company.findUnique({
            where: { id },
            select: { responsibleId: true }
        });

        if (!currentLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        const lead = await prisma.company.update({
            where: { id },
            data: { responsibleId: null },
            include: { folder: true }
        });

        // Create assignment history record
        await prisma.leadAssignmentHistory.create({
            data: {
                companyId: id,
                previousUserId: currentLead.responsibleId,
                newUserId: null,
                assignedById: assignedById
            }
        });

        res.json(lead);
    } catch (error) {
        console.error('Unassign lead error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Bulk assign leads to a user
export const bulkAssignLeads = async (req: AuthRequest, res: Response) => {
    try {
        const { leadIds, userId } = req.body;
        const assignedById = req.user?.userId;

        if (!assignedById) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'Lead IDs are required' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Get current leads to track previous responsibles
        const currentLeads = await prisma.company.findMany({
            where: { id: { in: leadIds } },
            select: { id: true, responsibleId: true }
        });

        // Update all leads
        await prisma.company.updateMany({
            where: { id: { in: leadIds } },
            data: {
                responsibleId: userId,
                status: 'ACTIVE'
            }
        });

        // Create assignment history records
        const historyRecords = currentLeads.map(lead => ({
            companyId: lead.id,
            previousUserId: lead.responsibleId,
            newUserId: userId,
            assignedById: assignedById
        }));

        await prisma.leadAssignmentHistory.createMany({
            data: historyRecords
        });

        // Return updated leads
        const updatedLeads = await prisma.company.findMany({
            where: { id: { in: leadIds } },
            include: {
                responsible: { select: { id: true, name: true, email: true } },
                folder: true
            }
        });

        res.json(updatedLeads);
    } catch (error) {
        console.error('Bulk assign leads error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get leads assigned to the current user (my leads)
export const getMyLeads = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const leads = await prisma.company.findMany({
            where: { responsibleId: userId },
            include: {
                folder: true,
                responsible: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const safeLeads = leads.map(c => ({
            ...c,
            tags: c.tags ? c.tags.split(',') : []
        }));

        res.json(safeLeads);
    } catch (error) {
        console.error('Get my leads error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get leads by specific user ID (admin function)
export const getLeadsByUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const leads = await prisma.company.findMany({
            where: { responsibleId: userId },
            include: {
                folder: true,
                responsible: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const safeLeads = leads.map(c => ({
            ...c,
            tags: c.tags ? c.tags.split(',') : []
        }));

        res.json(safeLeads);
    } catch (error) {
        console.error('Get leads by user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get unassigned leads (leads without responsible)
export const getUnassignedLeads = async (req: AuthRequest, res: Response) => {
    try {
        const leads = await prisma.company.findMany({
            where: { responsibleId: null },
            include: { folder: true },
            orderBy: { createdAt: 'desc' }
        });

        const safeLeads = leads.map(c => ({
            ...c,
            tags: c.tags ? c.tags.split(',') : []
        }));

        res.json(safeLeads);
    } catch (error) {
        console.error('Get unassigned leads error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get assignment history for a lead
export const getLeadAssignmentHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const history = await prisma.leadAssignmentHistory.findMany({
            where: { companyId: id },
            include: {
                assignedBy: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Enrich with user names for previous and new users
        const enrichedHistory = await Promise.all(history.map(async (record) => {
            const [previousUser, newUser] = await Promise.all([
                record.previousUserId ? prisma.user.findUnique({
                    where: { id: record.previousUserId },
                    select: { id: true, name: true, email: true }
                }) : null,
                record.newUserId ? prisma.user.findUnique({
                    where: { id: record.newUserId },
                    select: { id: true, name: true, email: true }
                }) : null
            ]);

            return {
                ...record,
                previousUser,
                newUser
            };
        }));

        res.json(enrichedHistory);
    } catch (error) {
        console.error('Get lead assignment history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get sellers (users that can receive leads)
export const getSellers = async (req: AuthRequest, res: Response) => {
    try {
        const sellers = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'SELLER' },
                    { role: 'ADMIN' },
                    { role: 'SUPER_ADMIN' }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                _count: {
                    select: { assignedLeads: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(sellers);
    } catch (error) {
        console.error('Get sellers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Create a new access group
export const createAccessGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, permissions } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const existingGroup = await prisma.accessGroup.findUnique({ where: { name } });
        if (existingGroup) {
            return res.status(400).json({ error: 'Group with this name already exists' });
        }

        const accessGroup = await prisma.accessGroup.create({
            data: {
                name,
                description,
                permissions: permissions ? {
                    create: permissions
                } : {
                    create: {} // Create with defaults
                }
            },
            include: { permissions: true, users: { select: { id: true, name: true, email: true } } }
        });

        res.status(201).json(accessGroup);
    } catch (error) {
        console.error('Create access group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all access groups
export const getAccessGroups = async (req: AuthRequest, res: Response) => {
    try {
        const accessGroups = await prisma.accessGroup.findMany({
            include: {
                permissions: true,
                users: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(accessGroups);
    } catch (error) {
        console.error('Get access groups error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get access group by ID
export const getAccessGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const accessGroup = await prisma.accessGroup.findUnique({
            where: { id },
            include: {
                permissions: true,
                users: { select: { id: true, name: true, email: true, role: true } }
            }
        });

        if (!accessGroup) {
            return res.status(404).json({ error: 'Access group not found' });
        }

        res.json(accessGroup);
    } catch (error) {
        console.error('Get access group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update access group
export const updateAccessGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const accessGroup = await prisma.accessGroup.update({
            where: { id },
            data: { name, description },
            include: { permissions: true, users: { select: { id: true, name: true, email: true } } }
        });

        res.json(accessGroup);
    } catch (error) {
        console.error('Update access group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete access group
export const deleteAccessGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // First, remove all users from this group
        await prisma.user.updateMany({
            where: { accessGroupId: id },
            data: { accessGroupId: null }
        });

        await prisma.accessGroup.delete({ where: { id } });

        res.json({ message: 'Access group deleted successfully' });
    } catch (error) {
        console.error('Delete access group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update permissions for an access group
export const updatePermissions = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const permissions = req.body;

        // Check if the group exists
        const group = await prisma.accessGroup.findUnique({
            where: { id },
            include: { permissions: true }
        });

        if (!group) {
            return res.status(404).json({ error: 'Access group not found' });
        }

        let updatedPermissions;
        if (group.permissions) {
            // Update existing permissions
            updatedPermissions = await prisma.permission.update({
                where: { id: group.permissions.id },
                data: permissions
            });
        } else {
            // Create new permissions
            updatedPermissions = await prisma.permission.create({
                data: {
                    accessGroupId: id,
                    ...permissions
                }
            });
        }

        res.json(updatedPermissions);
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add user to access group
export const addUserToGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { accessGroupId: id },
            select: { id: true, name: true, email: true, accessGroupId: true }
        });

        res.json(user);
    } catch (error) {
        console.error('Add user to group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Remove user from access group
export const removeUserFromGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id, userId } = req.params;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { accessGroupId: null },
            select: { id: true, name: true, email: true, accessGroupId: true }
        });

        res.json(user);
    } catch (error) {
        console.error('Remove user from group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

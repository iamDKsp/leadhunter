import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { getUserPermissions } from '../middleware/authorization';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Check if this is the first user - they become SUPER_ADMIN
        const userCount = await prisma.user.count();
        const isFirstUser = userCount === 0;

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: isFirstUser ? 'SUPER_ADMIN' : 'SELLER',
            },
        });

        const token = generateToken(user.id);
        const permissions = await getUserPermissions(user.id);
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                permissions
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id);
        const permissions = await getUserPermissions(user.id);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                interfacePreference: user.interfacePreference,
                role: user.role,
                accessGroupId: user.accessGroupId,
                useOwnWhatsApp: user.useOwnWhatsApp,
                customTag: user.customTag,
                customTagColor: user.customTagColor,
                permissions
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, name, avatar, interfacePreference, role, accessGroupId, useOwnWhatsApp, customTag, customTagColor } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Prevent creating SUPER_ADMIN via API
        if (role === 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Cannot create SUPER_ADMIN users' });
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                avatar: avatar || null,
                interfacePreference: interfacePreference || 'BOTH',
                role: role || 'SELLER',
                accessGroupId: accessGroupId || null,
                useOwnWhatsApp: useOwnWhatsApp || false,
                customTag: customTag || null,
                customTagColor: customTagColor || null,
            },
        });

        res.status(201).json({
            id: user.id,
            email: user.email,
            name: user.name,
            interfacePreference: user.interfacePreference,
            role: user.role,
            accessGroupId: user.accessGroupId,
            useOwnWhatsApp: user.useOwnWhatsApp,
            customTag: user.customTag,
            customTagColor: user.customTagColor,
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                interfacePreference: true,
                role: true,
                accessGroupId: true,
                useOwnWhatsApp: true,
                customTag: true,
                customTagColor: true,
                accessGroup: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { assignedLeads: true }
                }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, avatar, email, password, interfacePreference, role, accessGroupId, useOwnWhatsApp, customTag, customTagColor } = req.body;

        // Prevent promoting to SUPER_ADMIN via API
        if (role === 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Cannot promote users to SUPER_ADMIN' });
        }

        const data: any = {};
        if (name) data.name = name;
        if (avatar !== undefined) data.avatar = avatar;
        if (email) data.email = email;
        if (password) data.passwordHash = await hashPassword(password);
        if (interfacePreference) data.interfacePreference = interfacePreference;
        if (role) data.role = role;
        if (accessGroupId !== undefined) data.accessGroupId = accessGroupId;
        if (useOwnWhatsApp !== undefined) data.useOwnWhatsApp = useOwnWhatsApp;
        if (customTag !== undefined) data.customTag = customTag;
        if (customTagColor !== undefined) data.customTagColor = customTagColor;

        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                interfacePreference: true,
                role: true,
                accessGroupId: true,
                useOwnWhatsApp: true,
                customTag: true,
                customTagColor: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            console.log('Update Profile: Unauthorized - No userId');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, avatar, email, password, interfacePreference, useOwnWhatsApp } = req.body;

        const data: any = {};
        if (name) data.name = name;
        if (avatar !== undefined) data.avatar = avatar;
        if (email) data.email = email;
        if (password) data.passwordHash = await hashPassword(password);
        if (interfacePreference) data.interfacePreference = interfacePreference;
        if (useOwnWhatsApp !== undefined) data.useOwnWhatsApp = useOwnWhatsApp;



        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                interfacePreference: true,
                role: true,
                accessGroupId: true,
                useOwnWhatsApp: true,
                customTag: true,
                customTagColor: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
    try {
        const callerId = req.user?.userId;
        if (!callerId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const targetUserId = req.body?.userId;
        const standalone = req.query?.standalone === 'true' || req.body?.standalone === 'true';

        // If standalone, just return the uploaded url (e.g. for creating a user before they exist in DB)
        if (standalone) {
            return res.json({ avatar: avatarUrl });
        }

        // Target user: either specified in body (if admin/has permission) or the authenticated user
        let userIdToUpdate = callerId;
        if (targetUserId) {
            const userPermissions = await getUserPermissions(callerId);
            const caller = await prisma.user.findUnique({ where: { id: callerId } });
            const isAdmin = caller?.role === 'SUPER_ADMIN' || caller?.role === 'ADMIN';

            if (targetUserId !== callerId && !userPermissions?.canManageUsers && !isAdmin) {
                return res.status(403).json({ error: 'Forbidden: Cannot update another user avatar' });
            }
            userIdToUpdate = targetUserId;
        }

        if (userIdToUpdate) {
            await prisma.user.update({
                where: { id: userIdToUpdate },
                data: { avatar: avatarUrl }
            });
        }

        res.json({ avatar: avatarUrl });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

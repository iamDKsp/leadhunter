import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { getUserPermissions } from '../middleware/authorization';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

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
                interfacePreference: user.interfacePreference,
                role: user.role,
                accessGroupId: user.accessGroupId,
                useOwnWhatsApp: user.useOwnWhatsApp,
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
        const { email, password, name, interfacePreference, role, accessGroupId, useOwnWhatsApp } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                interfacePreference: interfacePreference || 'BOTH',
                role: role || 'SELLER',
                accessGroupId: accessGroupId || null,
                useOwnWhatsApp: useOwnWhatsApp || false,
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
                createdAt: true,
                interfacePreference: true,
                role: true,
                accessGroupId: true,
                useOwnWhatsApp: true,
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
        const { name, email, password, interfacePreference, role, accessGroupId, useOwnWhatsApp } = req.body;

        const data: any = {};
        if (name) data.name = name;
        if (email) data.email = email;
        if (password) data.passwordHash = await hashPassword(password);
        if (interfacePreference) data.interfacePreference = interfacePreference;
        if (role) data.role = role;
        if (accessGroupId !== undefined) data.accessGroupId = accessGroupId;
        if (useOwnWhatsApp !== undefined) data.useOwnWhatsApp = useOwnWhatsApp;

        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                interfacePreference: true,
                role: true,
                accessGroupId: true,
                useOwnWhatsApp: true
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

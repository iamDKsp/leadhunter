import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getFolders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const folders = await prisma.folder.findMany({
            where: { userId },
            include: { _count: { select: { companies: true } } }
        });

        // Map to frontend expectation
        const formattedFolders = folders.map(f => ({
            id: f.id,
            name: f.name,
            color: f.color,
            leadCount: f._count.companies
        }));

        res.json(formattedFolders);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name, color } = req.body;

        const folder = await prisma.folder.create({
            data: {
                name,
                color: color || '#000000',
                userId
            }
        });

        res.status(201).json({
            id: folder.id,
            name: folder.name,
            color: folder.color,
            leadCount: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateFolder = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const folder = await prisma.folder.update({
            where: { id },
            data: req.body
        });
        res.json(folder);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteFolder = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.folder.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

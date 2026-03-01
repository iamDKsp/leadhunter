import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// GET /templates — list all templates for the current user
export const getTemplates = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const templates = await prisma.firstContactTemplate.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

// POST /templates — create a new template
export const createTemplate = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { title, body } = req.body;

        if (!title?.trim() || !body?.trim()) {
            return res.status(400).json({ error: 'title and body are required' });
        }

        const template = await prisma.firstContactTemplate.create({
            data: { title: title.trim(), body: body.trim(), userId },
        });
        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
};

// PATCH /templates/:id — update an existing template
export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { title, body } = req.body;

        const existing = await prisma.firstContactTemplate.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const updated = await prisma.firstContactTemplate.update({
            where: { id },
            data: {
                ...(title?.trim() && { title: title.trim() }),
                ...(body?.trim() && { body: body.trim() }),
            },
        });
        res.json(updated);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
};

// DELETE /templates/:id — delete a template
export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const existing = await prisma.firstContactTemplate.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Template not found' });
        }

        await prisma.firstContactTemplate.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
};

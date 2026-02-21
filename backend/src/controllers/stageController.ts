import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getStages = async (req: Request, res: Response) => {
    try {
        const stages = await prisma.stage.findMany({
            orderBy: {
                order: 'asc'
            }
        });
        res.json(stages);
    } catch (error) {
        console.error('Error fetching stages:', error);
        res.status(500).json({ error: 'Failed to fetch stages' });
    }
};

export const updateStages = async (req: Request, res: Response) => {
    try {
        const stagesData = req.body;
        console.log('Received stages update:', JSON.stringify(stagesData, null, 2));

        if (!Array.isArray(stagesData)) {
            console.error('Invalid data format');
            return res.status(400).json({ error: 'Invalid data format. Expected an array of stages.' });
        }

        // Transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Delete all existing stages (simplest approach for reordering/editing)
            // Or we could upsert. Since the list is small, deleting and recreating is acceptable for now 
            // BUT deleting breaks foreign keys if we had them. Currently Lead has stageId but as string, usually not Foreign Key.
            // Let's check schema... Lead/Company is not strictly linked to Stage model yet in schema.
            // However, to be safe and efficient, let's try to upsert or delete only missing.

            // For simplicity in this iteration:
            // 1. Delete all stages
            await tx.stage.deleteMany({});

            // 2. Create all stages
            for (const stage of stagesData) {
                await tx.stage.create({
                    data: {
                        id: stage.id, // Keep ID to not break frontend references
                        name: stage.name,
                        color: stage.color,
                        order: stage.order
                    }
                });
            }
        });

        const updatedStages = await prisma.stage.findMany({ orderBy: { order: 'asc' } });
        res.json(updatedStages);

    } catch (error) {
        console.error('Error updating stages:', error);
        res.status(500).json({ error: 'Failed to update stages' });
    }
};

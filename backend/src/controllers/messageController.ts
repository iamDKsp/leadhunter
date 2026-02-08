
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const logMsg = `[API] Fetching messages for chatId: ${chatId}\n`;
        console.log(logMsg);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('fs').appendFileSync('debug.log', `[${new Date().toISOString()}] ${logMsg}`);

        if (!chatId) {
            return res.status(400).json({ error: 'Chat ID is required' });
        }

        const messages = await prisma.message.findMany({
            where: { chatId },
            orderBy: { timestamp: 'asc' }
        });

        const foundMsg = `[API] Found ${messages.length} messages for ${chatId}\n`;
        console.log(foundMsg);
        require('fs').appendFileSync('debug.log', `[${new Date().toISOString()}] ${foundMsg}`);

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

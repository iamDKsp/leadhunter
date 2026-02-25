
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { chatId } = req.params;

        if (!chatId) {
            return res.status(400).json({ error: 'Chat ID is required' });
        }

        // Security check: verify the user has a UserChat entry for this chatId
        const cleanId = chatId.replace('@s.whatsapp.net', '').replace('@c.us', '');

        // Build all possible chatId variations for this phone number
        const possibleChatIds = [
            cleanId,
            `${cleanId}@s.whatsapp.net`,
            `${cleanId}@c.us`,
            `${cleanId}@lid`,
        ];

        if (cleanId.startsWith('55') && cleanId.length > 11) {
            const noPrefix = cleanId.substring(2);
            possibleChatIds.push(`${noPrefix}@s.whatsapp.net`);
            possibleChatIds.push(`${noPrefix}@c.us`);
            possibleChatIds.push(`${noPrefix}@lid`);
        } else if (cleanId.length <= 11) {
            const withPrefix = `55${cleanId}`;
            possibleChatIds.push(`${withPrefix}@s.whatsapp.net`);
            possibleChatIds.push(`${withPrefix}@c.us`);
            possibleChatIds.push(`${withPrefix}@lid`);
        }

        // Check if user owns this chat
        const hasAccess = await prisma.userChat.findFirst({
            where: {
                userId,
                chatId: { in: possibleChatIds }
            }
        });

        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have access to this chat' });
        }

        // Fetch messages using all variations
        const messages = await prisma.message.findMany({
            where: { chatId: { in: possibleChatIds } },
            orderBy: { timestamp: 'asc' }
        });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

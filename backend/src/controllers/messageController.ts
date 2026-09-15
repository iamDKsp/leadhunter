
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

        // Check if user owns or has permission to view this chat
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                accessGroup: {
                    select: {
                        permissions: { select: { canViewAllChats: true } }
                    }
                }
            }
        });

        const canViewAll = user?.role === 'SUPER_ADMIN' || user?.accessGroup?.permissions?.canViewAllChats;

        let hasAccess = canViewAll;

        if (!hasAccess) {
            // Check userChat
            const userChat = await prisma.userChat.findFirst({
                where: {
                    userId,
                    chatId: { in: possibleChatIds }
                }
            });

            if (userChat) {
                hasAccess = true;
            } else {
                // Check if any company with this phone is assigned to this user
                const company = await prisma.company.findFirst({
                    where: {
                        responsibleId: userId,
                        OR: [
                            { phone: { contains: cleanId } },
                            ...(cleanId.startsWith('55') && cleanId.length > 11 ? [{ phone: { contains: cleanId.substring(2) } }] : []),
                            ...(cleanId.length <= 11 ? [{ phone: { contains: `55${cleanId}` } }] : [])
                        ]
                    }
                });

                if (company) {
                    hasAccess = true;
                    // Auto-upsert UserChat so subsequent calls are tracked
                    await prisma.userChat.upsert({
                        where: { userId_chatId: { userId, chatId } },
                        create: { userId, chatId, companyId: company.id },
                        update: {}
                    }).catch(() => {});
                }
            }
        }

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

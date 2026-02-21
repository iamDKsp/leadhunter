import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { connectUserSession, logoutWhatsApp, getProfilePicUrl } from '../services/whatsappService';
import { getClient } from '../services/whatsappService';

// Helper to get effective session ID
const getEffectiveSessionId = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { useOwnWhatsApp: true, role: true }
    });
    return {
        sessionId: user?.useOwnWhatsApp ? userId : 'GLOBAL',
        useOwnWhatsApp: user?.useOwnWhatsApp || false,
        role: user?.role || 'SELLER'
    };
};

// Helper to normalize a phone into all possible chatId variations
const getChatIdVariations = (phone: string): string[] => {
    const clean = phone.replace(/\D/g, '');
    const variations = new Set<string>();

    variations.add(`${clean}@c.us`);
    variations.add(`${clean}@s.whatsapp.net`);

    if (clean.startsWith('55') && clean.length > 11) {
        const noPrefix = clean.substring(2);
        variations.add(`${noPrefix}@c.us`);
        variations.add(`${noPrefix}@s.whatsapp.net`);
    } else if (clean.length <= 11) {
        const withPrefix = `55${clean}`;
        variations.add(`${withPrefix}@c.us`);
        variations.add(`${withPrefix}@s.whatsapp.net`);
    }

    return Array.from(variations);
};

// ======================== CREATE CHAT ========================
// Called when user clicks the chat icon on a CRM card
export const createChat = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { chatId, companyId } = req.body;

        if (!chatId) {
            return res.status(400).json({ error: 'chatId is required' });
        }

        // Upsert: create if not exists, return existing if it does
        const userChat = await prisma.userChat.upsert({
            where: {
                userId_chatId: { userId, chatId }
            },
            create: {
                userId,
                chatId,
                companyId: companyId || null
            },
            update: {} // No update needed, just return existing
        });

        // If a companyId was provided, auto-assign the lead to this user if not already assigned
        if (companyId) {
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { responsibleId: true }
            });

            if (company && !company.responsibleId) {
                await prisma.company.update({
                    where: { id: companyId },
                    data: { responsibleId: userId }
                });
            }
        }

        // Also create UserChat entries for all phone variations of this chatId
        // so that regardless of which JID format messages arrive in, the user can see them
        const cleanPhone = chatId.replace(/@.*$/, '').replace(/\D/g, '');
        const variations = getChatIdVariations(cleanPhone);

        for (const variation of variations) {
            if (variation !== chatId) {
                await prisma.userChat.upsert({
                    where: { userId_chatId: { userId, chatId: variation } },
                    create: {
                        userId,
                        chatId: variation,
                        companyId: companyId || null
                    },
                    update: {}
                }).catch(() => { }); // Ignore errors for duplicates
            }
        }

        res.json({ success: true, userChat });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
};

// ======================== GET CONVERSATIONS ========================
// Returns ONLY conversations that belong to the logged-in user (via UserChat)
export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { sessionId, useOwnWhatsApp } = await getEffectiveSessionId(userId);

        // 1. Get all UserChat entries for this user
        const userChats = await prisma.userChat.findMany({
            where: { userId },
            include: {
                company: {
                    select: { id: true, name: true, phone: true, photoUrl: true }
                }
            }
        });

        if (userChats.length === 0) {
            return res.json([]);
        }

        // 2. Collect all chatIds this user owns
        const ownedChatIds = userChats.map(uc => uc.chatId);

        // 3. Fetch the latest message per chatId
        const chats = await prisma.message.findMany({
            where: { chatId: { in: ownedChatIds } },
            distinct: ['chatId'],
            orderBy: { timestamp: 'desc' },
            select: {
                chatId: true,
                senderName: true,
                timestamp: true,
                body: true,
                ack: true,
                fromMe: true
            }
        });

        // 4. Fetch unread counts
        const chatIds = chats.map(c => c.chatId);
        const unreadCounts = await prisma.message.groupBy({
            by: ['chatId'],
            where: {
                chatId: { in: chatIds },
                fromMe: false,
                ack: { lt: 3 }
            },
            _count: { _all: true }
        });

        const unreadMap = new Map<string, number>();
        unreadCounts.forEach(count => {
            unreadMap.set(count.chatId, count._count._all);
        });

        // 5. Build a company map from UserChat entries
        const companyMap = new Map<string, any>();
        userChats.forEach(uc => {
            if (uc.company) {
                companyMap.set(uc.chatId, uc.company);
            }
        });

        // Also build a reverse map by phone for secondary matching
        const companyByPhone = new Map<string, any>();
        userChats.forEach(uc => {
            if (uc.company?.phone) {
                const clean = uc.company.phone.replace(/\D/g, '');
                if (clean) companyByPhone.set(clean, uc.company);
            }
        });

        // 6. Build final conversation list
        const finalChatsMap = new Map<string, any>();

        for (const chat of chats) {
            const chatPhone = chat.chatId.replace(/\D/g, '');
            let key = chatPhone;
            if (key.startsWith('55') && key.length > 11) key = key.substring(2);

            // Find company
            let company = companyMap.get(chat.chatId);
            if (!company) {
                company = companyByPhone.get(chatPhone);
                if (!company && chatPhone.startsWith('55')) {
                    company = companyByPhone.get(chatPhone.substring(2));
                }
                if (!company) {
                    company = companyByPhone.get(`55${chatPhone}`);
                }
            }

            // Determine lead name
            let leadName = 'Desconhecido';
            if (company?.name) {
                leadName = company.name;
            } else if (chat.senderName && !chat.fromMe && chat.senderName !== 'Me') {
                leadName = chat.senderName;
            } else {
                try {
                    const numbers = chatPhone;
                    if (numbers.length >= 10) {
                        if (numbers.startsWith('55') && numbers.length === 13) {
                            leadName = `+${numbers.substring(0, 2)} (${numbers.substring(2, 4)}) ${numbers.substring(4, 9)}-${numbers.substring(9)}`;
                        } else if (numbers.length === 11) {
                            leadName = `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
                        } else {
                            leadName = `+${numbers}`;
                        }
                    } else {
                        leadName = numbers;
                    }
                } catch (e) {
                    leadName = chatPhone;
                }
            }

            const unread = unreadMap.get(chat.chatId) || 0;
            const existing = finalChatsMap.get(key);
            const timestamp = chat.timestamp;

            // Fetch profile pic
            let avatar = existing?.avatar;
            if (!avatar) {
                try {
                    const sessionForPic = useOwnWhatsApp ? sessionId : undefined;
                    avatar = await getProfilePicUrl(chatPhone, sessionForPic);
                } catch (e) { }
            }

            if (!existing || timestamp > existing.rawTimestamp) {
                finalChatsMap.set(key, {
                    id: chat.chatId,
                    leadName,
                    businessName: company?.name || '',
                    lastMessage: chat.body,
                    timestamp: new Date(chat.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    rawTimestamp: timestamp,
                    unreadCount: (existing?.unreadCount || 0) + unread,
                    phone: company?.phone || chatPhone,
                    status: 'warm',
                    isRead: ((existing?.unreadCount || 0) + unread) === 0,
                    avatar
                });
            } else {
                existing.unreadCount += unread;
                existing.isRead = existing.unreadCount === 0;
                finalChatsMap.set(key, existing);
            }
        }

        // 7. Add empty chats for UserChat entries that have no messages yet
        for (const uc of userChats) {
            const chatPhone = uc.chatId.replace(/\D/g, '');
            let key = chatPhone;
            if (key.startsWith('55') && key.length > 11) key = key.substring(2);

            if (!finalChatsMap.has(key)) {
                const company = uc.company;
                let avatar = undefined;
                try {
                    const sessionForPic = useOwnWhatsApp ? sessionId : undefined;
                    avatar = await getProfilePicUrl(chatPhone, sessionForPic);
                } catch (e) { }

                finalChatsMap.set(key, {
                    id: uc.chatId,
                    leadName: company?.name || chatPhone,
                    businessName: company?.name || '',
                    lastMessage: 'Nova conversa',
                    timestamp: '',
                    rawTimestamp: 0,
                    unreadCount: 0,
                    phone: company?.phone || chatPhone,
                    status: 'warm',
                    isRead: true,
                    avatar
                });
            }
        }

        const sortedChats = Array.from(finalChatsMap.values()).sort((a, b) => b.rawTimestamp - a.rawTimestamp);
        res.json(sortedChats);
    } catch (error) {
        console.error('Error getting conversations:', error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        res.status(500).json({ error: 'Failed to get conversations' });
    }
};

// ======================== DELETE CHAT ========================
// Removes the user's ownership of a chat (doesn't delete messages)
export const deleteChat = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { chatId } = req.params;

        if (!chatId) {
            return res.status(400).json({ error: 'chatId is required' });
        }

        // Delete all variations of the chatId for this user
        const cleanPhone = chatId.replace(/@.*$/, '').replace(/\D/g, '');
        const variations = getChatIdVariations(cleanPhone);

        await prisma.userChat.deleteMany({
            where: {
                userId,
                chatId: { in: variations }
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
};

// ======================== SESSION STATUS ========================
export const getSessionStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { sessionId } = await getEffectiveSessionId(userId);

        const client = getClient(sessionId);

        if (client && client.user) {
            res.json({ status: 'CONNECTED', me: client.user.id });
        } else if (client) {
            res.json({ status: 'Connecting...' });
        } else {
            res.json({ status: 'DISCONNECTED' });
        }
    } catch (error) {
        console.error('Error getting session status:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
};

// ======================== CONNECT / LOGOUT ========================
export const connectSession = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    try {
        await connectUserSession(userId);
        res.json({ success: true, message: 'Session initialization started' });
    } catch (e) {
        console.error('Error connecting session:', e);
        if (e instanceof Error) console.error(e.stack);
        res.status(500).json({ error: 'Failed to start session' });
    }
};

export const logoutSession = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    try {
        await logoutWhatsApp(userId);
        res.json({ success: true });
    } catch (e) {
        console.error('Error logging out:', e);
        res.status(500).json({ error: 'Failed to logout' });
    }
};

// ======================== SEND MEDIA ========================
import { sendMedia as sendMediaService } from '../services/whatsappService';

export const sendMedia = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { to, file, type } = req.body;

        await sendMediaService(to, file, type || 'image', userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending media:', error);
        res.status(500).json({ error: 'Failed to send media' });
    }
};

// ======================== MARK AS READ ========================
export const markChatAsRead = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        if (!chatId) return res.status(400).json({ error: 'Chat ID required' });

        const cleanId = chatId.replace('@s.whatsapp.net', '').replace('@c.us', '');
        const idsToUpdate = getChatIdVariations(cleanId);

        await prisma.message.updateMany({
            where: {
                chatId: { in: idsToUpdate },
                fromMe: false,
                ack: { lt: 3 }
            },
            data: {
                ack: 3
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking chat as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

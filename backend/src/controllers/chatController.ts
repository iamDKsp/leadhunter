import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { connectUserSession, logoutWhatsApp, getProfilePicUrl } from '../services/whatsappService';
// Import sessions map? No, I need an exported check function or just wrap it in service.
// I'll update service to export a checker, or just rely on connectUserSession being idempotent-ish.
import { getClient } from '../services/whatsappService';

const prisma = new PrismaClient();

import { getUserPermissions } from '../middleware/authorization';

export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const permissions = await getUserPermissions(userId);

        let whereClause: any = {};

        // Privacy Filter: If cannot view all leads, filter by assigned companies
        if (permissions && !permissions.canViewAllLeads) {
            // Get user's assigned companies
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { assignedLeads: { select: { phone: true } } }
            });

            if (!user) return res.status(404).json({ error: 'User not found' });

            const assignedPhones = user.assignedLeads
                .map(l => l.phone?.replace(/\D/g, ''))
                .filter(Boolean) as string[];

            // Build list of possible chatIds (exact, with 55, without 55)
            // ChatId always has @c.us
            const allowedChatIds = assignedPhones.flatMap(phone => {
                const p = phone;
                return [`${p}@c.us`, `55${p}@c.us`, `${p.replace(/^55/, '')}@c.us`];
            });

            if (allowedChatIds.length > 0) {
                whereClause = {
                    chatId: { in: allowedChatIds }
                };
            } else {
                return res.json([]); // No assigned leads -> No chats visible
            }
        }

        // Fetch distinct chatIds from messages matching filter
        const chats = await prisma.message.findMany({
            where: whereClause,
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

        // Optimization: Fetch all companies with phone numbers once
        const companies = await prisma.company.findMany({
            where: {
                phone: { not: null }
            },
            select: { id: true, name: true, phone: true }
        });

        // Create a map of Cleaned Phone -> Company
        const companyMap = new Map();
        companies.forEach(company => {
            if (company.phone) {
                const clean = company.phone.replace(/\D/g, '');
                if (clean) companyMap.set(clean, company);
            }
        });

        // Optimization: Fetch unread counts in one query (GROUP BY)
        const chatIds = chats.map(c => c.chatId);
        const unreadCounts = await prisma.message.groupBy({
            by: ['chatId'],
            where: {
                chatId: { in: chatIds },
                fromMe: false,
                ack: { lt: 3 } // ack < 3 usually means not read/blue ticks
            },
            _count: {
                _all: true
            }
        });

        const unreadMap = new Map();
        unreadCounts.forEach(count => {
            unreadMap.set(count.chatId, count._count._all);
        });

        // Enrich with Company info (Lead name)
        const enrichedChats = await Promise.all(chats.map(async (chat) => {
            const chatPhone = chat.chatId.replace(/\D/g, ''); // e.g. 5514997603870

            // Try matching strategies
            // 1. Exact match
            let company = companyMap.get(chatPhone);

            // 2. Try removing Country Code (55) from chat phone if not found
            if (!company && chatPhone.startsWith('55')) {
                company = companyMap.get(chatPhone.substring(2));
            }

            // 3. Try adding Country Code (55) to chat phone if not found
            if (!company) {
                company = companyMap.get(`55${chatPhone}`);
            }

            // Fetch Profile Pic
            let avatar = undefined;
            try {
                // Keep this async per item or cache it? 
                // For now, keeping it as is might be slow but profile pics are tricky.
                // Could be optimized later or loaded lazily by frontend.
                avatar = await getProfilePicUrl(chatPhone, userId);
            } catch (e) { }

            return {
                id: chat.chatId,
                leadName: company?.name || chat.senderName || 'Desconhecido',
                businessName: company?.name,
                lastMessage: chat.body,
                timestamp: new Date(chat.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unreadCount: unreadMap.get(chat.chatId) || 0,
                phone: company?.phone || chat.chatId,
                status: 'warm', // Placeholder logic
                isRead: (unreadMap.get(chat.chatId) || 0) === 0,
                avatar: avatar
            };
        }));

        res.json(enrichedChats);
    } catch (error) {
        console.error('Error getting conversations:', error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        res.status(500).json({ error: 'Failed to get conversations' });
    }
};

export const getSessionStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const client = getClient(userId);

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

import { sendMedia as sendMediaService } from '../services/whatsappService';

export const sendMedia = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { to, file, type } = req.body;
        // file is base64 string

        await sendMediaService(to, file, type || 'image', userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending media:', error);
        res.status(500).json({ error: 'Failed to send media' });
    }
};

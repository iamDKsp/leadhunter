import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// GET /monitoring/stats - Team overview stats
export const getStats = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true },
        });

        // Get active sessions
        const activeSessions = await prisma.userSession.findMany({
            where: {
                sessionEnd: null,
                lastActivity: {
                    gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
                },
            },
        });

        const onlineUserIds = new Set<string>();
        const awayUserIds = new Set<string>();

        activeSessions.forEach((session) => {
            const minutesSinceActivity =
                (Date.now() - session.lastActivity.getTime()) / 60000;
            if (minutesSinceActivity < 5) {
                onlineUserIds.add(session.userId);
            } else {
                awayUserIds.add(session.userId);
            }
        });

        // Count total active chats (unique chatIds in messages for today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const messagesGrouped = await prisma.message.groupBy({
            by: ['chatId'],
            where: {
                createdAt: { gte: todayStart },
                fromMe: true,
            },
        });

        res.json({
            totalUsers: users.length,
            onlineUsers: onlineUserIds.size,
            awayUsers: awayUserIds.size,
            totalChats: messagesGrouped.length,
        });
    } catch (error) {
        console.error('Error getting monitoring stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
};

// GET /monitoring/users - All users with online status
export const getUsers = async (req: Request, res: Response) => {
    try {
        // Get filters from query params
        const { status: statusFilter, dateFrom, dateTo } = req.query;

        let dateFromFilter: Date | undefined;
        let dateToFilter: Date | undefined;

        if (dateFrom) {
            dateFromFilter = new Date(dateFrom as string);
        }
        if (dateTo) {
            dateToFilter = new Date(dateTo as string);
            dateToFilter.setHours(23, 59, 59, 999);
        }

        const users = await prisma.user.findMany({
            where: {
                role: { not: 'SUPER_ADMIN' }, // Don't show super admins in monitoring
            },
            select: {
                id: true,
                name: true,
                email: true,
                sessions: {
                    where: { sessionEnd: null },
                    orderBy: { lastActivity: 'desc' },
                    take: 1,
                },
            },
        });

        // Calculate status for each user
        const usersWithStatus = users.map((user) => {
            const lastSession = user.sessions[0];
            let status: 'online' | 'away' | 'offline' = 'offline';
            let lastSeen = 'Nunca';
            let lastSeenDate = new Date(0);
            let sessionDuration = '0min';

            if (lastSession) {
                const minutesSinceActivity =
                    (Date.now() - lastSession.lastActivity.getTime()) / 60000;

                if (minutesSinceActivity < 5) {
                    status = 'online';
                    lastSeen = 'Agora';
                } else if (minutesSinceActivity < 30) {
                    status = 'away';
                    lastSeen = `Há ${Math.round(minutesSinceActivity)} min`;
                } else {
                    status = 'offline';
                    const hours = Math.floor(minutesSinceActivity / 60);
                    if (hours < 24) {
                        lastSeen = `Há ${hours} hora${hours > 1 ? 's' : ''}`;
                    } else {
                        lastSeen = `Há ${Math.floor(hours / 24)} dia${Math.floor(hours / 24) > 1 ? 's' : ''}`;
                    }
                }

                lastSeenDate = lastSession.lastActivity;

                // Calculate session duration
                const durationMs =
                    lastSession.lastActivity.getTime() -
                    lastSession.sessionStart.getTime();
                const durationMins = Math.floor(durationMs / 60000);
                if (durationMins < 60) {
                    sessionDuration = `${durationMins}min`;
                } else {
                    const hours = Math.floor(durationMins / 60);
                    const mins = durationMins % 60;
                    sessionDuration = `${hours}h ${mins}min`;
                }
            }

            return {
                id: user.id,
                name: user.name || 'Sem nome',
                email: user.email,
                status,
                lastSeen,
                lastSeenDate,
                sessionDuration,
            };
        });

        // Apply filters
        let filteredUsers = usersWithStatus;

        if (statusFilter && statusFilter !== 'all') {
            filteredUsers = filteredUsers.filter((u) => u.status === statusFilter);
        }

        if (dateFromFilter) {
            filteredUsers = filteredUsers.filter(
                (u) => u.lastSeenDate >= dateFromFilter!
            );
        }

        if (dateToFilter) {
            filteredUsers = filteredUsers.filter(
                (u) => u.lastSeenDate <= dateToFilter!
            );
        }

        res.json(filteredUsers);
    } catch (error) {
        console.error('Error getting monitoring users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
};

// GET /monitoring/chats/:userId - Chat history for specific user
export const getUserChats = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // 1. Get leads assigned to this user
        const leads = await prisma.company.findMany({
            where: { responsibleId: userId },
            select: {
                id: true,
                name: true,
                phone: true,
            },
        });

        // 2. Get UserChats for this user (connected WhatsApp arbitrary chats)
        const userChats = await prisma.userChat.findMany({
            where: { userId },
            select: { chatId: true }
        });

        // Map to quickly find lead name by phone
        const leadByPhone = new Map<string, string>();
        leads.forEach(lead => {
            if (lead.phone) {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                // Map common Brazilian variations
                leadByPhone.set(`${cleanPhone}@c.us`, lead.name);
                if (cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
                    leadByPhone.set(`55${cleanPhone}@c.us`, lead.name);
                }
                // Try s.whatsapp.net as well
                leadByPhone.set(`${cleanPhone}@s.whatsapp.net`, lead.name);
                if (cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
                    leadByPhone.set(`55${cleanPhone}@s.whatsapp.net`, lead.name);
                }
            }
        });

        // Consolidate all target chat IDs
        const targetChatIds = new Set<string>();

        leads.forEach(lead => {
            if (lead.phone) {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                targetChatIds.add(`${cleanPhone}@c.us`);
                if (cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
                    targetChatIds.add(`55${cleanPhone}@c.us`);
                }
            }
        });

        userChats.forEach(uc => {
            targetChatIds.add(uc.chatId);
            // Also add .us to .net or vice versa just in case
            if (uc.chatId.endsWith('@c.us')) targetChatIds.add(uc.chatId.replace('@c.us', '@s.whatsapp.net'));
            if (uc.chatId.endsWith('@s.whatsapp.net')) targetChatIds.add(uc.chatId.replace('@s.whatsapp.net', '@c.us'));
        });

        if (targetChatIds.size === 0) {
            return res.json({ activeChats: 0, chatHistory: [] });
        }

        // 3. Single optimized query: Get messages for all target chat IDs
        const allMessages = await prisma.message.findMany({
            where: {
                chatId: { in: Array.from(targetChatIds) }
            },
            orderBy: { timestamp: 'asc' },
            // We cannot limit easily per chat in a single findMany without window functions in SQL,
            // but for monitoring we usually don't have millions of recent messages anyway.
            // If the DB is huge, we might need a raw query with row_number(). For now, get last week or reasonable chunks.
            // Let's get messages from the last 7 days to restrict size.
            // where: { timestamp: { gte: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60 } } 
        });

        // Group messages by chatId
        const messagesByChat = new Map<string, any[]>();

        allMessages.forEach(msg => {
            // Check both variations
            let canonicalChatId = msg.chatId;
            if (canonicalChatId.endsWith('@s.whatsapp.net')) {
                canonicalChatId = canonicalChatId.replace('@s.whatsapp.net', '@c.us');
            }

            if (!messagesByChat.has(canonicalChatId)) {
                messagesByChat.set(canonicalChatId, []);
            }
            messagesByChat.get(canonicalChatId)!.push(msg);
        });

        const chatHistory = [];
        let activeChatsCount = 0;

        for (const [chatId, msgs] of messagesByChat.entries()) {
            if (msgs.length === 0) continue;

            // Keep only latest 50 messages to not overload frontend
            const recentMsgs = msgs.slice(-50);
            activeChatsCount++;

            // Extract contact name & phone
            const leadName = leadByPhone.get(chatId) || leadByPhone.get(chatId.replace('@c.us', '@s.whatsapp.net'));

            // Fallback for non-lead
            let displayPhone = chatId.replace('@c.us', '').replace('@s.whatsapp.net', '');
            let displayName = leadName || recentMsgs.find(m => m.senderName && m.senderName !== 'Me')?.senderName || displayPhone;

            chatHistory.push({
                leadName: displayName,
                leadPhone: displayPhone,
                messages: recentMsgs.map((msg: any) => ({
                    id: msg.id,
                    sender: msg.fromMe ? 'user' : 'lead',
                    content: msg.body,
                    timestamp: formatMessageTime(msg.timestamp),
                    read: msg.ack >= 3,
                })),
            });
        }

        res.json({
            activeChats: chatHistory.length, // use length of generated history
            chatHistory: chatHistory,
        });
    } catch (error) {
        console.error('Error getting user chats:', error);
        res.status(500).json({ error: 'Failed to get chats' });
    }
};

// POST /monitoring/heartbeat - Update user's online status
export const heartbeat = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // Find current session or create new one
        let session = await prisma.userSession.findFirst({
            where: {
                userId,
                sessionEnd: null,
            },
        });

        if (session) {
            // Update last activity
            session = await prisma.userSession.update({
                where: { id: session.id },
                data: {
                    lastActivity: new Date(),
                    status: 'online',
                },
            });
        } else {
            // Create new session
            session = await prisma.userSession.create({
                data: {
                    userId,
                    status: 'online',
                    lastActivity: new Date(),
                    sessionStart: new Date(),
                },
            });
        }

        res.json({ success: true, sessionId: session.id });
    } catch (error) {
        console.error('Error updating heartbeat:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
};

// POST /monitoring/logout - End user session
export const logout = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        await prisma.userSession.updateMany({
            where: {
                userId,
                sessionEnd: null,
            },
            data: {
                sessionEnd: new Date(),
                status: 'offline',
            },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error logging out session:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
};

// Helper: Format message timestamp
function formatMessageTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    WAMessage,
    jidNormalizedUser,
    proto,
    downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Server } from 'socket.io';
import prisma from '../lib/prisma';
import qrcode from 'qrcode';
import fs from 'fs';
import pino from 'pino';
import path from 'path';
import { writeFile } from 'fs/promises';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Map userId -> Socket. 'GLOBAL' is the default one.
const sessions = new Map<string, any>();
let io: Server;

// Track global status and QR for polling
let globalStatus = 'DISCONNECTED';
let globalQr: string | null = null;

const logger = pino({ level: 'silent' }); // Set to 'debug' for debugging

// Helper to find company by phone (optimized: query by phone variations instead of loading all)
const findCompanyByPhone = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');

    // Build possible phone variations to search for
    const variations: string[] = [cleanPhone];
    if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
        variations.push(cleanPhone.substring(2)); // Without country code
    } else if (cleanPhone.length <= 11) {
        variations.push('55' + cleanPhone); // With country code
    }

    // Use a targeted query instead of loading all companies
    const company = await prisma.company.findFirst({
        where: {
            OR: variations.map(v => ({
                phone: { contains: v }
            }))
        },
        select: { id: true, phone: true }
    });

    return company;
};

const updateCompanyStatus = async (phone: string, status: string, contacted: boolean = true) => {
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        const company = await findCompanyByPhone(cleanPhone);

        if (company) {
            await prisma.company.update({
                where: { id: company.id },
                data: { status: status, contacted: contacted }
            });
            // console.log(`Updated company ${company.id} status to ${status}`);
        }
    } catch (e) {
        console.error("Error updating company status:", e);
    }
};

// --- HELPER: Resolve @lid to real phone number ---
const resolveLidToPhone = (lid: string, sessionId: string): string | null => {
    try {
        const cleanLid = lid.replace('@lid', '');
        const authFolder = path.resolve(__dirname, `../../baileys_auth_info/${sessionId}`);
        if (!fs.existsSync(authFolder)) return null;

        const files = fs.readdirSync(authFolder);
        for (const file of files) {
            if (file.startsWith('lid-mapping-') && file.endsWith('.json')) {
                const filePath = path.join(authFolder, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                // The file contains exactly the @lid number as a string, e.g. "33530943901795"
                if (content.includes(cleanLid)) {
                    // Extract phone number from filename: lid-mapping-{phone}.json
                    const phone = file.replace('lid-mapping-', '').replace('.json', '');
                    return `${phone}@s.whatsapp.net`;
                }
            }
        }
    } catch (error) {
        console.error(`Failed to resolve lid ${lid} to phone in session ${sessionId}:`, error);
    }
    return null; // Could not resolve
};

// Initialize a specific session
const createSession = async (sessionId: string) => {
    console.log(`Initializing WhatsApp Session: ${sessionId}`);

    const authFolder = path.resolve(__dirname, `../../baileys_auth_info/${sessionId}`);

    // Create auth folder if not exists
    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false, // We send to frontend
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true,
        // browser: ['LeadHunter', 'Chrome', '1.0.0'],
    });

    sessions.set(sessionId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`QR Code received for session ${sessionId}`);
            try {
                const dataUrl = await qrcode.toDataURL(qr);
                globalQr = dataUrl;
                globalStatus = 'QR_RECEIVED';
                io.emit('whatsapp_qr', { qr: dataUrl, sessionId });
                io.emit('whatsapp_status', { status: 'QR_RECEIVED', qr: dataUrl, sessionId });
            } catch (err) {
                console.error('Error generating QR', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Connection closed for ${sessionId} due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

            if (sessionId === 'GLOBAL') {
                globalStatus = 'DISCONNECTED';
                globalQr = null;
            }

            io.emit('whatsapp_status', { status: 'DISCONNECTED', sessionId });

            if (shouldReconnect) {
                createSession(sessionId);
            } else {
                console.log(`Session ${sessionId} logged out. Deleting session.`);
                if (fs.existsSync(authFolder)) {
                    fs.rmSync(authFolder, { recursive: true, force: true });
                }
                sessions.delete(sessionId);
                // If global logged out, we might want to restart it to wait for new scan
                if (sessionId === 'GLOBAL') {
                    createSession('GLOBAL');
                }
            }
        } else if (connection === 'open') {
            console.log(`WhatsApp Session ${sessionId} opened!`);
            if (sessionId === 'GLOBAL') {
                globalStatus = 'CONNECTED';
                globalQr = null;
            }
            io.emit('whatsapp_status', { status: 'CONNECTED', sessionId });
        }
    });

    sock.ev.on('messages.upsert', async (upsert) => {
        if (upsert.type === 'notify') {
            for (const msg of upsert.messages) {
                if (!msg.message || msg.key.remoteJid === 'status@broadcast') continue;

                // console.log(`MESSAGE RECEIVED on session ${sessionId}`, JSON.stringify(msg, null, 2));

                await handleIncomingMessage(msg, sessionId);
            }
        }
    });
};

const handleIncomingMessage = async (msg: WAMessage, sessionId: string) => {
    try {
        const id = msg.key.id;

        // --- FIX @LID FORMAT ---
        // sometimes modern WA Web linked devices send messages with @lid
        let from = msg.key.remoteJid!;

        if (from.includes('@lid')) {
            // Priority 1: Check if Baileys auth state has a mapping file for this @lid
            const resolvedJid = resolveLidToPhone(from, sessionId);
            if (resolvedJid) {
                console.log(`Resolved opaque @lid ${from} -> ${resolvedJid}`);
                from = resolvedJid;
            }
            // Priority 2: In groups, participant is the sender. For linked devices sometimes participant is the real JID
            else if (msg.key.participant && msg.key.participant.includes('@s.whatsapp.net')) {
                from = msg.key.participant;
            }
        } else if (from.includes('@g.us') && msg.key.participant) {
            from = msg.key.participant;
        }

        const fromMe = msg.key.fromMe || false;
        const pushName = msg.pushName || 'Unknown';

        // Extract body
        let body = '';
        let type = 'text';

        const messageContent = msg.message!;

        if (messageContent.conversation) {
            body = messageContent.conversation;
        } else if (messageContent.extendedTextMessage) {
            body = messageContent.extendedTextMessage.text || '';
        } else if (
            messageContent.imageMessage ||
            messageContent.videoMessage ||
            messageContent.audioMessage ||
            messageContent.documentMessage ||
            messageContent.stickerMessage
        ) {
            try {
                // Download Media
                const buffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    {
                        logger,
                        reuploadRequest: (msg as any).update
                    }
                );

                // Determine extension and type
                let ext = 'bin';
                if (messageContent.imageMessage) {
                    type = 'image';
                    ext = 'jpg'; // simplified
                    body = messageContent.imageMessage.caption || '';
                } else if (messageContent.videoMessage) {
                    type = 'video';
                    ext = 'mp4';
                    body = messageContent.videoMessage.caption || '';
                } else if (messageContent.audioMessage) {
                    type = 'audio';
                    ext = 'ogg'; // WhatsApp audio is usually OGG Opus
                    if (messageContent.audioMessage.ptt) type = 'ptt';
                } else if (messageContent.documentMessage) {
                    type = 'document';
                    ext = messageContent.documentMessage.mimetype?.split('/')[1] || 'bin';
                    body = messageContent.documentMessage.fileName || '';
                } else if (messageContent.stickerMessage) {
                    type = 'image'; // treat as image for now
                    ext = 'webp';
                }

                // Save to file
                const fileName = `${msg.key.id}.${ext}`;
                const mediaPath = path.resolve(__dirname, '../../public/media', fileName);

                // Ensure public/media exists
                const mediaDir = path.dirname(mediaPath);
                if (!fs.existsSync(mediaDir)) {
                    fs.mkdirSync(mediaDir, { recursive: true });
                }

                await writeFile(mediaPath, buffer);

                // Set body to URL
                // We store the URL. If there was a caption, we lose it in this simple schema or append it?
                // For now, let's just store the URL. The UI renders the image from the URL.
                // If we want caption, we need a separate field or JSON.
                // Given the "body" usage in MessageBubble, it expects the source.
                const mediaUrl = `${API_URL}/media/${fileName}`;

                // If there's a caption, ideally we'd store it. But `MessageBubble` uses `content` as `src`.
                // Let's store URL. If there's a caption, maybe we can append it with a delimiter?
                // For now, just the URL to fix the preview.
                body = mediaUrl;

            } catch (err) {
                console.error('Failed to download media:', err);
                body = '[Media Error]';
            }
        }

        // Avoid duplicate saving of own messages sent by THIS socket (upsert catches them too sometimes if echo is not handled right)
        // But Baileys usually doesn't notify own messages in 'notify' unless configured?
        // Actually it does. Let's check `fromMe`.

        // If fromMe, we might have already saved it when sending? 
        // If we sent via phone, we need to save it.
        // If we sent via API, we saved it there.
        // To avoid duplicates: check if exists?

        const existing = await prisma.message.findUnique({ where: { id: id! } });
        if (existing) return;

        await prisma.message.create({
            data: {
                id: id!,
                body: body,
                from: from,
                to: fromMe ? from : (jidNormalizedUser(sessions.get(sessionId)?.user?.id) || 'Me'),
                senderName: pushName,
                timestamp: Math.floor(Date.now() / 1000), // Approximate if msg doesn't have it easily or use msg.messageTimestamp
                fromMe: fromMe, // Changed logic for fromMe
                chatId: from,
                type: type,
            }
        });

        if (!fromMe) {
            await updateCompanyStatus(from, 'Pendente Rsp.');
        }

        io.emit('whatsapp_message', {
            id: id!,
            body: body,
            from: from,
            senderName: pushName,
            timestamp: Date.now() / 1000,
            fromMe: fromMe,
            type: type,
            sessionId: sessionId,
            chatId: from // important for frontend matching
        });

        // Track ownership if not GLOBAL
        if (sessionId !== 'GLOBAL') {
            await prisma.userChat.upsert({
                where: {
                    userId_chatId: {
                        userId: sessionId,
                        chatId: from
                    }
                },
                update: {},
                create: {
                    userId: sessionId,
                    chatId: from
                }
            });
        }

    } catch (e) {
        console.error(`Error handling message for ${sessionId}`, e);
    }
}

// Start Global Session
export const initWhatsApp = (socketIo?: Server) => {
    if (socketIo) {
        io = socketIo;
    }
    if (!io) {
        console.error("Socket.IO not initialized!");
        return;
    }
    createSession('GLOBAL');
};

// Start or Get User Session
export const connectUserSession = async (userId: string) => {
    if (!sessions.has(userId)) {
        await createSession(userId);
    } else {
        // Force re-check status
        const sock = sessions.get(userId);
        if (sock?.user) {
            io.emit('whatsapp_status', { status: 'CONNECTED', sessionId: userId });
        }
    }
};

export const restoreSessions = async () => {
    console.log("Attempting to restore WhatsApp sessions...");
    const authRoot = path.resolve(__dirname, '../../baileys_auth_info');

    if (!fs.existsSync(authRoot)) {
        console.log("No auth folder found. Skipping restoration.");
        return;
    }

    try {
        const files = fs.readdirSync(authRoot);
        for (const file of files) {
            // Check if it is a directory (session folder)
            if (fs.lstatSync(path.join(authRoot, file)).isDirectory()) {
                const sessionId = file;
                if (!sessions.has(sessionId)) {
                    // Skip 'GLOBAL' if it was already initialized by initWhatsApp
                    if (sessionId === 'GLOBAL') continue;

                    console.log(`Restoring session: ${sessionId}`);
                    // Stagger start to avoid mass CPU usage
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    createSession(sessionId);
                }
            }
        }
    } catch (e) {
        console.error("Error restoring sessions:", e);
    }
};

export const getClient = (sessionId: string = 'GLOBAL') => sessions.get(sessionId);

export const sendMessage = async (to: string, message: string, userId: string = 'GLOBAL') => {
    let targetSessionId = userId;
    if (!sessions.has(targetSessionId)) {
        console.warn(`Session ${targetSessionId} not found, falling back to GLOBAL`);
        targetSessionId = 'GLOBAL';
    }

    const sock = sessions.get(targetSessionId);
    if (!sock) throw new Error("Client not initialized");

    try {
        let jid = to;
        // Format JID
        if (!jid.includes('@s.whatsapp.net') && !jid.includes('@g.us')) {
            jid = jid.replace(/\D/g, '');
            // Use US format if not Brazil? Assuming Brazil 55
            if (jid.length <= 11 && !jid.startsWith('55')) {
                jid = '55' + jid;
            }
            jid = `${jid}@s.whatsapp.net`;
        }

        // --- BEST-EFFORT JID RESOLUTION via onWhatsApp() ---
        // This resolves the correct number format (e.g. 8 vs 9 digits in Brazil).
        // It does NOT block sending — cold first-contact messages must always go through.
        try {
            const [result] = await sock.onWhatsApp(jid);
            if (result?.jid) {
                // Use the verified JID returned by WhatsApp for correct formatting
                jid = result.jid;
                console.log(`[sendMessage] JID resolved via onWhatsApp: ${jid}`);
            }
        } catch (lookupErr: any) {
            // Lookup failed (network, timeout, etc.) — proceed with the formatted JID anyway
            console.warn(`[sendMessage] onWhatsApp lookup failed for ${jid}, proceeding anyway:`, lookupErr.message);
        }

        const sentMsg = await sock.sendMessage(jid, { text: message });

        // Save to DB
        // Note: sentMsg result in Baileys is limited, wait for upsert or save manually?
        // Saving manually is faster for UI response.

        await prisma.message.create({
            data: {
                id: sentMsg?.key.id!,
                body: message,
                from: jidNormalizedUser(sock.user?.id),
                to: jid,
                senderName: 'Me',
                timestamp: Math.floor(Date.now() / 1000),
                fromMe: true,
                chatId: jid,
                ack: 1
            }
        });

        await updateCompanyStatus(jid, 'Contatado');

        io.emit('whatsapp_message', {
            id: sentMsg?.key.id!,
            body: message,
            from: jid,
            senderName: 'Me',
            timestamp: Date.now() / 1000,
            fromMe: true, // IMPORTANT for frontend to stick it to right side
            ack: 1,
            sessionId: targetSessionId,
            chatId: jid
        });

        if (targetSessionId !== 'GLOBAL') {
            await prisma.userChat.upsert({
                where: {
                    userId_chatId: {
                        userId: targetSessionId,
                        chatId: jid
                    }
                },
                update: {},
                create: {
                    userId: targetSessionId,
                    chatId: jid
                }
            });
        }

    } catch (error) {
        console.error("Error in sendMessage service:", error);
        throw error;
    }
}

export const sendMedia = async (to: string, base64: string, type: 'ptt' | 'image' | 'audio', userId: string = 'GLOBAL') => {
    let targetSessionId = userId;
    if (!sessions.has(targetSessionId)) {
        targetSessionId = 'GLOBAL';
    }
    const sock = sessions.get(targetSessionId);
    if (!sock) throw new Error("Client not initialized");

    try {
        let jid = to;
        if (!jid.includes('@s.whatsapp.net') && !jid.includes('@g.us')) {
            jid = jid.replace(/\D/g, '');
            if (jid.length <= 11 && !jid.startsWith('55')) {
                jid = '55' + jid;
            }
            jid = `${jid}@s.whatsapp.net`;
        }

        const b64data = base64.split(',')[1];
        const buffer = Buffer.from(b64data, 'base64');
        const mimetype = base64.split(';')[0].split(':')[1];
        const ext = mimetype.split('/')[1] || 'bin';

        let msgPayload: any = {};

        if (type === 'ptt' || type === 'audio') {
            msgPayload = { audio: buffer, mimetype: mimetype, ptt: type === 'ptt' };
        } else if (type === 'image') {
            msgPayload = { image: buffer, caption: '' };
        } else {
            msgPayload = { document: buffer, mimetype: mimetype, fileName: `file.${ext}` };
        }

        const sentMsg = await sock.sendMessage(jid, msgPayload);
        const messageId = sentMsg?.key.id || `sent_${Date.now()}`;

        // Save file locally for history
        const fileName = `${messageId}.${ext}`;
        const mediaPath = path.resolve(__dirname, '../../public/media', fileName);

        // Ensure public/media exists
        const mediaDir = path.dirname(mediaPath);
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        await writeFile(mediaPath, buffer);
        const mediaUrl = `${API_URL}/media/${fileName}`;

        // Save to DB
        await prisma.message.create({
            data: {
                id: messageId,
                body: mediaUrl, // Save URL instead of [Media]
                from: jidNormalizedUser(sock.user?.id),
                to: jid,
                senderName: 'Me',
                timestamp: Math.floor(Date.now() / 1000),
                fromMe: true,
                chatId: jid,
                type: type,
                ack: 1
            }
        });

        await updateCompanyStatus(jid, 'Contatado');

        io.emit('whatsapp_message', {
            id: messageId,
            body: mediaUrl,
            from: jid,
            senderName: 'Me',
            timestamp: Date.now() / 1000,
            fromMe: true,
            type: type,
            ack: 1,
            sessionId: targetSessionId,
            chatId: jid
        });

        if (targetSessionId !== 'GLOBAL') {
            await prisma.userChat.upsert({
                where: {
                    userId_chatId: {
                        userId: targetSessionId,
                        chatId: jid
                    }
                },
                update: {},
                create: {
                    userId: targetSessionId,
                    chatId: jid
                }
            });
        }

    } catch (error) {
        console.error("Error sending media:", error);
        throw error;
    }
}

export const logoutWhatsApp = async (sessionId: string = 'GLOBAL') => {
    const sock = sessions.get(sessionId);
    if (sock) {
        try {
            await sock.logout(); // Will trigger connection.update -> close
        } catch (e) {
            console.error(`Logout failed for ${sessionId}`, e);
        }
    }

    // Force cleanup just in case
    const authFolder = path.resolve(__dirname, `../../baileys_auth_info/${sessionId}`);
    if (fs.existsSync(authFolder)) {
        try {
            fs.rmSync(authFolder, { recursive: true, force: true });
        } catch (e) {
            console.error(`Failed to delete auth folder for ${sessionId}`, e);
        }
    }
    sessions.delete(sessionId);

    if (sessionId === 'GLOBAL') {
        globalStatus = 'DISCONNECTED';
        globalQr = null;
    }
}

// Add a helper to get status
export const getWhatsAppStatus = (userId?: string) => {
    if (userId) {
        const sock = sessions.get(userId);
        return sock?.user ? 'CONNECTED' : 'DISCONNECTED';
    }
    const sock = sessions.get('GLOBAL');
    return sock?.user ? 'CONNECTED' : globalStatus;
};

export const getProfilePicUrl = async (jid: string, userId?: string) => {
    const sock = userId ? sessions.get(userId) : sessions.get('GLOBAL');
    if (!sock) return null;
    try {
        // Correct JID format
        const cleanJid = jid.replace('@c.us', '').replace('@s.whatsapp.net', '');
        const formattedJid = cleanJid.includes('@') ? cleanJid : `${cleanJid}@s.whatsapp.net`;

        // Console log for debugging
        // console.log(`Fetching profile pic for ${formattedJid} using session ${userId || 'GLOBAL'}`);

        const url = await sock.profilePictureUrl(formattedJid, 'image');
        return url;
    } catch (error) {
        // Console error for debugging
        // console.error(`Failed to fetch profile pic for ${jid}:`, error);
        return null; // Return null if no photo or error
    }
};

export const getWhatsAppQR = () => globalQr;

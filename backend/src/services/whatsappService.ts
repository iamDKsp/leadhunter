import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    WAMessage,
    jidNormalizedUser,
    proto
} from '@whiskeysockets/baileys';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import qrcode from 'qrcode';
import fs from 'fs';
import pino from 'pino';
import path from 'path';

const prisma = new PrismaClient();

// Map userId -> Socket. 'GLOBAL' is the default one.
const sessions = new Map<string, any>();
let io: Server;

const logger = pino({ level: 'silent' }); // Set to 'debug' for debugging

// Helper to find company by phone
const findCompanyByPhone = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const companies = await prisma.company.findMany({
        select: { id: true, phone: true }
    });

    const company = companies.find(c => {
        if (!c.phone) return false;
        const p = c.phone.replace(/\D/g, '');
        return p.includes(cleanPhone) || cleanPhone.includes(p);
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
                io.emit('whatsapp_qr', { qr: dataUrl, sessionId });
                io.emit('whatsapp_status', { status: 'DISCONNECTED', qr: dataUrl, sessionId });
            } catch (err) {
                console.error('Error generating QR', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Connection closed for ${sessionId} due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

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
        const from = msg.key.remoteJid!;
        const fromMe = msg.key.fromMe || false;
        // const sender =  msg.key.participant || msg.key.remoteJid;
        const pushName = msg.pushName || 'Unknown';

        // Extract body
        let body = '';
        let type = 'text';

        const messageContent = msg.message!;

        if (messageContent.conversation) {
            body = messageContent.conversation;
        } else if (messageContent.extendedTextMessage) {
            body = messageContent.extendedTextMessage.text || '';
        } else if (messageContent.imageMessage) {
            body = messageContent.imageMessage.caption || '[Image]';
            type = 'image';
        } else if (messageContent.videoMessage) {
            body = messageContent.videoMessage.caption || '[Video]';
            type = 'video';
        } else if (messageContent.audioMessage) {
            body = '[Audio]';
            type = 'audio';
            if (messageContent.audioMessage.ptt) type = 'ptt';
        } else if (messageContent.documentMessage) {
            body = messageContent.documentMessage.fileName || '[Document]';
            type = 'document';
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

    } catch (e) {
        console.error(`Error handling message for ${sessionId}`, e);
    }
}

// Start Global Session
export const initWhatsApp = (socketIo: Server) => {
    io = socketIo;
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

        let msgPayload: any = {};

        if (type === 'ptt' || type === 'audio') {
            msgPayload = { audio: buffer, mimetype: mimetype, ptt: type === 'ptt' };
        } else if (type === 'image') {
            msgPayload = { image: buffer, caption: '' };
        } else {
            msgPayload = { document: buffer, mimetype: mimetype };
        }

        const sentMsg = await sock.sendMessage(jid, msgPayload);

        // Save to DB
        await prisma.message.create({
            data: {
                id: sentMsg?.key.id!,
                body: '[Media]',
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
            id: sentMsg?.key.id!,
            body: '[Media]',
            from: jid,
            senderName: 'Me',
            timestamp: Date.now() / 1000,
            fromMe: true,
            type: type,
            ack: 1,
            sessionId: targetSessionId,
            chatId: jid
        });

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
            // Handling is done in connection.update listener
        } catch (e) {
            console.error(`Logout failed for ${sessionId}`, e);
        }
    }
}

export const getProfilePicUrl = async (phone: string, userId: string = 'GLOBAL') => {
    // Baileys profile pic fetch
    let targetSessionId = userId;
    if (!sessions.has(targetSessionId)) {
        targetSessionId = 'GLOBAL';
    }
    const sock = sessions.get(targetSessionId);
    if (!sock) return undefined;

    try {
        let jid = phone.replace(/\D/g, '');
        if (jid.length <= 11 && !jid.startsWith('55')) {
            jid = '55' + jid;
        }
        jid = `${jid}@s.whatsapp.net`;

        const url = await sock.profilePictureUrl(jid, 'image');
        return url;
    } catch (error) {
        return undefined;
    }
};

import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import { Server } from 'socket.io';
import qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Singleton instance
let client: Client;
let io: Server;

export const initWhatsApp = (socketIo: Server) => {
    io = socketIo;

    console.log("Initializing WhatsApp Client...");

    // Emit current status to new connections
    io.on('connection', (socket) => {
        console.log('New client connected to WebSocket', socket.id);

        // If client is already ready/authenticated, send that status immediately
        if (client && client.info) {
            socket.emit('whatsapp_status', { status: 'CONNECTED' });
        } else {
            // If we have a QR, send it (we'd need to store the last QR somewhere, but for now just send status)
            // Ideally we cache the last QR code in a variable or re-trigger generation if possible
            // For simplify, we just say DISCONNECTED and let the next QR event handle it,
            // or if we stored 'lastQr', we would send it.
            socket.emit('whatsapp_status', { status: 'DISCONNECTED' });
        }
    });

    // Use LocalAuth to persist the session (so we don't scan QR every time)
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true, // Set to false if you want to see the browser for debugging
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', async (qr) => {
        console.log('QR Code received from WhatsApp');
        try {
            // Convert to data URL for easy display in frontend
            const dataUrl = await qrcode.toDataURL(qr);
            io.emit('whatsapp_qr', dataUrl);
            io.emit('whatsapp_status', { status: 'DISCONNECTED', qr: dataUrl });
        } catch (err) {
            console.error('Error generating QR', err);
        }
    });

    client.on('ready', () => {
        console.log('WhatsApp Client is ready!');
        io.emit('whatsapp_status', { status: 'CONNECTED' });
    });

    client.on('authenticated', () => {
        console.log('WhatsApp Client authenticated!');
        io.emit('whatsapp_status', { status: 'AUTHENTICATED' });
    });

    client.on('auth_failure', (msg) => {
        console.error('WhatsApp Auth failure', msg);
        io.emit('whatsapp_status', { status: 'AUTH_FAILURE' });
    });

    client.on('message', async (msg) => {
        console.log('MESSAGE RECEIVED', msg.body);
        try {
            // We can expand this to include more info
            const contact = await msg.getContact();

            // Save to DB
            const chatId = msg.from; // e.g. 551499999999@c.us
            await prisma.message.create({
                data: {
                    id: msg.id.id,
                    body: msg.hasMedia ? (msg.body || '[Media]') : msg.body,
                    from: msg.from,
                    to: msg.to,
                    senderName: contact.pushname || contact.name || contact.number,
                    timestamp: msg.timestamp,
                    fromMe: msg.fromMe,
                    chatId: chatId,
                    type: msg.type, // e.g. ptt, image
                    // mediaData: ... // To implement media saving, we need to download it
                }
            });

            io.emit('whatsapp_message', {
                id: msg.id.id,
                body: msg.hasMedia ? (msg.body || '[Media]') : msg.body,
                from: msg.from,
                senderName: contact.pushname || contact.name || contact.number,
                timestamp: msg.timestamp,
                fromMe: msg.fromMe,
                type: msg.type
            });
        } catch (e) {
            console.error("Error processing message", e);
        }
    });

    // Listen for ACK updates (Read Receipts)
    client.on('message_ack', async (msg, ack) => {
        // ack: 1=sent, 2=delivered, 3=read
        try {
            // Update DB
            // We need to find the message by ID. 
            // Prisma update
            await prisma.message.updateMany({
                where: { id: msg.id.id },
                data: { ack: ack }
            });

            io.emit('whatsapp_ack', { msgId: msg.id.id, ack });
        } catch (e) {
            // console.error("Error handling ACK", e);
        }
    });

    client.on('disconnected', (reason) => {
        console.log('Client was logged out', reason);
        io.emit('whatsapp_status', { status: 'DISCONNECTED' });
    });

    try {
        client.initialize().catch(err => {
            console.error("Failed to initialize WhatsApp Client (Async):", err);
            io.emit('whatsapp_status', { status: 'ERROR' });
        });
    } catch (err) {
        console.error("Failed to initialize WhatsApp Client (Sync):", err);
    }
}

export const getClient = () => client;

export const sendMessage = async (to: string, message: string) => {
    if (!client) throw new Error("Client not initialized");
    if (!client.info) throw new Error("Client not ready (QR not scanned or connecting)");

    try {
        // 'to' needs to be formatted as '123456789@c.us'
        let chatId = to.replace(/\D/g, '');
        if (chatId.length <= 11 && !chatId.startsWith('55')) {
            chatId = '55' + chatId;
        }
        chatId = `${chatId}@c.us`;

        const sentMsg = await client.sendMessage(chatId, message);
        console.log(`Message sent to ${chatId}`);

        // Save to DB
        await prisma.message.create({
            data: {
                id: sentMsg.id.id,
                body: message,
                from: sentMsg.from,
                to: sentMsg.to,
                senderName: 'Me',
                timestamp: sentMsg.timestamp,
                fromMe: true,
                chatId: chatId,
                ack: 1
            }
        });

        io.emit('whatsapp_message', {
            id: sentMsg.id.id,
            body: message,
            from: sentMsg.from,
            to: sentMsg.to,
            senderName: 'Me',
            timestamp: sentMsg.timestamp,
            fromMe: true,
            ack: 1
        });
    } catch (error) {
        console.error("Error in sendMessage service:", error);
        throw error;
    }
}

export const sendMedia = async (to: string, base64: string, type: 'ptt' | 'image') => {
    if (!client) throw new Error("Client not initialized");

    try {
        let chatId = to.replace(/\D/g, '');
        if (chatId.length <= 11 && !chatId.startsWith('55')) {
            chatId = '55' + chatId;
        }
        chatId = `${chatId}@c.us`;

        // Create MessageMedia
        // Base64 usually comes as "data:audio/webm;base64,....."
        // We need to strip the prefix
        const b64data = base64.split(',')[1];
        const mimetype = base64.split(';')[0].split(':')[1];

        const media = new MessageMedia(mimetype, b64data);

        const sentMsg = await client.sendMessage(chatId, media, {
            sendAudioAsVoice: type === 'ptt'
        });

        // Save to DB (Store Base64? It's huge. Ideally store to file. For now store as body)
        // NOTE: Saving large base64 strings to SQLite/DB is bad practice but requested as "quick fix".
        // Better: Upload to bucket/local storage and save URL.

        await prisma.message.create({
            data: {
                id: sentMsg.id.id,
                body: base64, // Storing audio data in body for now to play it back
                from: sentMsg.from,
                to: sentMsg.to,
                senderName: 'Me',
                timestamp: sentMsg.timestamp,
                fromMe: true,
                chatId: chatId,
                type: type,
                ack: 1
            }
        });

        io.emit('whatsapp_message', {
            id: sentMsg.id.id,
            body: base64, // Frontend needs it to play
            from: sentMsg.from,
            to: sentMsg.to,
            senderName: 'Me',
            timestamp: sentMsg.timestamp,
            fromMe: true,
            type: type,
            ack: 1
        });

    } catch (error) {
        console.error("Error sending media:", error);
        throw error;
    }
}

export const logoutWhatsApp = async () => {
    if (client) {
        try {
            await client.logout();
        } catch (e) {
            console.error("Logout failed", e);
        }
        try {
            await client.destroy();
        } catch (e) { }
        initWhatsApp(io);
    }
}

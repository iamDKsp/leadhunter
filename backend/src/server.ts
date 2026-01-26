import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initWhatsApp, sendMessage, logoutWhatsApp } from './services/whatsappService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/whatsapp/logout', async (req, res) => {
    try {
        await logoutWhatsApp();
        res.json({ success: true });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// WhatsApp API Routes (Simple impl for now)
app.post('/whatsapp/send', async (req, res) => {
    try {
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({ error: 'Missing "to" or "message"' });
        }
        await sendMessage(to, message);
        res.json({ success: true });
    } catch (error) {
        console.error("Error sending whatsapp message:", error);
        res.status(500).json({
            error: 'Failed to send message',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

app.post('/whatsapp/send-media', async (req, res) => {
    try {
        // Import dynamically to avoid circular deps if needed, or better, move to controller
        const { sendMedia } = await import('./services/whatsappService');
        const { to, media, type } = req.body;
        if (!to || !media) {
            return res.status(400).json({ error: 'Missing parameters' });
        }
        await sendMedia(to, media, type || 'ptt');
        res.json({ success: true });
    } catch (error) {
        console.error("Error sending media:", error);
        res.status(500).json({ error: 'Failed to send media' });
    }
});

import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';
import folderRoutes from './routes/folderRoutes';
import messageRoutes from './routes/messageRoutes';
import costRoutes from './routes/costRoutes';

app.use('/auth', authRoutes);
app.use('/companies', companyRoutes);
app.use('/folders', folderRoutes);
app.use('/messages', messageRoutes);
app.use('/costs', costRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Find a better way to restrict this in production
        methods: ["GET", "POST"]
    }
});

// Initialize WhatsApp Service
// We delay it slightly or just run it. It runs async.
initWhatsApp(io);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import compression from 'compression';
import { initWhatsApp, sendMessage, sendMedia, logoutWhatsApp, restoreSessions } from './services/whatsappService';
import { authenticateToken } from './middleware/auth';

import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';
import folderRoutes from './routes/folderRoutes';
import messageRoutes from './routes/messageRoutes';
import costRoutes from './routes/costRoutes';
import accessGroupRoutes from './routes/accessGroupRoutes';
import leadAssignmentRoutes from './routes/leadAssignmentRoutes';
import personalRoutes from './routes/personalRoutes';
import monitoringRoutes from './routes/monitoringRoutes';
import stagesRoutes from './routes/stageRoutes';
import chatRoutes from './routes/chatRoutes';
import whatsappRoutes from './routes/whatsappRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin) return callback(null, true);

        // Allowed arrays
        if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Allowed regex (vercel subdomains)
        if (/\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '50mb' }));

// Debug middleware to log ALL 403/401 responses
app.use((req, res, next) => {
    const originalStatus = res.status;
    res.status = function (code) {
        if (code === 401 || code === 403) {
            console.log(`[DENIED] ${req.method} ${req.url} - Status: ${code}`);
        }
        return originalStatus.apply(this, arguments as any);
    };
    next();
});

app.use('/media', express.static('public/media'));
app.use('/uploads', express.static('public/uploads'));

app.get('/', (req, res) => {
    console.log("Health check ping");
    res.send('Lead Hunter API is running 🚀');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WhatsApp API Routes — protected by auth
app.post('/whatsapp/logout', authenticateToken, async (req, res) => {
    try {
        await logoutWhatsApp();
        res.json({ success: true });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

app.post('/whatsapp/send', authenticateToken, async (req, res) => {
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

app.post('/whatsapp/send-media', authenticateToken, async (req, res) => {
    try {
        const { to, media, type } = req.body;
        if (!to || !media) {
            return res.status(400).json({ error: 'Missing parameters' });
        }
        await sendMedia(to, media, type || 'ptt');
        res.json({ success: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error sending media:", errorMessage);
        res.status(500).json({ error: 'Failed to send media', details: errorMessage });
    }
});

// Routes

app.use('/auth', authRoutes);
app.use('/companies', companyRoutes);
app.use('/folders', folderRoutes);
app.use('/messages', messageRoutes);
app.use('/costs', costRoutes);
app.use('/access-groups', accessGroupRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/leads', leadAssignmentRoutes);
app.use('/personal', personalRoutes);
app.use('/monitoring', monitoringRoutes);
app.use('/stages', stagesRoutes);
app.use('/chat', chatRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: corsOptions.origin as any,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Initialize WhatsApp Service
initWhatsApp(io);
restoreSessions();

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

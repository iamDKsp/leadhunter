import { Request, Response } from 'express';
import { initWhatsApp, logoutWhatsApp, getWhatsAppStatus, getWhatsAppQR, connectUserSession } from '../services/whatsappService';
import { getUserPermissions } from '../middleware/authorization';

export const connectWhatsApp = async (req: Request, res: Response) => {
    try {
        const { type } = req.body; // 'global' or 'personal'
        const userId = (req as any).user?.userId;
        console.log(`[CONNECT] User ${userId} attempting ${type} connection`);

        const perms = await getUserPermissions(userId);
        console.log(`[CONNECT] Permissions for ${userId}:`, perms ? 'Found' : 'Not Found');

        if (type === 'global') {
            if (!perms?.canManageConnections) {
                console.log(`[CONNECT] Global access denied for ${userId}`);
                return res.status(403).json({ error: 'Permission denied for global connections' });
            }
            initWhatsApp(); // Triggers client initialization
            res.json({ success: true, message: 'WhatsApp initialization started' });
        } else if (type === 'personal') {
            if (!perms?.canUseOwnWhatsApp) {
                console.log(`[CONNECT] Personal access denied for ${userId}`);
                return res.status(403).json({ error: 'Permission denied for personal connections' });
            }
            console.log(`[CONNECT] Personal access granted for ${userId}. Starting session...`);
            await connectUserSession(userId);
            res.json({ success: true, message: 'Personal WhatsApp initialization started' });
        } else {
            console.log(`[CONNECT] Invalid type: ${type}`);
            res.status(400).json({ error: 'Invalid type' });
        }
    } catch (error) {
        console.error('Error connecting WhatsApp:', error);
        res.status(500).json({ error: 'Failed to connect WhatsApp' });
    }
};

export const disconnectWhatsApp = async (req: Request, res: Response) => {
    try {
        const { type } = req.body;
        const userId = (req as any).user.userId;
        const perms = await getUserPermissions(userId);

        if (type === 'global') {
            if (!perms?.canManageConnections) {
                return res.status(403).json({ error: 'Permission denied for global connections' });
            }
            await logoutWhatsApp();
            res.json({ success: true, message: 'WhatsApp disconnected' });
        } else if (type === 'personal') {
            if (!perms?.canUseOwnWhatsApp) {
                return res.status(403).json({ error: 'Permission denied for personal connections' });
            }
            await logoutWhatsApp(userId);
            res.json({ success: true, message: 'Personal WhatsApp disconnected' });
        } else {
            res.status(400).json({ error: 'Invalid type' });
        }
    } catch (error) {
        console.error('Error disconnecting WhatsApp:', error);
        res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
    }
};

export const getStatus = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        const userId = (req as any).user.userId;

        if (type === 'global') {
            const status = getWhatsAppStatus();
            const qr = getWhatsAppQR();
            res.json({ status, qr });
        } else if (type === 'personal') {
            const status = getWhatsAppStatus(userId);
            // The QR code for a specific user session is not currently exposed globally
            // It uses the same globalQr variable in whatsappService when emitting, but `getWhatsAppQR` returns `globalQr`, which is a single global variable.
            // For now, we rely on the socket event `whatsapp_qr` with `sessionId` to deliver the QR to the user
            res.json({ status, qr: null });
        } else {
            res.status(400).json({ error: 'Invalid type' });
        }
    } catch (error) {
        console.error('Error getting WhatsApp status:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
};

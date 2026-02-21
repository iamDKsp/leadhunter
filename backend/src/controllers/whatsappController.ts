import { Request, Response } from 'express';
import { initWhatsApp, logoutWhatsApp, getWhatsAppStatus, getWhatsAppQR } from '../services/whatsappService';

export const connectWhatsApp = async (req: Request, res: Response) => {
    try {
        const { type } = req.body; // 'global' or 'personal'
        // For now, we only support global or existing single instance logic
        // If 'personal' is requested, we might need new logic, but let's map 'global' to the existing service first.

        if (type === 'global') {
            initWhatsApp(); // Triggers client initialization
            res.json({ success: true, message: 'WhatsApp initialization started' });
        } else {
            res.status(501).json({ error: 'Personal WhatsApp not implemented yet' });
        }
    } catch (error) {
        console.error('Error connecting WhatsApp:', error);
        res.status(500).json({ error: 'Failed to connect WhatsApp' });
    }
};

export const disconnectWhatsApp = async (req: Request, res: Response) => {
    try {
        const { type } = req.body;
        if (type === 'global') {
            await logoutWhatsApp();
            res.json({ success: true, message: 'WhatsApp disconnected' });
        } else {
            res.status(501).json({ error: 'Personal WhatsApp not implemented yet' });
        }
    } catch (error) {
        console.error('Error disconnecting WhatsApp:', error);
        res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
    }
};

export const getStatus = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        if (type === 'global') {
            const status = getWhatsAppStatus();
            const qr = getWhatsAppQR();
            res.json({ status, qr });
        } else {
            // Mock personal status for now so UI doesn't crash if requested
            res.json({ status: 'DISCONNECTED', qr: null });
        }
    } catch (error) {
        console.error('Error getting WhatsApp status:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
};

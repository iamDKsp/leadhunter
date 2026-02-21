import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { playNotificationSound } from '@/hooks/useSounds';
import { IncomingNotification } from '@/components/chat/IncomingMessageNotification';

interface WhatsAppMessage {
    id: string;
    body: string;
    from: string;
    to: string;
    senderName: string;
    timestamp: number;
    fromMe: boolean;
    type?: 'chat' | 'ptt' | 'image' | 'video';
    chatId?: string;
    ack?: number;
}

interface WhatsAppContextType {
    socket: Socket | null;
    status: string;
    qrCode: string | null;
    isConnected: boolean;
    messages: WhatsAppMessage[];
    pendingNotifications: IncomingNotification[];
    dismissNotification: (id: string) => void;
    dismissAllNotifications: () => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const useWhatsApp = () => {
    const context = useContext(WhatsAppContext);
    if (!context) {
        throw new Error('useWhatsApp must be used within a WhatsAppProvider');
    }
    return context;
};

const BACKEND_URL = 'http://localhost:3000';

export const WhatsAppProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [status, setStatus] = useState<string>('DISCONNECTED');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [pendingNotifications, setPendingNotifications] = useState<IncomingNotification[]>([]);

    const dismissNotification = useCallback((id: string) => {
        setPendingNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const dismissAllNotifications = useCallback(() => {
        setPendingNotifications([]);
    }, []);

    useEffect(() => {
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log("Global Socket Connected");
        });

        newSocket.on('whatsapp_status', (data) => {
            setStatus(data.status);
            if (data.qr) setQrCode(data.qr);
        });

        newSocket.on('whatsapp_qr', (data) => {
            if (data && data.qr) {
                setQrCode(data.qr);
                setStatus('QR_RECEIVED');
            }
        });

        newSocket.on('whatsapp_message', (msg: WhatsAppMessage) => {
            // Only create notification if it's NOT from me
            if (!msg.fromMe) {
                const notification: IncomingNotification = {
                    id: msg.id || `notif-${Date.now()}`,
                    senderName: msg.senderName || msg.from,
                    body: msg.body || '',
                    chatId: msg.chatId || msg.from,
                    timestamp: msg.timestamp || Date.now() / 1000,
                    type: msg.type,
                };

                setPendingNotifications(prev => {
                    // Prevent duplicates
                    if (prev.find(n => n.id === notification.id)) return prev;
                    // Limit to 10 max to prevent memory issues
                    const updated = [...prev, notification];
                    return updated.slice(-10);
                });

                playNotificationSound();
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const isConnected = status === 'CONNECTED' || status === 'AUTHENTICATED' || status === 'READY';

    return (
        <WhatsAppContext.Provider value={{
            socket,
            status,
            qrCode,
            isConnected,
            messages,
            pendingNotifications,
            dismissNotification,
            dismissAllNotifications,
        }}>
            {children}
        </WhatsAppContext.Provider>
    );
};

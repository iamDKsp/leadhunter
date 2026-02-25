import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
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
    targetSessionId: string;
    setTargetSessionId: (id: string) => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const useWhatsApp = () => {
    const context = useContext(WhatsAppContext);
    if (!context) {
        throw new Error('useWhatsApp must be used within a WhatsAppProvider');
    }
    return context;
};

// Use VITE_WS_URL if defined, otherwise empty string for production relative path, fallback to localhost for dev
const BACKEND_URL = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

export const WhatsAppProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [status, setStatus] = useState<string>('DISCONNECTED');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [pendingNotifications, setPendingNotifications] = useState<IncomingNotification[]>([]);
    const [targetSessionId, setTargetSessionId] = useState<string>('GLOBAL');
    const targetSessionIdRef = useRef<string>('GLOBAL');

    // Keep ref in sync
    useEffect(() => {
        targetSessionIdRef.current = targetSessionId;
    }, [targetSessionId]);

    const dismissNotification = useCallback((id: string) => {
        setPendingNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const dismissAllNotifications = useCallback(() => {
        setPendingNotifications([]);
    }, []);

    useEffect(() => {
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);

        // Determine initial targetSessionId from stored user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.useOwnWhatsApp) {
                    setTargetSessionId(user.id); // Assuming user.id is the session ID for personal mode
                } else {
                    setTargetSessionId('GLOBAL');
                }
            } catch (e) {
                console.error("Failed to parse user from localStorage:", e);
                setTargetSessionId('GLOBAL'); // Fallback
            }
        } else {
            setTargetSessionId('GLOBAL'); // Default if no user stored
        }

        // Old token decoding logic (kept for potential future use, but targetSessionId is now set above)
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = token.split('.')[1];
                const decoded = JSON.parse(atob(payload));
                const userId = decoded.userId;
                console.log('App Context: User ID from token:', userId);
            } catch (e) {
                console.error("Failed to decode token:", e);
            }
        }

        newSocket.on('connect', () => {
            console.log("Socket Connected. Target Session:", targetSessionIdRef.current); // Updated to use ref
        });

        newSocket.on('whatsapp_status', (data) => {
            if (data.sessionId && data.sessionId !== targetSessionIdRef.current) return; // Updated to use ref
            setStatus(data.status);
            if (data.qr) setQrCode(data.qr);
        });

        newSocket.on('whatsapp_qr', (data) => {
            if (data.sessionId && data.sessionId !== targetSessionIdRef.current) return; // Updated to use ref
            if (data && data.qr) {
                setQrCode(data.qr);
                setStatus('QR_RECEIVED');
            }
        });

        // New listener for general messages to update the messages state
        newSocket.on('whatsapp_message_received', (data: { sessionId?: string, message: WhatsAppMessage }) => {
            if (data.sessionId && data.sessionId !== targetSessionIdRef.current) return; // Updated to use ref
            setMessages(prev => [data.message, ...prev.slice(0, 49)]);
        });

        // Existing listener for notifications
        newSocket.on('whatsapp_message', (msg: WhatsAppMessage & { sessionId?: string }) => {
            if (msg.sessionId && msg.sessionId !== targetSessionIdRef.current) return; // Updated to use ref
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
            targetSessionId,
            setTargetSessionId,
        }}>
            {children}
        </WhatsAppContext.Provider>
    );
};

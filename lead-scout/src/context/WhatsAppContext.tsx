import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface WhatsAppMessage {
    id: string;
    body: string;
    from: string;
    to: string;
    senderName: string;
    timestamp: number;
    fromMe: boolean;
    type?: 'chat' | 'ptt' | 'image' | 'video';
    ack?: number;
}

interface WhatsAppContextType {
    socket: Socket | null;
    status: string;
    qrCode: string | null;
    isConnected: boolean;
    messages: WhatsAppMessage[]; // Global message cache (optional, but good for optimizing)
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
            setQrCode(data);
            setStatus('QR_RECEIVED');
        });

        newSocket.on('whatsapp_message', (msg: WhatsAppMessage) => {
            // Update global messages list (though we might not want to store ALL messages here if it gets huge)
            // For now, let's keep it simple or just use it for notifications.

            // Notification logic:
            // Only notify if it's NOT from me
            if (!msg.fromMe) {
                // If there's audio, say "Audio message", else show body
                const content = msg.type === 'ptt' ? '🎤 Áudio recebido'
                    : msg.type === 'image' ? '📷 Imagem recebida'
                        : msg.body;

                toast(msg.senderName || msg.from, {
                    description: content,
                    action: {
                        label: 'Ver',
                        onClick: () => {
                            // Logic to open drawer could be complex here without prop drilling layout state.
                            // For now, simple notification.
                            // Ideally, we'd trigger a global state to open the drawer.
                        }
                    },
                    position: 'top-right'
                });
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const isConnected = status === 'CONNECTED' || status === 'AUTHENTICATED' || status === 'READY';

    return (
        <WhatsAppContext.Provider value={{ socket, status, qrCode, isConnected, messages }}>
            {children}
        </WhatsAppContext.Provider>
    );
};

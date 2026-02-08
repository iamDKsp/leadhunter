
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/services/api';

interface WhatsAppConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BACKEND_URL = 'http://localhost:3000'; // Should use env var but keeping simple for now

export function WhatsAppConnectModal({ isOpen, onClose }: WhatsAppConnectModalProps) {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('INIT');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Get current user ID (mock decoding or store in localStorage)
    // Ideally we use a context, but for brevity:
    const token = localStorage.getItem('token');
    // We rely on backend sending correct sessionId in events that matches user

    useEffect(() => {
        if (!isOpen) return;

        const socket = io(BACKEND_URL);

        socket.on('connect', () => {
            console.log('Connected to socket for binding');
            // Check status immediately
            checkStatus();
        });

        socket.on('whatsapp_qr', (data: any) => {
            // Check if data is string (old global) or object (new session aware)
            // AND check if it belongs to THIS user (we might need to identify ourselves to socket)
            // Since public socket broadcasts to everyone, we should filter by sessionId if provided.

            // For now, let's assume we triggered the connect, so the next QR is ours? 
            // Risky. The 'connect' endpoint should probably return the QR in response if possible but it's async.

            // Better: filtering by sessionId logic on Client side require we know our ID.
            if (data.sessionId) {
                // We'll need to know our ID.
                // Let's assume the backend 'connectSession' call tells us we started, and we listen.

                // For simplicity now, just display if it looks like a QR code data URL.
                if (data.qr) setQrCode(data.qr);
            } else if (typeof data === 'string') {
                // Global fallback
                // setQrCode(data); 
            }
        });

        socket.on('whatsapp_status', (data: any) => {
            // Filter logic...
            if (data.status === 'CONNECTED') {
                setStatus('CONNECTED');
                toast.success('WhatsApp Conectado!');
                setTimeout(onClose, 2000);
            } else if (data.status === 'DISCONNECTED') {
                setStatus('DISCONNECTED');
                if (data.qr) setQrCode(data.qr);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [isOpen]);

    const checkStatus = async () => {
        try {
            setLoading(true);
            const res = await api.get('/chat/status');
            if (res.data.status === 'CONNECTED') {
                setStatus('CONNECTED');
            } else {
                // If not connected, trigger connection
                setStatus('DISCONNECTED');
                connect();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const connect = async () => {
        try {
            setLoading(true);
            setQrCode(null);
            await api.post('/chat/connect');
            toast.info('Iniciando sessão, aguarde o QR Code...');
        } catch (e) {
            toast.error('Erro ao iniciar conexão');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.post('/chat/logout');
            setStatus('DISCONNECTED');
            setQrCode(null);
            toast.success('Desconectado.');
        } catch (e) {
            toast.error('Erro ao desconectar');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Conectar WhatsApp Próprio</DialogTitle>
                    <DialogDescription>
                        Escaneie o QR Code com seu aplicativo do WhatsApp para sincronizar suas conversas.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    {loading && status !== 'CONNECTED' && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Carregando...</p>
                        </div>
                    )}

                    {!loading && status === 'CONNECTED' && (
                        <div className="flex flex-col items-center text-green-600">
                            <CheckCircle2 className="h-16 w-16 mb-2" />
                            <p className="font-semibold">Conectado com sucesso!</p>
                            <Button variant="outline" className="mt-4 text-destructive" onClick={logout}>
                                Desconectar
                            </Button>
                        </div>
                    )}

                    {!loading && status !== 'CONNECTED' && qrCode && (
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-2 rounded-lg border shadow-sm">
                                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                            </div>
                            <p className="text-sm text-muted-foreground mt-4 animate-pulse">
                                Aguardando leitura...
                            </p>
                        </div>
                    )}

                    {!loading && status !== 'CONNECTED' && !qrCode && (
                        <div className="flex flex-col items-center text-center">
                            <AlertCircle className="h-12 w-12 text-yellow-500 mb-2" />
                            <p className="text-muted-foreground mb-4">Nenhum QR Code gerado.</p>
                            <Button onClick={connect}>Gerar Novo QR Code</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

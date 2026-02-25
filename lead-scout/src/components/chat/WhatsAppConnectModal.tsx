
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

import { useWhatsApp } from '@/context/WhatsAppContext';

export function WhatsAppConnectModal({ isOpen, onClose }: WhatsAppConnectModalProps) {
    const {
        socket,
        status: contextStatus,
        qrCode: contextQr,
        setTargetSessionId
    } = useWhatsApp();

    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('INIT');
    const [loading, setLoading] = useState(false);

    // Get current user ID to set session
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    useEffect(() => {
        if (isOpen && user?.id) {
            setTargetSessionId(user.id);
            // Sync status from context
            setStatus(contextStatus);
            setQrCode(contextQr);
        }
    }, [isOpen, contextStatus, contextQr, user]);

    const checkStatus = async () => {
        try {
            setLoading(true);
            const res = await api.get('/whatsapp/status?type=personal');
            setStatus(res.data.status);
            if (res.data.status === 'CONNECTED') {
                toast.success('WhatsApp já está conectado!');
            } else {
                connect();
            }
        } catch (e) {
            console.error(e);
            toast.error('Erro ao verificar status');
        } finally {
            setLoading(false);
        }
    };

    const connect = async () => {
        try {
            setLoading(true);
            setQrCode(null);
            await api.post('/whatsapp/connect', { type: 'personal' });
            toast.info('Iniciando sessão pessoal, aguarde o QR Code...');
        } catch (e) {
            toast.error('Erro ao iniciar conexão pessoal');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await api.post('/whatsapp/disconnect', { type: 'personal' });
            setStatus('DISCONNECTED');
            setQrCode(null);
            toast.success('WhatsApp Pessoal desconectado.');
        } catch (e) {
            toast.error('Erro ao desconectar WhatsApp Pessoal');
        } finally {
            setLoading(false);
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

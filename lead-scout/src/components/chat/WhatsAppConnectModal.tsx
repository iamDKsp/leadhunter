
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CyberRadarLoader } from '@/components/ui/CyberRadarLoader';
import api from '@/services/api';

interface WhatsAppConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    connectionType?: 'global' | 'personal';
}

import { useWhatsApp } from '@/context/WhatsAppContext';

export function WhatsAppConnectModal({ isOpen, onClose, connectionType = 'personal' }: WhatsAppConnectModalProps) {
    const {
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

    const isGlobal = connectionType === 'global';

    useEffect(() => {
        if (isOpen) {
            const target = isGlobal ? 'GLOBAL' : (user?.id || 'GLOBAL');
            setTargetSessionId(target);
            // Sync status from context
            setStatus(contextStatus);
            setQrCode(contextQr);
            // Fetch fresh status on open
            checkStatus();
        }
    }, [isOpen, connectionType]);

    // Also sync if context updates while modal is open
    useEffect(() => {
        if (isOpen) {
            setStatus(contextStatus);
            if (contextQr) setQrCode(contextQr);
        }
    }, [contextStatus, contextQr, isOpen]);

    const checkStatus = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/whatsapp/status?type=${connectionType}`);
            setStatus(res.data.status);
            if (res.data.qr) {
                setQrCode(res.data.qr);
            }
            if (res.data.status === 'CONNECTED') {
                toast.success('WhatsApp já está conectado!');
            } else if (res.data.status === 'DISCONNECTED') {
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
            const res = await api.post('/whatsapp/connect', { type: connectionType });
            if (res.data?.qr) {
                setQrCode(res.data.qr);
            }
            toast.info(`Iniciando sessão ${isGlobal ? 'global' : 'pessoal'}, aguarde o QR Code...`);
        } catch (e) {
            toast.error(`Erro ao iniciar conexão ${isGlobal ? 'global' : 'pessoal'}`);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await api.post('/whatsapp/disconnect', { type: connectionType });
            setStatus('DISCONNECTED');
            setQrCode(null);
            toast.success(`WhatsApp ${isGlobal ? 'Global' : 'Pessoal'} desconectado.`);
        } catch (e) {
            toast.error(`Erro ao desconectar WhatsApp ${isGlobal ? 'Global' : 'Pessoal'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isGlobal ? 'Conectar WhatsApp Global' : 'Conectar WhatsApp Próprio'}</DialogTitle>
                    <DialogDescription>
                        {isGlobal
                            ? 'Escaneie o QR Code com seu WhatsApp para conectar a linha principal da empresa.'
                            : 'Escaneie o QR Code com seu aplicativo do WhatsApp para sincronizar suas conversas pessoais.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    {loading && status !== 'CONNECTED' && !qrCode && (
                        <div className="flex flex-col items-center">
                            <CyberRadarLoader size="md" label="CONECTANDO..." />
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

                    {status !== 'CONNECTED' && qrCode && (
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-2 rounded-lg border shadow-sm">
                                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                            </div>
                            <p className="text-sm text-muted-foreground mt-4 animate-pulse">
                                Aguardando leitura...
                            </p>
                            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={connect}>
                                Atualizar QR Code
                            </Button>
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

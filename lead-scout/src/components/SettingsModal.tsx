import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useWhatsApp } from '@/context/WhatsAppContext';
import { User } from '@/types/auth'; // Import User type
import { whatsapp, auth } from '@/services/api'; // Import auth service
import { toast } from 'sonner';
import { Loader2, Smartphone, QrCode, Wifi, WifiOff, RefreshCw, Settings as SettingsIcon, User as UserIcon, Check, Upload } from 'lucide-react'; // Added Check and Upload icon
import { QRCodeSVG } from 'qrcode.react';

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
    user?: User;
}

export function SettingsModal({ open, onClose, user }: SettingsModalProps) {
    const { status: globalStatus, qrCode: globalQr, isConnected: globalConnected } = useWhatsApp();

    // Local state for personal WhatsApp (mocked for now or waiting for backend implementation)
    const [personalStatus, setPersonalStatus] = useState('DISCONNECTED');
    const [personalQr, setPersonalQr] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            whatsapp.getStatus('global'); // Force fetch status when modal opens
        }
    }, [open]);

    const canUseOwnWhatsApp = user?.permissions?.canUseOwnWhatsApp || user?.role === 'SUPER_ADMIN';
    const isUsingOwnWhatsApp = user?.useOwnWhatsApp || false;

    // Helper to translate status
    const translateStatus = (status: string) => {
        switch (status) {
            case 'CONNECTED': return 'Conectado';
            case 'AUTHENTICATED': return 'Autenticado';
            case 'QR_RECEIVED': return 'Aguardando Leitura do QR Code';
            case 'DISCONNECTED': return 'Desconectado';
            default: return status;
        }
    };

    const handleConnectGlobal = async () => {
        try {
            setIsLoading(true);
            await whatsapp.connect('global');
            toast.success('Solicitado conexão Global...');
        } catch (error) {
            toast.error('Erro ao conectar WhatsApp Global');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnectGlobal = async () => {
        try {
            setIsLoading(true);
            await whatsapp.disconnect('global');
            toast.success('Desconectado com sucesso');
        } catch (error) {
            toast.error('Erro ao desconectar');
        } finally {
            setIsLoading(false);
        }
    };

    // Placeholder functions for personal WhatsApp - waiting for backend support
    const handleConnectPersonal = async () => {
        toast.info('Funcionalidade de WhatsApp Pessoal em breve!');
    };

    const handleDisconnectPersonal = async () => {
        toast.info('Funcionalidade de WhatsApp Pessoal em breve!');
    };


    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-card border-border/30">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6 text-primary" />
                        Configurações do Sistema
                    </DialogTitle>
                    <DialogDescription>
                        Gerencie as conexões e preferências da plataforma.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Perfil</TabsTrigger>
                        <TabsTrigger value="whatsapp">Conexão WhatsApp</TabsTrigger>
                        <TabsTrigger value="preferences">Preferências</TabsTrigger>
                    </TabsList>

                    {/* PROFILE TAB */}
                    <TabsContent value="profile" className="space-y-6 py-4">
                        <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                            <h3 className="font-semibold text-lg mb-4">Seu Avatar</h3>
                            <div className="flex flex-wrap gap-4 justify-center sm:justify-start max-h-[300px] overflow-y-auto p-2">
                                {[
                                    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
                                    'Felix', 'Aneka', 'Zoe', 'Marc', 'Veronika', 'Milo', 'Cale', 'Buster',
                                    'Easton', 'Jerry', 'Walter', 'Bob', 'Jack', 'Avery', 'Mason', 'George'
                                ].map((i) => (
                                    <button
                                        key={i}
                                        onClick={async () => {
                                            if (!user?.id) return;
                                            try {
                                                await auth.updateProfile({ avatar: i });
                                                toast.success('Avatar atualizado com sucesso!');
                                                // Reload to reflect changes (or use context if available, but reload is safer for now)
                                                setTimeout(() => window.location.reload(), 1000);
                                            } catch (error) {
                                                console.error(error);
                                                toast.error('Erro ao atualizar avatar');
                                            }
                                        }}
                                        className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${user?.avatar === i
                                            ? 'border-primary ring-2 ring-primary/30 scale-110'
                                            : 'border-transparent hover:border-primary/50 hover:scale-105'
                                            }`}
                                    >
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                                            alt={`Avatar ${i}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {user?.avatar === i && (
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <Check className="w-6 h-6 text-white drop-shadow-md" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Display current custom avatar if it's not in the list */}
                            {user?.avatar && !['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
                                'Felix', 'Aneka', 'Zoe', 'Marc', 'Veronika', 'Milo', 'Cale', 'Buster',
                                'Easton', 'Jerry', 'Walter', 'Bob', 'Jack', 'Avery', 'Mason', 'George'].includes(user.avatar) && (
                                    <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-border/50 flex items-center gap-4">
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary/30">
                                            <img
                                                src={user.avatar.startsWith('http') || user.avatar.startsWith('/')
                                                    ? `${user.avatar.startsWith('/') ? import.meta.env.VITE_API_URL || 'http://localhost:3000' : ''}${user.avatar}`
                                                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                                                alt="Current Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium">Avatar Personalizado</p>
                                            <p className="text-xs text-muted-foreground">Você está usando uma foto carregada.</p>
                                        </div>
                                    </div>
                                )}

                            {/* Display current custom avatar if it's not in the list */}
                            {user?.avatar && !['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
                                'Felix', 'Aneka', 'Zoe', 'Marc', 'Veronika', 'Milo', 'Cale', 'Buster',
                                'Easton', 'Jerry', 'Walter', 'Bob', 'Jack', 'Avery', 'Mason', 'George'].includes(user.avatar) && (
                                    <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-border/50 flex items-center gap-4">
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary/30">
                                            <img
                                                src={user.avatar.startsWith('http') || user.avatar.startsWith('/')
                                                    ? `${user.avatar.startsWith('/') ? import.meta.env.VITE_API_URL || 'http://localhost:3000' : ''}${user.avatar}`
                                                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                                                alt="Current Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium">Avatar Personalizado</p>
                                            <p className="text-xs text-muted-foreground">Você está usando uma foto carregada.</p>
                                        </div>
                                    </div>
                                )}
                            <p className="text-sm text-muted-foreground mt-4 text-center sm:text-left">
                                Selecione um avatar para personalizar seu perfil ou faça upload de sua própria foto.
                            </p>

                            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                                <Label htmlFor="avatar-upload" className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md transition-colors flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Carregar Foto
                                </Label>
                                <Input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        try {
                                            const res = await auth.uploadAvatar(file);
                                            toast.success('Foto enviada com sucesso!');
                                            // Reload to reflect changes
                                            setTimeout(() => window.location.reload(), 1000);
                                        } catch (error) {
                                            console.error(error);
                                            toast.error('Erro ao enviar foto');
                                        }
                                    }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    Suporta JPG, PNG, GIF (Max 5MB)
                                </span>
                            </div>
                        </div>
                    </TabsContent>

                    {/* WHATSAPP TAB */}
                    <TabsContent value="whatsapp" className="space-y-6 py-4">

                        {/* GLOBAL CONNECTION (Visible to Admin or if User is using Global) */}
                        <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${globalConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">WhatsApp Global</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Status: <span className={globalConnected ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                                                {translateStatus(globalStatus)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant={globalConnected ? "destructive" : "default"}
                                    onClick={globalConnected ? handleDisconnectGlobal : handleConnectGlobal}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                                        globalConnected ? <WifiOff className="w-4 h-4 mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
                                    {globalConnected ? 'Desconectar' : 'Conectar'}
                                </Button>
                            </div>

                            {/* QR Code Area */}
                            {!globalConnected && globalQr && (
                                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-lg border border-border/30 animate-in fade-in zoom-in">
                                    <div className="bg-white p-4 rounded-lg">
                                        {typeof globalQr === 'string' && globalQr.startsWith('data:image') ? (
                                            <img src={globalQr} alt="QR Code" className="w-[200px] h-[200px]" />
                                        ) : (
                                            <QRCodeSVG value={typeof globalQr === 'string' ? globalQr : JSON.stringify(globalQr)} size={200} />
                                        )}
                                    </div>
                                    <p className="mt-4 text-sm text-muted-foreground text-center">
                                        Abra o WhatsApp no seu celular &gt; Configurações &gt; Aparelhos conectados &gt; Conectar aparelho
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* PERSONAL CONNECTION (Only if permitted) */}
                        {canUseOwnWhatsApp && (
                            <div className="bg-muted/30 rounded-lg p-6 border border-border/50 opacity-70">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                WhatsApp Pessoal
                                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Pro</span>
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Conecte seu próprio número para enviar mensagens.
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={isUsingOwnWhatsApp}
                                        onCheckedChange={() => toast.info("Em breve: Alternar para WhatsApp Pessoal")}
                                    />
                                </div>
                                {isUsingOwnWhatsApp && (
                                    <div className="text-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">Carregando instância pessoal...</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </TabsContent>

                    {/* PREFERENCES TAB */}
                    <TabsContent value="preferences" className="py-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Modo Escuro</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Ajuste a aparência do sistema.
                                    </p>
                                </div>
                                <Switch checked={true} disabled />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Notificações Sonoras</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Tocar som ao receber mensagens.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog >
    );
}



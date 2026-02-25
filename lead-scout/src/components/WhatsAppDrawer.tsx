import React, { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

import { MessageCircle, Send, Phone, User, X, LogOut, Mic, Check, CheckCheck, Play, Pause, Trash, Paperclip, Image as ImageIcon } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetClose
} from "./ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useWhatsApp } from '@/context/WhatsAppContext';
import { whatsapp } from '@/services/api';

interface WhatsAppMessage {
    id: string;
    body: string;
    from: string;
    to: string;
    senderName: string;
    timestamp: number;
    fromMe: boolean;
    type?: 'chat' | 'ptt' | 'image' | 'video';
    ack?: number; // 1: sent, 2: delivered, 3: read
    mediaUrl?: string; // For audio/image
}

interface WhatsAppDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetNumber?: string | null;
    targetName?: string | null;
}

// Removed redundant BACKEND_URL

const formatPhoneNumber = (phone: string | undefined | null) => {
    if (!phone) return '';
    // Remove non-digits
    const cleaned = phone.replace(/\D/g, '');
    // If it's a Brazilian number without country code (10 or 11 digits), add 55
    if (cleaned.length >= 10 && cleaned.length <= 11) {
        return '55' + cleaned;
    }
    return cleaned;
};

export const WhatsAppDrawer = ({ open, onOpenChange, targetNumber, targetName }: WhatsAppDrawerProps) => {
    const { socket, status, qrCode, isConnected } = useWhatsApp();

    // We keep local messages state to manage the specific chat history
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update active chat ID when target number changes
    useEffect(() => {
        if (targetNumber) {
            const formatted = formatPhoneNumber(targetNumber);
            // WhatsApp Web IDs are usually number@c.us
            setActiveChatId(`${formatted}@c.us`);
            // When switching chat, clear previous messages to avoid flickering
            setMessages([]);
        } else {
            setActiveChatId(null);
            setMessages([]);
        }
    }, [targetNumber]);

    // Load messages from backend when activeChatId changes
    useEffect(() => {
        if (!activeChatId) return;

        const fetchMessages = async () => {
            try {
                const data = await whatsapp.getMessages(activeChatId);
                console.log("Fetched messages:", data);
                setMessages(data);
                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        fetchMessages();
    }, [activeChatId]);

    // Listen for new messages via socket (Global Socket)
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: WhatsAppMessage) => {
            console.log("Real-time message received:", msg);
            // Append message only if it belongs to the current chat
            // OR if it's from ME (so it appears immediately)
            if (!activeChatId) return;

            const isForThisChat =
                (msg.fromMe && msg.to === activeChatId) ||
                (!msg.fromMe && msg.from === activeChatId);

            if (isForThisChat) {
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        };

        const handleAck = (data: { msgId: string, ack: number }) => {
            setMessages(prev => prev.map(m =>
                m.id === data.msgId ? { ...m, ack: data.ack } : m
            ));
        };

        socket.on('whatsapp_message', handleNewMessage);
        socket.on('whatsapp_ack', handleAck);

        return () => {
            socket.off('whatsapp_message', handleNewMessage);
            socket.off('whatsapp_ack', handleAck);
        };
    }, [socket, activeChatId]);


    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast.error("Erro ao acessar microfone.");
        }
    };

    const stopRecording = (shouldSend: boolean) => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (shouldSend) {
                    await sendMedia(audioBlob, 'ptt');
                }

                // Cleanup
                const tracks = mediaRecorderRef.current?.stream.getTracks();
                tracks?.forEach(track => track.stop());
                setIsRecording(false);
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            await sendMedia(file, 'image');
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const sendMedia = async (file: Blob | File, type: 'ptt' | 'image') => {
        if (!activeChatId) return;

        // Convert Blob/File to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64Media = reader.result as string;

            try {
                await whatsapp.sendMedia(activeChatId, base64Media, type);
                // Success is handled by the socket event 'whatsapp_message'
            } catch (e) {
                toast.error("Erro ao enviar mídia.");
            }
        };
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const target = activeChatId;

        if (!target) {
            toast.error("Nenhum destinatário selecionado.");
            return;
        }

        try {
            await whatsapp.sendMessage(target, input);
            setInput('');
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (e) {
            console.error("Failed to send", e);
            toast.error("Erro ao enviar mensagem");
        }
    };

    const handleLogout = async () => {
        if (!confirm("Tem certeza que deseja desconectar o WhatsApp? Você precisará escanear o QR Code novamente.")) return;

        try {
            await whatsapp.disconnect(); // logout is basically disconnect global or whatever the current session is
            toast.success("Desconectado com sucesso.");
        } catch (e) {
            console.error(e);
            toast.error("Erro ao desconectar.");
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[95vw] sm:max-w-[800px] p-0 border-l border-border bg-background flex flex-col shadow-2xl">
                <SheetHeader className="hidden">
                    <SheetTitle>WhatsApp Chat</SheetTitle>
                    <SheetDescription>Chat interface for WhatsApp</SheetDescription>
                </SheetHeader>
                {/* Header */}
                <div className="p-4 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    <User className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                            {isConnected && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                {targetName || "WhatsApp"} ({messages.length})
                                {!isConnected && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Desconectado</span>}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {targetNumber || "Selecione um contato"}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {isConnected && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 px-3 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                onClick={handleLogout}
                                title="Desconectar WhatsApp"
                            >
                                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                                Sair
                            </Button>
                        )}
                        <SheetClose className="rounded-full hover:bg-muted p-2 transition-colors">
                            <X className="h-5 w-5 text-muted-foreground" />
                        </SheetClose>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-hidden relative bg-[#0b141a]">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.06] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>

                    {!isConnected ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center z-10 relative text-gray-400">
                            {qrCode ? (
                                <div className="bg-white p-4 rounded-lg shadow-lg">
                                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                                    <p className="mt-4 text-black font-semibold">Escaneie para conectar</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-4"></div>
                                    <p>Conectando ao WhatsApp...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full px-4 py-4 z-10 relative overflow-y-auto custom-scrollbar">
                            <div className="space-y-2 pb-4">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={msg.id || idx}
                                        className={cn(
                                            "flex flex-col max-w-[85%] rounded-lg px-2 py-1 shadow-sm text-sm relative group transition-all",
                                            msg.fromMe
                                                ? "ml-auto bg-[#005c4b] text-white rounded-tr-none"
                                                : "mr-auto bg-[#202c33] text-white rounded-tl-none"
                                        )}
                                    >
                                        {msg.type === 'ptt' && msg.body ? (
                                            <div className="flex items-center gap-2 min-w-[200px] py-1">
                                                <audio src={msg.body} controls className="max-w-[220px] h-8" />
                                            </div>
                                        ) : msg.type === 'image' && msg.body ? (
                                            <div className="p-1">
                                                <img
                                                    src={msg.body}
                                                    alt="Imagem"
                                                    className="rounded-lg max-w-full max-h-[300px] object-cover cursor-pointer"
                                                    onClick={() => window.open(msg.body, '_blank')}
                                                />
                                            </div>
                                        ) : (
                                            <p className="leading-relaxed whitespace-pre-wrap px-1 pt-1 break-words">{msg.body}</p>
                                        )}

                                        <div className="flex items-center justify-end gap-1 mt-0.5 select-none">
                                            <span className="text-[10px] text-gray-300 opacity-80">
                                                {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.fromMe && (
                                                <span className="ml-0.5">
                                                    {msg.ack && msg.ack >= 3 ? (
                                                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                                    ) : msg.ack === 2 ? (
                                                        <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5 text-gray-400" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-2 bg-[#202c33] flex items-end gap-2 z-20 min-h-[60px] items-center">
                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-2 text-red-500 animate-pulse">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="font-mono">{formatTime(recordingTime)}</span>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="ghost" className="text-red-500 hover:bg-red-500/10" onClick={() => stopRecording(false)}>
                                    <Trash className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" className="text-green-500 hover:bg-green-500/10" onClick={() => stopRecording(true)}>
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Image Upload Button */}
                            <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 shrink-0 text-gray-400 hover:bg-[#374248] rounded-full"
                                title="Anexar Imagem"
                                disabled={!isConnected}
                            >
                                <Paperclip className="w-5 h-5" />
                            </Button>

                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Digite uma mensagem"
                                className="bg-[#2a3942] border-0 text-white placeholder-gray-400 focus-visible:ring-0 rounded-lg py-2 px-4 flex-1"
                                disabled={!isConnected}
                            />
                            {input.trim() ? (
                                <Button
                                    onClick={handleSend}
                                    size="icon"
                                    className="h-10 w-10 shrink-0 bg-[#005c4b] hover:bg-[#005c4b]/80 text-white rounded-full"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={startRecording}
                                    size="icon"
                                    className="h-10 w-10 shrink-0 bg-[#202c33] hover:bg-[#374248] text-gray-300 rounded-full"
                                >
                                    <Mic className="w-5 h-5" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

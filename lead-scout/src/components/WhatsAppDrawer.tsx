import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircle, Send, Phone, User, X, LogOut, Mic, Check, CheckCheck, Play, Pause, Trash } from 'lucide-react';
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

const BACKEND_URL = 'http://localhost:3000';

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
    const [socket, setSocket] = useState<Socket | null>(null);
    const [status, setStatus] = useState<string>('DISCONNECTED');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // Update active chat ID when target number changes
    useEffect(() => {
        if (targetNumber) {
            const formatted = formatPhoneNumber(targetNumber);
            // WhatsApp Web IDs are usually number@c.us
            setActiveChatId(`${formatted}@c.us`);
        } else {
            setActiveChatId(null);
        }
    }, [targetNumber]);

    // Load messages from backend when activeChatId changes
    useEffect(() => {
        if (!activeChatId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            try {
                // Encode the chatId to handle special characters if any (though usually just numbers and @)
                const response = await fetch(`${BACKEND_URL}/messages/${encodeURIComponent(activeChatId)}`);
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                    setTimeout(() => {
                        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        fetchMessages();
    }, [activeChatId]);

    // Listen for new messages via socket
    useEffect(() => {
        if (activeChatId) {
            // Re-fetch or append? Appending is smoother.
            // But we need to make sure we don't duplicate.
        }
    }, [activeChatId]);

    useEffect(() => {
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log("Connected to WebSocket");
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
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Filter messages for current chat
    const filteredMessages = messages.filter(msg => {
        if (!activeChatId) return true; // Show all if no specific target (or handle differently)
        // Check if message belongs to this chat
        // If from me, 'to' should match activeChatId (remote) - simplified check involves 'from' or matching logic
        const remoteId = msg.fromMe ? msg.to : msg.from;

        // Basic loose matching because 'c.us' suffix might vary or strip
        return remoteId?.includes(activeChatId) || activeChatId?.includes(remoteId?.split('@')[0]);
    });


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
                    await sendAudio(audioBlob);
                }

                // Cleanup
                const tracks = mediaRecorderRef.current?.stream.getTracks();
                tracks?.forEach(track => track.stop());
                setIsRecording(false);
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    };

    const sendAudio = async (blob: Blob) => {
        if (!socket || !activeChatId) return;

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;

            try {
                // Send to backend (need to update endpoint to handle media)
                // For now, let's assume the modify endpoint or a new one
                const response = await fetch(`${BACKEND_URL}/whatsapp/send-media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: activeChatId,
                        media: base64Audio,
                        type: 'ptt'
                    })
                });

                if (response.ok) {
                    // Success handled by socket
                } else {
                    toast.error("Erro ao enviar áudio.");
                }
            } catch (e) {
                toast.error("Erro ao enviar áudio.");
            }
        };
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSend = async () => {
        if (!input.trim() || !socket) return;

        const target = activeChatId;

        if (!target) {
            toast.error("Nenhum destinatário selecionado.");
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/whatsapp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: target, message: input })
            });

            if (response.ok) {
                // We rely on the backend socket event to add the message to the list
                // This prevents duplication (one from optimistic, one from socket)
                setInput('');
                setTimeout(() => {
                    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                toast.error("Erro ao enviar mensagem");
            }
        } catch (e) {
            console.error("Failed to send", e);
            toast.error("Erro ao enviar mensagem");
        }
    };

    const handleLogout = async () => {
        if (!confirm("Tem certeza que deseja desconectar o WhatsApp? Você precisará escanear o QR Code novamente.")) return;

        try {
            await fetch(`${BACKEND_URL}/whatsapp/logout`, { method: 'POST' });
            setStatus('DISCONNECTED');
            setQrCode(null);
            toast.success("Desconectado com sucesso.");
        } catch (e) {
            console.error(e);
            toast.error("Erro ao desconectar.");
        }
    };

    const isConnected = status === 'CONNECTED' || status === 'AUTHENTICATED' || status === 'READY';

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
                                {targetName || "WhatsApp"}
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
                            {/* ... keep disconnected state but maybe style it dark ... */}
                            <p>Conectando...</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full px-4 py-4 z-10 relative">
                            <div className="space-y-2 pb-4">
                                {filteredMessages.map((msg, idx) => (
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
                                                <Play className="w-5 h-5 text-gray-300" />
                                                {/* Placeholder audio player */}
                                                <div className="h-1 bg-gray-500 w-full rounded-full"></div>
                                                {/* If we have the audio data/url, we could use <audio src={msg.body} /> but keeping it simple for now */}
                                                <audio src={msg.body} controls className="hidden" /> {/* Hidden real player */}
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
                        </ScrollArea>
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

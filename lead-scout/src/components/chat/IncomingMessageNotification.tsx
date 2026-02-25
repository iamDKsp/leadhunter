import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, X, ChevronRight, Image, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface IncomingNotification {
    id: string;
    senderName: string;
    body: string;
    chatId: string;
    timestamp: number;
    type?: string;
}

interface IncomingMessageNotificationProps {
    notifications: IncomingNotification[];
    onDismiss: (id: string) => void;
    onDismissAll: () => void;
}

export const IncomingMessageNotification = ({
    notifications,
    onDismiss,
    onDismissAll,
}: IncomingMessageNotificationProps) => {
    const navigate = useNavigate();

    // Auto-dismiss after 10 seconds
    useEffect(() => {
        if (notifications.length === 0) return;

        const timers = notifications.map((n) =>
            setTimeout(() => onDismiss(n.id), 10000)
        );

        return () => timers.forEach(clearTimeout);
    }, [notifications, onDismiss]);

    if (notifications.length === 0) return null;

    const getMessagePreview = (notification: IncomingNotification) => {
        if (notification.type === 'ptt' || notification.type === 'audio') {
            return (
                <span className="flex items-center gap-1.5">
                    <Mic className="h-3 w-3" />
                    Áudio recebido
                </span>
            );
        }
        if (notification.type === 'image') {
            return (
                <span className="flex items-center gap-1.5">
                    <Image className="h-3 w-3" />
                    Imagem recebida
                </span>
            );
        }
        if (notification.type === 'video') {
            return (
                <span className="flex items-center gap-1.5">
                    <Image className="h-3 w-3" />
                    Vídeo recebido
                </span>
            );
        }
        // Text - truncate
        const text = notification.body || '';
        return text.length > 80 ? text.substring(0, 80) + '...' : text;
    };

    const handleGoToChat = (chatId: string, notifId: string) => {
        onDismiss(notifId);
        navigate(`/conversas?chatId=${encodeURIComponent(chatId)}`);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] space-y-3 max-w-sm pointer-events-none">
            {notifications.slice(0, 3).map((notification, index) => {
                const timeStr = new Date(notification.timestamp * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                });

                return (
                    <div
                        key={notification.id}
                        className={cn(
                            "pointer-events-auto",
                            "bg-card/95 backdrop-blur-xl border border-primary/40 rounded-xl shadow-2xl shadow-primary/10",
                            "p-4 animate-in slide-in-from-right-8 fade-in fill-mode-both duration-300",
                            "transition-all hover:border-primary/60 hover:shadow-primary/20",
                        )}
                        style={{
                            animationDelay: `${index * 80}ms`,
                        }}
                    >
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary flex-shrink-0 border border-primary/30">
                                <MessageSquare className="h-5 w-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-foreground text-sm truncate">
                                        {notification.senderName || 'Novo contato'}
                                    </h4>
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                        <span className="text-[10px] text-muted-foreground">
                                            {timeStr}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                            onClick={() => onDismiss(notification.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Badge */}
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                                        Nova mensagem
                                    </span>
                                </div>

                                {/* Message preview */}
                                <p className="text-sm text-muted-foreground mb-2.5 line-clamp-2">
                                    {getMessagePreview(notification)}
                                </p>

                                {/* Action button */}
                                <Button
                                    size="sm"
                                    className="w-full gap-2 bg-primary/90 hover:bg-primary text-primary-foreground"
                                    onClick={() => handleGoToChat(notification.chatId, notification.id)}
                                >
                                    Ir para conversa
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {notifications.length > 3 && (
                <div className="text-center pointer-events-auto animate-in fade-in duration-300">
                    <button
                        className="text-xs text-muted-foreground bg-card/90 backdrop-blur-xl rounded-lg px-3 py-2 border border-border hover:border-primary/30 transition-colors"
                        onClick={onDismissAll}
                    >
                        +{notifications.length - 3} mensagens pendentes — Limpar todas
                    </button>
                </div>
            )}
        </div>
    );
};

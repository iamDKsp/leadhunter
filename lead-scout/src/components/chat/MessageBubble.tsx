import { cn } from "@/lib/utils";
import { Check, CheckCheck, FileText, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

export interface Message {
    id: string;
    content: string;
    timestamp: string;
    isSent: boolean;
    isRead: boolean;
    type: "text" | "template" | "image" | "video" | "audio" | "ptt" | "document";
}

interface MessageBubbleProps {
    message: Message;
}

const AudioPlayer = ({ src, isSent }: { src: string, isSent: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, []);

    return (
        <div className="flex items-center gap-2 min-w-[150px]">
            <Button
                size="icon"
                variant="ghost"
                className={cn("h-8 w-8", isSent ? "text-primary-foreground hover:text-primary-foreground/80" : "text-foreground hover:bg-muted")}
                onClick={togglePlay}
            >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="h-1 flex-1 bg-current/20 rounded-full overflow-hidden">
                <div className="h-full bg-current w-0 transition-all duration-100" />
            </div>
            <audio ref={audioRef} src={src} className="hidden" />
        </div>
    );
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
    const isMedia = ["image", "video", "audio", "ptt", "document"].includes(message.type);

    // Helper to determine content to render
    const renderContent = () => {
        switch (message.type) {
            case 'image':
                return (
                    <div className="rounded-lg overflow-hidden my-1">
                        <img
                            src={message.content.startsWith('data:') ? message.content : `data:image/jpeg;base64,${message.content}`}
                            alt="Imagem"
                            className="max-w-[250px] max-h-[300px] object-cover"
                            onClick={() => window.open(message.content.startsWith('data:') ? message.content : `data:image/jpeg;base64,${message.content}`, '_blank')}
                        />
                    </div>
                );
            case 'video':
                return (
                    <div className="rounded-lg overflow-hidden my-1">
                        <video
                            src={message.content.startsWith('data:') ? message.content : `data:video/mp4;base64,${message.content}`}
                            controls
                            className="max-w-[250px] max-h-[300px]"
                        />
                    </div>
                );
            case 'ptt':
            case 'audio':
                return (
                    <AudioPlayer
                        src={message.content.startsWith('data:') ? message.content : `data:audio/mp3;base64,${message.content}`}
                        isSent={message.isSent}
                    />
                );
            case 'document':
                return (
                    <div className="flex items-center gap-3 p-2 bg-background/10 rounded-lg border border-border/10">
                        <FileText className="h-8 w-8 opacity-70" />
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate max-w-[150px]">Documento</p>
                            <a
                                href={message.content.startsWith('data:') ? message.content : `data:application/octet-stream;base64,${message.content}`}
                                download="documento"
                                className="text-xs underline opacity-80 hover:opacity-100"
                            >
                                Baixar
                            </a>
                        </div>
                    </div>
                );
            case 'text':
            case 'template':
            default:
                return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>;
        }
    };

    return (
        <div
            className={cn(
                "flex animate-fade-in",
                message.isSent ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "max-w-[70%] px-4 py-2.5 rounded-2xl relative",
                    message.isSent
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md",
                    isMedia && "p-2"
                )}
            >
                {renderContent()}

                <div
                    className={cn(
                        "flex items-center justify-end gap-1 mt-1",
                        message.isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                >
                    <span className="text-[10px]">{message.timestamp}</span>
                    {message.isSent && (
                        message.isRead ? (
                            <CheckCheck className="h-3 w-3" />
                        ) : (
                            <Check className="h-3 w-3" />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, FileText, Play, Pause, Download } from "lucide-react";
import { useState, useRef, useEffect, Fragment } from "react";

// --- WhatsApp Markdown Parser ---
const parseWhatsAppMarkdown = (text: string): React.ReactNode => {
    // Split by newlines first to preserve line breaks
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
        // Parse inline formatting within each line
        const segments = parseInlineFormatting(line);
        return (
            <Fragment key={lineIndex}>
                {segments}
                {lineIndex < lines.length - 1 && <br />}
            </Fragment>
        );
    });
};

const parseInlineFormatting = (text: string): React.ReactNode => {
    // Regex for WhatsApp formatting: *bold*, _italic_, ~strikethrough~, `mono`
    const pattern = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];
        const inner = token.slice(1, -1); // Strip surrounding markers

        if (token.startsWith('*')) {
            parts.push(<strong key={match.index}>{inner}</strong>);
        } else if (token.startsWith('_')) {
            parts.push(<em key={match.index}>{inner}</em>);
        } else if (token.startsWith('~')) {
            parts.push(<s key={match.index}>{inner}</s>);
        } else if (token.startsWith('`')) {
            parts.push(<code key={match.index} className="bg-black/20 rounded px-1 font-mono text-xs">{inner}</code>);
        }

        lastIndex = match.index + token.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
};

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
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
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

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        const handleError = (e: Event) => {
            console.error("Audio playback error:", audio.error, "Source:", src);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, []);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = (parseFloat(e.target.value) / 100) * duration;
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setProgress(parseFloat(e.target.value));
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl min-w-[220px]",
            isSent ? "bg-primary-foreground/10" : "bg-muted/50"
        )}>
            <div className="flex-shrink-0">
                <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                        "h-10 w-10 rounded-full transition-all duration-200",
                        isSent
                            ? "bg-white/20 hover:bg-white/30 text-white"
                            : "bg-primary/10 hover:bg-primary/20 text-primary"
                    )}
                    onClick={togglePlay}
                >
                    {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-1" />}
                </Button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-1 min-w-[120px]">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleSeek}
                    className={cn(
                        "w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0",
                        isSent ? "bg-white/30 accent-white" : "bg-primary/20 accent-primary"
                    )}
                    style={{
                        backgroundSize: `${progress}% 100%`,
                    }}
                />
                <div className={cn(
                    "flex justify-between text-[10px] font-medium leading-none",
                    isSent ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
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
                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="rounded-lg overflow-hidden my-1 cursor-pointer hover:opacity-90 transition-opacity">
                                <img
                                    src={message.content}
                                    alt="Imagem"
                                    className="max-w-[250px] max-h-[300px] object-cover"
                                    onError={(e) => {
                                        // Fallback if it was base64 without prefix (old data)
                                        const target = e.target as HTMLImageElement;
                                        if (!target.src.startsWith('http') && !target.src.startsWith('data:')) {
                                            target.src = `data:image/jpeg;base64,${message.content}`;
                                        }
                                    }}
                                />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none flex flex-col items-center justify-center relative">
                            <div className="relative group">
                                <img
                                    src={message.content}
                                    alt="Full screen"
                                    className="max-h-[85vh] max-w-full rounded-md object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (!target.src.startsWith('http') && !target.src.startsWith('data:')) {
                                            target.src = `data:image/jpeg;base64,${message.content}`;
                                        }
                                    }}
                                />
                                <a
                                    href={message.content}
                                    download={`image-${message.id}`}
                                    className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100"
                                    title="Baixar imagem"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Download className="h-6 w-6" />
                                </a>
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            case 'video':
                return (
                    <div className="rounded-lg overflow-hidden my-1">
                        <video
                            src={message.content.startsWith('data:') || message.content.startsWith('http') ? message.content : `data:video/mp4;base64,${message.content}`}
                            controls
                            className="max-w-[250px] max-h-[300px]"
                        />
                    </div>
                );
            case 'ptt':
            case 'audio':
                return (
                    <AudioPlayer
                        src={message.content.startsWith('data:') || message.content.startsWith('http') ? message.content : `data:audio/mp3;base64,${message.content}`}
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
                                href={message.content.startsWith('data:') || message.content.startsWith('http') ? message.content : `data:application/octet-stream;base64,${message.content}`}
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
                return (
                    <p className="text-sm leading-relaxed break-words">
                        {parseWhatsAppMarkdown(message.content)}
                    </p>
                );
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

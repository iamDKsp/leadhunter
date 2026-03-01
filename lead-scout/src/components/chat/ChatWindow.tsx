import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, X, File, PanelRightOpen, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble, Message } from "./MessageBubble";
import { QuickTemplates } from "./QuickTemplates";
import { Conversation } from "./ConversationItem";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface ChatWindowProps {
    conversation: Conversation;
    messages: Message[];
    onSendMessage: (content: string) => void;
    onSendMedia: (file: string, type: string) => void;
    showInfoPanel: boolean;
    onToggleInfoPanel: () => void;
}

export const ChatWindow = ({
    conversation,
    messages,
    onSendMessage,
    onSendMedia,
    showInfoPanel,
    onToggleInfoPanel
}: ChatWindowProps) => {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea as user types
    const adjustTextareaHeight = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 150) + 'px';
    };

    // Media States
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        // Initial scroll to bottom
        scrollToBottom("auto");
    }, []); // On mount

    useEffect(() => {
        // When messages change, we want to scroll to bottom IF:
        // 1. We sent the last message (it's new)
        // 2. We were already at the bottom
        // But checking scroll position in React effect is tricky with ref timing.

        // Simplification for user request "Scroll forces bottom":
        // We will default to scrolling on NEW messages, but if it's annoying, 
        // we can check if the last message is from 'Me'.

        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.isSent) {
            scrollToBottom();
        } else {
            // For incoming messages, ideally checking scrollTop would be best.
            // But for now, let's just NOT force scroll if we are reading history (scrolled up).
            // Implementing "smart scroll" logic requires a container Ref and onScroll handler tracking.
            // Given the constraints, let's try strict bottom scroll ONLY if user is clearly at bottom?
            // Or just scroll on every message for now but "smooth" might be the fighter.

            // The user explicitly complained: "always forces us down whenever we try to go up".
            // This suggests that `messages` state updates (maybe via polling or other re-renders) trigger this effect repeatedly.
            // If `messages` changes reference but content is same, it triggers.
            // Use a deep comparison or only trigger if length changed?

            scrollToBottom();
        }
    }, [messages.length]); // Only scroll if COUNT changes, not just any re-render


    // Handle Paste Event
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                e.preventDefault();
                const file = e.clipboardData.files[0];
                handleFileSelect(file);
            }
        };

        // Attach to window or specific container? Window is safer for global catch
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const handleFileSelect = (file: File) => {
        if (file.size > 15 * 1024 * 1024) { // 15MB limit
            toast.error("Arquivo muito grande (max 15MB)");
            return;
        }

        setSelectedFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleSend = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue("");
            // Reset textarea height after send
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleSendMedia = async () => {
        if (!selectedFile) return;
        setIsSending(true);

        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            try {
                const base64 = reader.result as string;
                const type = selectedFile.type.startsWith('audio') ? 'ptt' :
                    selectedFile.type.startsWith('image') ? 'image' : 'document';

                // Call parent handler
                onSendMedia(base64, type);

                handleClosePreview();
            } catch (error) {
                console.error(error);
                toast.error("Erro ao preparar mídia");
            } finally {
                setIsSending(false);
            }
        };
    };

    const handleClosePreview = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        // Shift+Enter = new line (default behavior, no need to override)
    };

    const handleTemplateSelect = (template: string) => {
        setInputValue(template);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background/50 backdrop-blur-sm relative">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileInputChange}
                accept="image/*,video/*,application/pdf,audio/*"
            />

            {/* Media Preview Modal */}
            <Dialog open={!!selectedFile} onOpenChange={(open) => !open && handleClosePreview()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar Mídia</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-4 gap-4">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="max-h-[300px] rounded-lg object-contain" />
                        ) : (
                            <div className="flex flex-col items-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                <File className="w-12 h-12 mb-2" />
                                <span>{selectedFile?.name}</span>
                            </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {(selectedFile?.size || 0) / 1024 < 1024
                                ? `${((selectedFile?.size || 0) / 1024).toFixed(1)} KB`
                                : `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(1)} MB`}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClosePreview} disabled={isSending}>Cancelar</Button>
                        <Button onClick={handleSendMedia} disabled={isSending}>
                            {isSending ? "Enviando..." : "Enviar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/30">
                <div className="flex items-center gap-3">
                    {conversation.avatar ? (
                        <img
                            src={conversation.avatar}
                            alt={conversation.leadName}
                            className="h-10 w-10 rounded-full object-cover border border-border"
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                            <span className="font-semibold text-primary">
                                {conversation.leadName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div>
                        <h3 className="font-medium text-foreground">{conversation.leadName}</h3>
                        <p className="text-xs text-primary">{conversation.businessName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Video className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={onToggleInfoPanel}
                        title={showInfoPanel ? "Ocultar painel" : "Mostrar painel"}
                    >
                        {showInfoPanel ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-repeat"
                style={{
                    backgroundImage: 'linear-gradient(rgba(10, 10, 10, 0.5), rgba(10, 10, 10, 0.5)), url("/wallpaper.png")',
                    backgroundSize: '400px',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                {/* Date Separator */}
                <div className="flex items-center justify-center">
                    <span className="text-xs text-muted-foreground bg-secondary/90 px-3 py-1 rounded-full shadow-sm">
                        Hoje
                    </span>
                </div>

                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Templates */}
            <QuickTemplates onSelectTemplate={handleTemplateSelect} />

            {/* Input Area */}
            <div className="px-4 py-4 border-t border-border bg-card/30">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Smile className="h-5 w-5" />
                    </Button>

                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            adjustTextareaHeight();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem (Shift+Enter para nova linha)..."
                        rows={1}
                        className="flex-1 bg-input border border-border focus:border-primary focus:outline-none rounded-md px-3 py-2 text-sm resize-none overflow-y-auto text-foreground placeholder:text-muted-foreground"
                        style={{ minHeight: '40px', maxHeight: '150px' }}
                    />

                    <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className={cn(
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                            !inputValue.trim() && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}

export const ChatWindow = ({
    conversation,
    messages,
    onSendMessage,
    onSendMedia
}: ChatWindowProps) => {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Media States
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            onSendMessage(inputValue.trim());
            setInputValue("");
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
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
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                {/* Date Separator */}
                <div className="flex items-center justify-center">
                    <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
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

                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem (Ctrl+V para colar imagem)..."
                        className="flex-1 bg-input border-border focus:border-primary"
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

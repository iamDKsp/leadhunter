import { cn } from "@/lib/utils";

interface Message {
    id: string;
    sender: "user" | "lead";
    content: string;
    timestamp: string;
    read: boolean;
}

interface ChatHistoryProps {
    userName: string;
    leadName: string;
    leadPhone: string;
    messages: Message[];
}

const ChatHistory = ({ userName, leadName, leadPhone, messages }: ChatHistoryProps) => {
    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-background/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-foreground">{leadName}</h4>
                        <p className="text-xs text-muted-foreground">{leadPhone}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Conversa com {userName}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhuma mensagem</p>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex",
                                msg.sender === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[70%] rounded-xl px-4 py-2",
                                    msg.sender === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-muted text-foreground rounded-bl-sm"
                                )}
                            >
                                <p className="text-sm break-words">{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-[10px] opacity-70">{msg.timestamp}</span>
                                    {msg.sender === "user" && (
                                        <span className={cn(
                                            "text-[10px]",
                                            msg.read ? "text-blue-300" : "opacity-50"
                                        )}>
                                            {msg.read ? "✓✓" : "✓"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatHistory;

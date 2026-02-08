import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import UserStatusBadge from "./UserStatusBadge";
import ChatHistory from "./ChatHistory";

interface Message {
    id: string;
    sender: "user" | "lead";
    content: string;
    timestamp: string;
    read: boolean;
}

interface ChatSession {
    leadName: string;
    leadPhone: string;
    messages: Message[];
}

interface User {
    id: string;
    name: string;
    email: string;
    status: "online" | "away" | "offline";
    lastSeen: string;
    sessionDuration: string;
    activeChats: number;
    chatHistory: ChatSession[];
}

interface UsersTableProps {
    users: User[];
}

const UsersTable = ({ users }: UsersTableProps) => {
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [selectedChat, setSelectedChat] = useState<number>(0);

    const toggleExpand = (userId: string) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
            setSelectedChat(0);
        } else {
            setExpandedUser(userId);
            setSelectedChat(0);
        }
    };

    return (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card/60 backdrop-blur-sm">
            {/* Header */}
            <div className="grid grid-cols-7 gap-4 px-4 py-3 bg-muted/30 border-b border-border/50 text-sm font-medium text-muted-foreground">
                <div className="col-span-1"></div>
                <div className="col-span-2">Usuário</div>
                <div>Status</div>
                <div>Última Atividade</div>
                <div>Tempo Online</div>
                <div className="text-right">Conversas</div>
            </div>

            {/* Body */}
            <div className="divide-y divide-border/30">
                {users.map((user) => (
                    <div key={user.id}>
                        {/* User Row */}
                        <div
                            className={cn(
                                "grid grid-cols-7 gap-4 px-4 py-4 cursor-pointer transition-colors hover:bg-muted/20",
                                expandedUser === user.id && "bg-primary/5"
                            )}
                            onClick={() => toggleExpand(user.id)}
                        >
                            <div className="col-span-1 flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(user.id);
                                    }}
                                >
                                    {expandedUser === user.id ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>

                            <div className="col-span-2 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                                    {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <UserStatusBadge status={user.status} />
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">{user.lastSeen}</span>
                            </div>

                            <div className="flex items-center">
                                <span className="text-sm text-foreground">{user.sessionDuration}</span>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">{user.activeChats}</span>
                            </div>
                        </div>

                        {/* Expanded Chat Section */}
                        {expandedUser === user.id && user.chatHistory && user.chatHistory.length > 0 && (
                            <div className="p-4 bg-background/30 border-t border-border/30">
                                <div className="flex gap-4">
                                    {/* Chat List */}
                                    <div className="w-64 space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                                            Conversas ({user.chatHistory.length})
                                        </h4>
                                        {user.chatHistory.map((chat, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedChat(index)}
                                                className={cn(
                                                    "w-full p-3 rounded-lg text-left transition-all",
                                                    selectedChat === index
                                                        ? "bg-primary/20 border border-primary/50"
                                                        : "bg-card/50 border border-border hover:bg-card"
                                                )}
                                            >
                                                <p className="font-medium text-sm text-foreground">
                                                    {chat.leadName}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {chat.messages[chat.messages.length - 1]?.content || "Sem mensagens"}
                                                </p>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Chat History */}
                                    <div className="flex-1">
                                        {user.chatHistory[selectedChat] && (
                                            <ChatHistory
                                                userName={user.name}
                                                leadName={user.chatHistory[selectedChat].leadName}
                                                leadPhone={user.chatHistory[selectedChat].leadPhone}
                                                messages={user.chatHistory[selectedChat].messages}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {expandedUser === user.id && (!user.chatHistory || user.chatHistory.length === 0) && (
                            <div className="p-8 bg-background/30 border-t border-border/30 text-center">
                                <p className="text-muted-foreground">Nenhuma conversa encontrada para este usuário</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {users.length === 0 && (
                <div className="p-8 text-center">
                    <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </div>
            )}
        </div>
    );
};

export default UsersTable;

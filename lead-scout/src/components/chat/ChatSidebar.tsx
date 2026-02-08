import { useState } from "react";
import { Search, Filter, MessageSquarePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConversationItem, Conversation } from "./ConversationItem";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    connectionStatus?: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
}

type FilterType = "all" | "hot" | "warm" | "cold" | "unread";

export const ChatSidebar = ({
    conversations,
    activeConversationId,
    onSelectConversation,
    connectionStatus
}: ChatSidebarProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");

    const filteredConversations = conversations.filter((conv) => {
        const matchesSearch =
            conv.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.businessName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            filter === "all" ||
            (filter === "unread" && conv.unreadCount > 0) ||
            filter === conv.status;

        return matchesSearch && matchesFilter;
    });

    const filterButtons: { key: FilterType; label: string }[] = [
        { key: "all", label: "Todos" },
        { key: "unread", label: "Não lidos" },
        { key: "hot", label: "Quentes" },
        { key: "warm", label: "Mornos" },
        { key: "cold", label: "Frios" },
    ];

    return (
        <div className="w-80 xl:w-96 h-full flex flex-col bg-card/90 backdrop-blur-xl border-r border-border">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <MessageSquarePlus className="h-5 w-5 text-primary" />
                        Conversas
                    </h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                        {conversations.length} leads
                    </span>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar conversa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-input border-border focus:border-primary"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 border-b border-border/50 flex gap-2 overflow-x-auto scrollbar-thin">
                {filterButtons.map((btn) => (
                    <button
                        key={btn.key}
                        onClick={() => setFilter(btn.key)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap",
                            filter === btn.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        )}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                        <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={conversation.id === activeConversationId}
                            onClick={() => onSelectConversation(conversation.id)}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Filter className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma conversa encontrada</p>
                    </div>
                )}
            </div>
        </div>
    );
};

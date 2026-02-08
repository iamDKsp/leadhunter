import { cn } from "@/lib/utils";
import { Check, CheckCheck, Flame, Snowflake, ThermometerSun, Bell } from "lucide-react";

export interface Conversation {
    id: string;
    leadName: string;
    businessName: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    status: "hot" | "warm" | "cold";
    avatar?: string;
    isRead: boolean;
    phone: string;
    hasFollowUp?: boolean;
}

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
}

const statusIcons = {
    hot: <Flame className="h-3.5 w-3.5 text-orange-500" />,
    warm: <ThermometerSun className="h-3.5 w-3.5 text-yellow-500" />,
    cold: <Snowflake className="h-3.5 w-3.5 text-blue-500" />,
};

const statusLabels = {
    hot: "Quente",
    warm: "Morno",
    cold: "Frio",
};

export const ConversationItem = ({
    conversation,
    isActive,
    onClick,
}: ConversationItemProps) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-start gap-3 p-4 cursor-pointer transition-all duration-200 border-b border-border/30",
                "hover:bg-secondary/50",
                isActive && "bg-secondary border-l-2 border-l-primary"
            )}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {conversation.avatar ? (
                    <img
                        src={conversation.avatar}
                        alt={conversation.leadName}
                        className="h-12 w-12 rounded-full object-cover border border-border"
                    />
                ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                        <span className="text-lg font-semibold text-primary">
                            {conversation.leadName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
                {conversation.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                        {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </span>
                )}
                {conversation.hasFollowUp && (
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 bg-yellow-500 text-white rounded-full flex items-center justify-center p-0.5">
                        <Bell className="h-3 w-3" />
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                        "font-medium truncate",
                        conversation.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {conversation.leadName}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {conversation.timestamp}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs text-primary font-medium truncate">
                        {conversation.businessName}
                    </span>
                    <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-muted/50">
                        {statusIcons[conversation.status]}
                        <span className="text-muted-foreground">{statusLabels[conversation.status]}</span>
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    {conversation.isRead ? (
                        <CheckCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    ) : (
                        <Check className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <p className={cn(
                        "text-sm truncate",
                        conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                        {conversation.lastMessage.startsWith('data:') ? '📷 Imagem' : conversation.lastMessage}
                    </p>
                </div>
            </div>
        </div>
    );
};

import { cn } from "@/lib/utils";

interface UserStatusBadgeProps {
    status: "online" | "away" | "offline";
}

const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
    const statusConfig = {
        online: {
            label: "Online",
            className: "bg-green-500/10 text-green-500 border-green-500/30",
            dotClass: "bg-green-500",
        },
        away: {
            label: "Ausente",
            className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
            dotClass: "bg-yellow-500",
        },
        offline: {
            label: "Offline",
            className: "bg-muted text-muted-foreground border-border",
            dotClass: "bg-muted-foreground",
        },
    };

    const config = statusConfig[status];

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            config.className
        )}>
            <span className={cn("w-2 h-2 rounded-full", config.dotClass, status === "online" && "animate-pulse")} />
            {config.label}
        </span>
    );
};

export default UserStatusBadge;

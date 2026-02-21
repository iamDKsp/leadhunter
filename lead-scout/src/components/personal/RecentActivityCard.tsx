import { Activity, ThumbsUp, ThumbsDown, CalendarCheck, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
    id: string;
    type: "won" | "lost" | "meeting" | string;
    title: string;
    leadName: string;
    value?: number;
    time: string;
    status: "completed" | "scheduled" | "pending" | string;
}

interface RecentActivityCardProps {
    activities: ActivityItem[];
}

const RecentActivityCard = ({ activities }: RecentActivityCardProps) => {
    const getIcon = (type: string) => {
        switch (type) {
            case "won":
                return <Trophy className="w-4 h-4" />;
            case "lost":
                return <ThumbsDown className="w-4 h-4" />;
            case "meeting":
                return <CalendarCheck className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const getTypeStyle = (type: string) => {
        switch (type) {
            case "won":
                return "bg-green-500/10 text-green-500";
            case "lost":
                return "bg-red-500/10 text-red-500";
            case "meeting":
                return "bg-purple-500/10 text-purple-500";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "won":
                return "Ganho";
            case "lost":
                return "Perdido";
            case "meeting":
                return "Reunião";
            default:
                return type;
        }
    };

    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 animate-fade-in" style={{ animationDelay: "600ms" }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Atividade Recente</h3>
                    <p className="text-sm text-muted-foreground">Suas últimas ações</p>
                </div>
            </div>

            <div className="space-y-3">
                {activities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
                ) : (
                    activities.slice(0, 8).map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors"
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                getTypeStyle(activity.type)
                            )}>
                                {getIcon(activity.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">
                                    {activity.leadName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {activity.title}
                                    {activity.value ? ` • R$ ${activity.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                                </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <span className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-full",
                                    getTypeStyle(activity.type)
                                )}>
                                    {getTypeLabel(activity.type)}
                                </span>
                                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentActivityCard;

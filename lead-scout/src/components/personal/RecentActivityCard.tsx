import { Activity, Phone, Mail, Calendar, FileText, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
    id: string;
    type: "call" | "email" | "meeting" | "task" | "proposal";
    title: string;
    leadName: string;
    time: string;
    status: "completed" | "scheduled" | "pending";
}

interface RecentActivityCardProps {
    activities: ActivityItem[];
}

const RecentActivityCard = ({ activities }: RecentActivityCardProps) => {
    const getIcon = (type: string) => {
        switch (type) {
            case "call":
                return <Phone className="w-4 h-4" />;
            case "email":
                return <Mail className="w-4 h-4" />;
            case "meeting":
                return <Calendar className="w-4 h-4" />;
            case "task":
                return <CheckSquare className="w-4 h-4" />;
            case "proposal":
                return <FileText className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-500/10 text-green-500";
            case "scheduled":
                return "bg-blue-500/10 text-blue-500";
            case "pending":
                return "bg-yellow-500/10 text-yellow-500";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "completed":
                return "Concluído";
            case "scheduled":
                return "Agendado";
            case "pending":
                return "Pendente";
            default:
                return status;
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
                    activities.slice(0, 5).map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors"
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                getStatusStyle(activity.status)
                            )}>
                                {getIcon(activity.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">
                                    {activity.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {activity.leadName}
                                </p>
                            </div>

                            <div className="text-right">
                                <span className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-full",
                                    getStatusStyle(activity.status)
                                )}>
                                    {getStatusText(activity.status)}
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

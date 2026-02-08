import { format, isToday, isTomorrow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Bell,
    Phone,
    MessageSquare,
    Mail,
    Users,
    Check,
    Trash2,
    Clock,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FollowUp } from "./FollowUpScheduler";

interface FollowUpListProps {
    followUps: FollowUp[];
    onComplete: (id: string) => void;
    onDelete: (id: string) => void;
}

const typeIcons = {
    call: <Phone className="h-3.5 w-3.5" />,
    message: <MessageSquare className="h-3.5 w-3.5" />,
    email: <Mail className="h-3.5 w-3.5" />,
    meeting: <Users className="h-3.5 w-3.5" />,
};

const typeLabels = {
    call: "Ligação",
    message: "Mensagem",
    email: "E-mail",
    meeting: "Reunião",
};

export const FollowUpList = ({ followUps, onComplete, onDelete }: FollowUpListProps) => {
    const pendingFollowUps = followUps.filter((f) => !f.completed);

    if (pendingFollowUps.length === 0) {
        return (
            <div className="text-center py-4 text-muted-foreground">
                <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhum follow-up agendado</p>
            </div>
        );
    }

    const getDateLabel = (date: Date) => {
        if (isToday(date)) return "Hoje";
        if (isTomorrow(date)) return "Amanhã";
        return format(date, "dd/MM", { locale: ptBR });
    };

    const getUrgencyClass = (date: Date, time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        const scheduledTime = new Date(date);
        scheduledTime.setHours(hours, minutes, 0, 0);

        if (isPast(scheduledTime)) {
            return "border-destructive/50 bg-destructive/10";
        }
        if (isToday(date)) {
            return "border-yellow-500/50 bg-yellow-500/10";
        }
        return "border-border bg-secondary/30";
    };

    return (
        <div className="space-y-2">
            {pendingFollowUps.map((followUp) => {
                const isOverdue = isPast(
                    new Date(
                        followUp.date.getFullYear(),
                        followUp.date.getMonth(),
                        followUp.date.getDate(),
                        parseInt(followUp.time.split(":")[0]),
                        parseInt(followUp.time.split(":")[1])
                    )
                );

                return (
                    <div
                        key={followUp.id}
                        className={cn(
                            "p-3 rounded-lg border transition-all",
                            getUrgencyClass(followUp.date, followUp.time)
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                                        isOverdue
                                            ? "bg-destructive/20 text-destructive"
                                            : "bg-primary/20 text-primary"
                                    )}>
                                        {typeIcons[followUp.type]}
                                        {typeLabels[followUp.type]}
                                    </span>
                                    {isOverdue && (
                                        <span className="flex items-center gap-1 text-xs text-destructive">
                                            <AlertCircle className="h-3 w-3" />
                                            Atrasado
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span className={cn(isToday(followUp.date) && "text-yellow-600 dark:text-yellow-400 font-medium")}>
                                        {getDateLabel(followUp.date)} às {followUp.time}
                                    </span>
                                </div>

                                {followUp.note && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {followUp.note}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40"
                                    onClick={() => onComplete(followUp.id)}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onDelete(followUp.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

import { useEffect, useState } from "react";
import { isToday } from "date-fns";
import { Bell, X, Phone, MessageSquare, Mail, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FollowUp } from "./FollowUpScheduler";

interface FollowUpReminderProps {
    followUps: FollowUp[];
    onDismiss: (id: string) => void;
    onGoToLead: (leadId: string) => void;
}

const typeIcons = {
    call: <Phone className="h-4 w-4" />,
    message: <MessageSquare className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    meeting: <Users className="h-4 w-4" />,
};

export const FollowUpReminder = ({ followUps, onDismiss, onGoToLead }: FollowUpReminderProps) => {
    const [visibleReminders, setVisibleReminders] = useState<FollowUp[]>([]);

    useEffect(() => {
        // Filter follow-ups that are due today and not completed
        const todayFollowUps = followUps.filter(
            (f) => !f.completed && isToday(f.date)
        );
        setVisibleReminders(todayFollowUps);
    }, [followUps]);

    if (visibleReminders.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
            {visibleReminders.slice(0, 3).map((reminder, index) => (
                <div
                    key={reminder.id}
                    className={cn(
                        "bg-card border border-primary/30 rounded-lg shadow-lg p-4 animate-fade-in",
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                            <Bell className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-foreground text-sm">
                                    Lembrete de Follow-up
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground hover:text-foreground"
                                    onClick={() => onDismiss(reminder.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <span className="flex items-center gap-1.5 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    {typeIcons[reminder.type]}
                                    {reminder.time}
                                </span>
                            </div>

                            <p className="text-sm text-foreground font-medium mb-1">
                                {reminder.leadName}
                            </p>

                            {reminder.note && (
                                <p className="text-xs text-muted-foreground truncate mb-2">
                                    {reminder.note}
                                </p>
                            )}

                            <Button
                                size="sm"
                                className="w-full gap-2 mt-1"
                                onClick={() => {
                                    onGoToLead(reminder.leadId);
                                    onDismiss(reminder.id);
                                }}
                            >
                                Ir para conversa
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}

            {visibleReminders.length > 3 && (
                <div className="text-center text-xs text-muted-foreground bg-card/80 rounded-lg p-2 border border-border">
                    +{visibleReminders.length - 3} lembretes pendentes
                </div>
            )}
        </div>
    );
};

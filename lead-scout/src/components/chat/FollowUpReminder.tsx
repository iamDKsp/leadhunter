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
    onComplete: (id: string) => void;
}

const typeIcons: Record<string, JSX.Element> = {
    call: <Phone className="h-4 w-4" />,
    message: <MessageSquare className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    meeting: <Users className="h-4 w-4" />,
};

export const FollowUpReminder = ({ followUps, onDismiss, onGoToLead, onComplete }: FollowUpReminderProps) => {
    const [visibleReminders, setVisibleReminders] = useState<FollowUp[]>([]);

    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            // Logic: Show tasks due today that are NOT completed.
            // We use the 'date' field which should be a Date object.

            const dueTasks = followUps.filter(f => {
                if (f.completed) return false;

                let taskDate = f.date;
                // Ensure it is a Date object
                if (!(taskDate instanceof Date)) {
                    taskDate = new Date(taskDate);
                }

                if (!Number.isNaN(taskDate.getTime())) {
                    return isToday(taskDate);
                }
                return false;
            });

            setVisibleReminders(dueTasks);
        };

        checkReminders(); // Initial check

        // Check every 10 minutes (600000 ms)
        const interval = setInterval(checkReminders, 600000);

        return () => clearInterval(interval);
    }, [followUps]);

    if (visibleReminders.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm pointer-events-none">
            {/* Use pointer-events-auto on children so clicks work but container passes through if empty areas */}
            {visibleReminders.slice(0, 3).map((reminder, index) => {
                // Format time from Date object
                let timeString = "00:00";
                let taskDate = reminder.date;
                if (!(taskDate instanceof Date)) {
                    taskDate = new Date(taskDate);
                }

                if (!Number.isNaN(taskDate.getTime())) {
                    timeString = taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                return (
                    <div
                        key={reminder.id}
                        className={cn(
                            "bg-card border border-primary/30 rounded-lg shadow-lg p-4 animate-fade-in pointer-events-auto",
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
                                        className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                        title="Concluir"
                                        onClick={() => onComplete(reminder.id)}
                                    >
                                        <div className="h-3 w-3 border-2 border-current rounded-full" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => onDismiss(reminder.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center gap-1.5 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize">
                                        {typeIcons[reminder.type] || <Bell className="h-3 w-3" />}
                                        <span className="capitalize">
                                            {reminder.type === 'call' ? 'Ligação' :
                                                reminder.type === 'message' ? 'Mensagem' :
                                                    reminder.type === 'email' ? 'Email' :
                                                        reminder.type === 'meeting' ? 'Reunião' : 'Geral'}
                                        </span>
                                        <span className="mx-1">•</span>
                                        {timeString}
                                    </span>
                                </div>

                                <p className="text-sm text-foreground font-medium mb-1 truncate">
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
                )
            })}

            {visibleReminders.length > 3 && (
                <div className="text-center text-xs text-muted-foreground bg-card/80 rounded-lg p-2 border border-border pointer-events-auto">
                    +{visibleReminders.length - 3} lembretes pendentes
                </div>
            )}
        </div>
    );
};

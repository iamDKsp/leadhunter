import { CheckCircle2, Circle, Clock, AlertCircle, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
    id: string;
    title: string;
    leadName: string;
    dueDate: string;
    priority: "high" | "medium" | "low";
    completed: boolean;
}

interface PendingTasksCardProps {
    tasks: Task[];
    onToggleTask?: (taskId: string) => void;
}

const PendingTasksCard = ({ tasks, onToggleTask }: PendingTasksCardProps) => {
    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case "high":
                return "border-l-red-500 text-red-500";
            case "medium":
                return "border-l-yellow-500 text-yellow-500";
            default:
                return "border-l-primary text-primary";
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "high":
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case "medium":
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <Circle className="w-4 h-4 text-primary" />;
        }
    };

    const pendingTasks = tasks.filter(t => !t.completed);
    const completedToday = tasks.filter(t => t.completed).length;

    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                        <ListTodo className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Tarefas Pendentes</h3>
                        <p className="text-sm text-muted-foreground">
                            {pendingTasks.length} pendentes • {completedToday} concluídas hoje
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {pendingTasks.slice(0, 5).map((task) => (
                    <div
                        key={task.id}
                        className={cn(
                            "flex items-start gap-3 p-4 rounded-lg bg-background/50 border-l-4 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer group",
                            getPriorityStyles(task.priority)
                        )}
                    >
                        <button
                            className="mt-0.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                            onClick={() => onToggleTask?.(task.id)}
                        >
                            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {task.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Lead: {task.leadName}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{task.dueDate}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs">
                                    {getPriorityIcon(task.priority)}
                                    <span className="capitalize">
                                        {task.priority === 'high' ? 'Urgente' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {pendingTasks.length > 5 && (
                <button className="w-full mt-4 py-3 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                    Ver todas as {pendingTasks.length} tarefas →
                </button>
            )}

            {pendingTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                    <p className="text-foreground font-medium">Tudo em dia!</p>
                    <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente</p>
                </div>
            )}
        </div>
    );
};

export default PendingTasksCard;

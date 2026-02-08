import { Target, Phone, Calendar, ShoppingCart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Goal {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    icon: "leads" | "calls" | "meetings" | "sales";
}

interface WeeklyGoalsCardProps {
    goals: Goal[];
}

const WeeklyGoalsCard = ({ goals }: WeeklyGoalsCardProps) => {
    const getIcon = (iconType: string) => {
        switch (iconType) {
            case "leads":
                return <Target className="w-4 h-4" />;
            case "calls":
                return <Phone className="w-4 h-4" />;
            case "meetings":
                return <Calendar className="w-4 h-4" />;
            case "sales":
                return <ShoppingCart className="w-4 h-4" />;
            default:
                return <Target className="w-4 h-4" />;
        }
    };

    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Metas da Semana</h3>
                    <p className="text-sm text-muted-foreground">Seu progresso semanal</p>
                </div>
            </div>

            <div className="space-y-4">
                {goals.map((goal) => {
                    const progress = Math.min((goal.current / goal.target) * 100, 100);
                    const isComplete = goal.current >= goal.target;

                    return (
                        <div key={goal.id} className="p-4 rounded-lg bg-background/50 border border-border/30">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isComplete ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                                        {getIcon(goal.icon)}
                                    </div>
                                    <span className="font-medium text-foreground text-sm">{goal.title}</span>
                                </div>
                                <span className={`text-sm font-bold ${isComplete ? 'text-green-500' : 'text-foreground'}`}>
                                    {goal.current}/{goal.target}
                                </span>
                            </div>
                            <Progress value={progress} className={`h-2 ${isComplete ? '[&>div]:bg-green-500' : ''}`} />
                            {isComplete && (
                                <p className="text-xs text-green-500 mt-1 font-medium">✓ Meta atingida!</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklyGoalsCard;

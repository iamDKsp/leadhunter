import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: { value: number; isPositive: boolean };
    delay?: number;
}

const MetricCard = ({ title, value, icon: Icon, trend, delay = 0 }: MetricCardProps) => {
    return (
        <div
            className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-fade-in"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                {trend && (
                    <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        trend.isPositive
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                    )}>
                        {trend.isPositive ? "+" : "-"}{trend.value}%
                    </span>
                )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
    );
};

export default MetricCard;

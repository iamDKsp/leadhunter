import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StatusFilter = "all" | "online" | "away" | "offline";

interface MonitoringFiltersProps {
    statusFilter: StatusFilter;
    onStatusChange: (status: StatusFilter) => void;
    dateFrom?: Date;
    dateTo?: Date;
    onDateFromChange: (date: Date | undefined) => void;
    onDateToChange: (date: Date | undefined) => void;
    onClearFilters: () => void;
}

const MonitoringFilters = ({
    statusFilter,
    onStatusChange,
    onClearFilters,
}: MonitoringFiltersProps) => {
    const statusOptions: { value: StatusFilter; label: string }[] = [
        { value: "all", label: "Todos" },
        { value: "online", label: "Online" },
        { value: "away", label: "Ausentes" },
        { value: "offline", label: "Offline" },
    ];

    const hasActiveFilters = statusFilter !== "all";

    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Filtros:</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {statusOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onStatusChange(option.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                    statusFilter === option.value
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Limpar
                    </Button>
                )}
            </div>
        </div>
    );
};

export default MonitoringFilters;

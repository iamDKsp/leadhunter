import { BarChart3 } from "lucide-react";

interface PerformanceData {
    month: string;
    leads: number;
    conversions: number;
    value: number;
}

interface PerformanceChartProps {
    data: PerformanceData[];
}

const PerformanceChart = ({ data }: PerformanceChartProps) => {
    const maxLeads = Math.max(...data.map(d => d.leads), 1);
    const maxConversions = Math.max(...data.map(d => d.conversions), 1);

    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 animate-fade-in" style={{ animationDelay: "550ms" }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Performance Mensal</h3>
                    <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Leads</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">Conversões</span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-2 h-40">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end h-32">
                            {/* Leads bar */}
                            <div
                                className="flex-1 bg-primary/60 rounded-t transition-all hover:bg-primary"
                                style={{ height: `${(item.leads / maxLeads) * 100}%` }}
                                title={`${item.leads} leads`}
                            />
                            {/* Conversions bar */}
                            <div
                                className="flex-1 bg-green-500/60 rounded-t transition-all hover:bg-green-500"
                                style={{ height: `${(item.conversions / maxConversions) * 100}%` }}
                                title={`${item.conversions} conversões`}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">{item.month}</span>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-border/30 grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-lg font-bold text-foreground">
                        {data.reduce((acc, d) => acc + d.leads, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
                <div>
                    <p className="text-lg font-bold text-green-500">
                        {data.reduce((acc, d) => acc + d.conversions, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Conversões</p>
                </div>
                <div>
                    <p className="text-lg font-bold text-foreground">
                        R$ {(data.reduce((acc, d) => acc + d.value, 0)).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                </div>
            </div>
        </div>
    );
};

export default PerformanceChart;

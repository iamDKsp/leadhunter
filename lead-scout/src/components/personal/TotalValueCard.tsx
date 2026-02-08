import { DollarSign, TrendingUp, Users, Target } from "lucide-react";

interface TotalValueCardProps {
    totalValue: number;
    leadsCount: number;
    averageValue: number;
    conversionRate: number;
}

const TotalValueCard = ({ totalValue, leadsCount, averageValue, conversionRate }: TotalValueCardProps) => {
    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 animate-fade-in" style={{ animationDelay: "250ms" }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Valor Total</h3>
                    <p className="text-sm text-muted-foreground">Pipeline de vendas</p>
                </div>
            </div>

            <div className="text-center py-4 px-4 rounded-xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 mb-4">
                <p className="text-3xl font-bold text-green-500">
                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                    <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{leadsCount}</p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                    <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">R$ {averageValue.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">Ticket Médio</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                    <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">Conversão</p>
                </div>
            </div>
        </div>
    );
};

export default TotalValueCard;

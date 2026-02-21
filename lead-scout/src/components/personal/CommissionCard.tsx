import { Wallet, Award, TrendingUp, Gift } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CommissionCardProps {
    potentialValue: number;
    confirmedValue: number;
    completedSales: number;
    commissionRate?: number;
    bonusRate?: number;
    salesForBonus?: number;
}

const CommissionCard = ({
    potentialValue,
    confirmedValue,
    completedSales,
    commissionRate = 15,
    bonusRate = 15,
    salesForBonus = 5,
}: CommissionCardProps) => {
    // Bonus: at every 5th sale, you earn +15% on that sale (totaling 30%)
    // The bonus is applied to the confirmed value of qualifying sales
    const bonusMultiplier = Math.floor(completedSales / salesForBonus);
    const hasBonusActive = bonusMultiplier > 0;

    // Base commission: 15% of confirmed value
    const baseCommission = (confirmedValue * commissionRate) / 100;

    // Potential commission: 15% of total potential value
    const potentialCommission = (potentialValue * commissionRate) / 100;

    // Bonus commission: the extra 15% earned on qualifying milestone sales
    const bonusCommission = hasBonusActive ? (confirmedValue * bonusRate) / 100 : 0;

    const totalCommission = baseCommission + bonusCommission;
    const effectiveRate = hasBonusActive ? commissionRate + bonusRate : commissionRate;

    const progressToNextBonus = (completedSales % salesForBonus) / salesForBonus * 100;
    const salesUntilNextBonus = salesForBonus - (completedSales % salesForBonus);

    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 animate-fade-in" style={{ animationDelay: "450ms" }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Sua Comissão</h3>
                    <p className="text-sm text-muted-foreground">Ganhos baseados em performance</p>
                </div>
            </div>

            {/* Main Commission Display */}
            <div className="text-center py-6 px-4 rounded-xl bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/20 mb-6">
                <p className="text-sm text-muted-foreground mb-2">Comissão Confirmada</p>
                <p className="text-4xl font-bold text-yellow-500">
                    R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3 text-green-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Taxa efetiva: {effectiveRate}%</span>
                </div>
            </div>

            {/* Commission Breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">Em Potencial ({commissionRate}%)</span>
                    </div>
                    <p className="text-xl font-bold text-yellow-500">
                        R$ {potentialCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Prevista ({commissionRate}%)</span>
                    </div>
                    <p className="text-xl font-bold text-green-500">
                        R$ {baseCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Bonus Progress */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Próximo Bônus</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {completedSales} vendas fechadas
                    </span>
                </div>

                <Progress value={progressToNextBonus} className="h-2 mb-2" />

                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        Faltam <span className="text-primary font-semibold">{salesUntilNextBonus}</span> vendas
                    </span>
                    <span className="text-green-500 font-medium">
                        +{bonusRate}% de bônus
                    </span>
                </div>

                {bonusMultiplier > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                                {Array.from({ length: Math.min(bonusMultiplier, 5) }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-6 h-6 rounded-full bg-green-500/20 border-2 border-background flex items-center justify-center"
                                    >
                                        <Award className="w-3 h-3 text-green-500" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-green-500 font-medium">
                                {bonusMultiplier} bônus conquistado{bonusMultiplier > 1 ? 's' : ''}! (+{bonusMultiplier * bonusRate}%)
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommissionCard;

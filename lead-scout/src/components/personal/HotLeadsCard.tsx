import { Flame, Phone, MapPin, TrendingUp } from "lucide-react";

interface HotLead {
    id: string;
    name: string;
    category: string;
    phone: string;
    address?: string;
    score: number;
    value: number;
}

interface HotLeadsCardProps {
    leads: HotLead[];
}

const HotLeadsCard = ({ leads }: HotLeadsCardProps) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500 bg-green-500/10";
        if (score >= 60) return "text-yellow-500 bg-yellow-500/10";
        return "text-orange-500 bg-orange-500/10";
    };

    return (
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Leads Quentes</h3>
                    <p className="text-sm text-muted-foreground">Maior chance de conversão</p>
                </div>
            </div>

            <div className="space-y-3">
                {leads.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhum lead quente no momento</p>
                ) : (
                    leads.map((lead) => (
                        <div
                            key={lead.id}
                            className="p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                        {lead.name}
                                    </h4>
                                    <span className="text-xs text-primary/80 uppercase font-medium">{lead.category}</span>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-sm font-bold ${getScoreColor(lead.score)}`}>
                                    {lead.score}%
                                </div>
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                                {lead.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5" />
                                        <span className="truncate">{lead.phone}</span>
                                    </div>
                                )}
                                {lead.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="truncate">{lead.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                                <div className="flex items-center gap-2 text-green-500">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        R$ {lead.value.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HotLeadsCard;

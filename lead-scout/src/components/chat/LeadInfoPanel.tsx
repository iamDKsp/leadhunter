import { Conversation } from "./ConversationItem";
import {
    Phone,
    MapPin,
    Building2,
    Flame,
    ThermometerSun,
    Snowflake,
    Calendar,
    DollarSign,
    Tag,
    ExternalLink,
    Bell,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FollowUpList } from "./FollowUpList";
import { FollowUp } from "./FollowUpScheduler";

interface LeadInfoPanelProps {
    conversation: Conversation;
    followUps: FollowUp[];
    onScheduleFollowUp: () => void;
    onCompleteFollowUp: (id: string) => void;
    onDeleteFollowUp: (id: string) => void;
}

const statusConfig = {
    hot: {
        icon: <Flame className="h-4 w-4" />,
        label: "Lead Quente",
        color: "text-orange-500",
        bg: "bg-orange-500/10"
    },
    warm: {
        icon: <ThermometerSun className="h-4 w-4" />,
        label: "Lead Morno",
        color: "text-yellow-500",
        bg: "bg-yellow-500/10"
    },
    cold: {
        icon: <Snowflake className="h-4 w-4" />,
        label: "Lead Frio",
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
};

export const LeadInfoPanel = ({
    conversation,
    followUps,
    onScheduleFollowUp,
    onCompleteFollowUp,
    onDeleteFollowUp
}: LeadInfoPanelProps) => {
    const status = statusConfig[conversation.status];
    const leadFollowUps = followUps.filter(f => f.leadId === conversation.id);

    return (
        <div className="w-72 h-full bg-card/90 backdrop-blur-xl border-l border-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/30 mb-3">
                    <span className="text-3xl font-bold text-primary">
                        {conversation.leadName.charAt(0).toUpperCase()}
                    </span>
                </div>
                <h3 className="font-semibold text-foreground text-lg">
                    {conversation.leadName}
                </h3>
                <p className="text-sm text-primary font-medium">
                    {conversation.businessName}
                </p>

                <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
                    {status.icon}
                    <span className="text-sm font-medium">{status.label}</span>
                </div>
            </div>

            {/* Info Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {/* Follow-ups Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Bell className="h-3.5 w-3.5" />
                            Follow-ups
                        </h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                            onClick={onScheduleFollowUp}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Agendar
                        </Button>
                    </div>

                    <FollowUpList
                        followUps={leadFollowUps}
                        onComplete={onCompleteFollowUp}
                        onDelete={onDeleteFollowUp}
                    />
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Informações de Contato
                    </h4>

                    <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{conversation.phone}</span>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">Av. Jorge Zaiden, 12100 - Jardim Marambá, Bauru - SP</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-foreground">Serviços</span>
                    </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Métricas do Lead
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-secondary/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="text-xs">Primeiro Contato</span>
                            </div>
                            <p className="text-sm font-medium text-foreground">15 Jan 2025</p>
                        </div>

                        <div className="bg-secondary/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="text-xs">Valor Potencial</span>
                            </div>
                            <p className="text-sm font-medium text-primary">R$ 15.000</p>
                        </div>
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Tag className="h-3.5 w-3.5" />
                            <span className="text-xs">Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Interessado</span>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Google Maps</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border space-y-2">
                <Button className="w-full gap-2" variant="default">
                    <Phone className="h-4 w-4" />
                    Ligar Agora
                </Button>
                <Button className="w-full gap-2" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                    Ver Perfil Completo
                </Button>
            </div>
        </div>
    );
};

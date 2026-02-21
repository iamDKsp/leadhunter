import { Conversation } from "./ConversationItem";
import { Lead } from "@/types/lead";
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
    Plus,
    MessageCircle,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FollowUpList } from "./FollowUpList";
import { FollowUp } from "./FollowUpScheduler";
// ... imports
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface LeadInfoPanelProps {
    conversation: Conversation;
    lead?: Lead;
    followUps: FollowUp[];
    userId?: string;
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
    lead,
    followUps,
    onScheduleFollowUp,
    onCompleteFollowUp,
    onDeleteFollowUp
}: LeadInfoPanelProps) => {
    const navigate = useNavigate();
    const status = statusConfig[conversation.status];
    const [showAllTasks, setShowAllTasks] = useState(false);

    // Assuming we have userId in local storage or context (simplifying for now)
    // In a real app we'd decode the token or use a context hook.
    // For now, let's just add the toggle UI.

    const leadFollowUps = followUps.filter(f => f.leadId === conversation.id);
    // Filter logic would go here if we had userId in the task object
    // const displayedTasks = showAllTasks ? leadFollowUps : leadFollowUps.filter(t => t.userId === currentUserId);
    const displayedTasks = leadFollowUps;


    const handleCall = () => {
        const phone = lead?.phone || conversation.phone;
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
    };

    const handleViewProfile = async () => {
        if (lead) {
            navigate('/crm');
        } else {
            try {
                toast({ title: "Criando Card", description: "Aguarde enquanto criamos o card..." });

                const cleanPhone = conversation.phone.replace(/\D/g, '');
                const newLeadData = {
                    name: conversation.leadName,
                    phone: conversation.phone, // Keep original format or use clean? Keeping original often better for display
                    email: "",
                    type: 'outros',
                    activityBranch: 'servicos',
                    size: 'pequeno',
                    contacted: true,
                    successChance: 10,
                    tags: ['Chat'],
                    comments: `Card criado automaticamente via Chat em ${new Date().toLocaleDateString()}`
                };

                await api.companies.create(newLeadData);

                toast({ title: "Sucesso", description: "Card criado! Redirecionando..." });

                // Navigate to CRM
                navigate('/crm');

            } catch (error) {
                console.error("Erro ao criar lead:", error);
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Não foi possível criar o card automaticamente."
                });
            }
        }
    };

    return (
        <div className="w-72 h-full bg-card/90 backdrop-blur-xl border-l border-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border text-center">
                <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/30 mb-3">
                    {conversation.avatar || (lead && lead.photoUrl) ? (
                        <img
                            src={conversation.avatar || lead?.photoUrl}
                            alt={lead?.name || conversation.leadName}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-3xl font-bold text-primary">
                            {(lead?.name || conversation.leadName).charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <h3 className="font-semibold text-foreground text-lg">
                    {lead?.name || conversation.leadName}
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
                            Tarefas
                        </h4>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 ${showAllTasks ? 'text-primary' : 'text-muted-foreground'}`}
                                onClick={() => setShowAllTasks(!showAllTasks)}
                                title={showAllTasks ? "Vendo todas as tarefas" : "Vendo apenas minhas tarefas"}
                            >
                                <Filter className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                                onClick={onScheduleFollowUp}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Nova
                            </Button>
                        </div>
                    </div>

                    <FollowUpList
                        followUps={displayedTasks}
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
                        <span className="text-foreground">{lead?.phone || conversation.phone}</span>
                    </div>

                    {lead?.address && (
                        <div className="flex items-start gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{lead.address}</span>
                        </div>
                    )}

                    {lead?.email && (
                        <div className="flex items-start gap-3 text-sm">
                            <Building2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-foreground truncate">{lead.email}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3 text-sm">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-foreground capitalize">{lead?.activityBranch || 'Serviços'}</span>
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
                            <p className="text-sm font-medium text-foreground">
                                {lead?.createdAt
                                    ? format(new Date(lead.createdAt), "dd MMM yyyy", { locale: ptBR })
                                    : "N/A"
                                }
                            </p>
                        </div>

                        <div className="bg-secondary/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="text-xs">Valor Potencial</span>
                            </div>
                            <p className="text-sm font-medium text-primary">
                                {lead?.value
                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)
                                    : "R$ 0,00"
                                }
                            </p>
                        </div>
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Tag className="h-3.5 w-3.5" />
                            <span className="text-xs">Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {lead?.tags && lead.tags.length > 0 ? (
                                lead.tags.map((tag, i) => (
                                    <span key={i} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground">Sem tags</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border space-y-2">
                <Button className="w-full gap-2" variant="default" onClick={handleCall}>
                    <MessageCircle className="h-4 w-4" />
                    Enviar WhatsApp
                </Button>
                <Button className="w-full gap-2" variant="outline" onClick={handleViewProfile}>
                    <ExternalLink className="h-4 w-4" />
                    Ver Perfil Completo
                </Button>
            </div>
        </div>
    );
};

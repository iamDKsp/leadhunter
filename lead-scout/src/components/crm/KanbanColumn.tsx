import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Lead, Stage } from '@/types/lead';
import KanbanCard from './KanbanCard';
import { MoreVertical, Plus, Copy, Settings2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatStageLeadsForWhatsApp, copyToClipboard } from '@/utils/leadExport';
import { toast } from 'sonner';

interface KanbanColumnProps {
    stage: Stage;
    leads: Lead[];
    stages: Stage[];
    onEditStage: (stage: Stage) => void;
    onViewLead: (lead: Lead) => void;
    onAssignLead?: (lead: Lead) => void;
    onAddStage: (stageId: string) => void;
    onLeadStageAdvance?: (leadId: string, newStageId: string) => void;
}

const KanbanColumn = ({ stage, leads, stages, onEditStage, onViewLead, onAssignLead, onAddStage, onLeadStageAdvance }: KanbanColumnProps) => {
    const handleCopyLeads = async () => {
        if (!leads || leads.length === 0) {
            toast.info(`Nenhum lead na etapa "${stage.name}" para copiar.`);
            return;
        }

        try {
            const text = formatStageLeadsForWhatsApp(stage.name, leads);
            const success = await copyToClipboard(text);
            if (success) {
                toast.success(`${leads.length} lead${leads.length > 1 ? 's' : ''} copiado${leads.length > 1 ? 's' : ''}! Pronto para colar no WhatsApp.`);
            } else {
                toast.error('Não foi possível copiar os leads.');
            }
        } catch (error) {
            console.error('Erro ao copiar leads:', error);
            toast.error('Erro ao copiar leads da etapa.');
        }
    };

    return (
        <div className="flex-shrink-0 w-[85vw] sm:w-80 bg-card/40 border border-border/30 rounded-xl flex flex-col max-h-full snap-center md:snap-align-none">
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-foreground">{stage.name}</h3>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {leads.length} leads
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 ml-1">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                leads.reduce((sum, lead) => sum + (lead.value || 0), 0)
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onAddStage(stage.id)}
                        className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        title="Adicionar nova etapa"
                    >
                        <Plus className="w-4 h-4" />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all outline-none"
                                title="Opções da etapa"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 bg-card/95 backdrop-blur border-border/50 shadow-lg">
                            <DropdownMenuItem
                                onClick={handleCopyLeads}
                                className="cursor-pointer flex items-center gap-2 text-xs py-2 text-foreground focus:bg-primary/10 focus:text-primary"
                            >
                                <Copy className="w-3.5 h-3.5 text-primary" />
                                <span>Copiar leads (WhatsApp)</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onEditStage(stage)}
                                className="cursor-pointer flex items-center gap-2 text-xs py-2 text-muted-foreground focus:text-foreground"
                            >
                                <Settings2 className="w-3.5 h-3.5" />
                                <span>Editar etapa</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Cards */}
            <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''
                            }`}
                    >
                        {leads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    >
                                        <KanbanCard
                                            lead={lead}
                                            isDragging={snapshot.isDragging}
                                            onView={() => onViewLead(lead)}
                                            onAssign={onAssignLead ? () => onAssignLead(lead) : undefined}
                                            stages={stages}
                                            onLeadStageAdvance={onLeadStageAdvance}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default KanbanColumn;

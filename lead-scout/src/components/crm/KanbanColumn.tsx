import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Lead, Stage } from '@/types/lead';
import KanbanCard from './KanbanCard';
import { MoreVertical, Plus } from 'lucide-react';

interface KanbanColumnProps {
    stage: Stage;
    leads: Lead[];
    onEditStage: (stage: Stage) => void;
    onViewLead: (lead: Lead) => void;
    onAssignLead?: (lead: Lead) => void;
}

const KanbanColumn = ({ stage, leads, onEditStage, onViewLead, onAssignLead }: KanbanColumnProps) => {
    return (
        <div className="flex-shrink-0 w-80 bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl flex flex-col max-h-full">
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-foreground">{stage.name}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {leads.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEditStage(stage)}
                        className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
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

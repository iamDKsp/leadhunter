import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Lead, Stage } from '@/types/lead';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
    leads: Lead[];
    stages: Stage[];
    onLeadMove: (leadId: string, newStageId: string, newIndex: number) => void;
    onEditStage: (stage: Stage) => void;
    onViewLead: (lead: Lead) => void;
    onAssignLead?: (lead: Lead) => void;
    onAddStage: (stageId: string) => void;
}

const KanbanBoard = ({ leads, stages, onLeadMove, onEditStage, onViewLead, onAssignLead, onAddStage }: KanbanBoardProps) => {
    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        onLeadMove(draggableId, destination.droppableId, destination.index);
    };

    const sortedStages = [...stages].sort((a, b) => a.order - b.order);

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
                {sortedStages.map((stage) => (
                    <KanbanColumn
                        key={stage.id}
                        stage={stage}
                        leads={leads.filter((lead) => (lead.stageId || 'prospeccao') === stage.id)}
                        onEditStage={onEditStage}
                        onViewLead={onViewLead}
                        onAssignLead={onAssignLead}
                        onAddStage={onAddStage}
                    />
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard;

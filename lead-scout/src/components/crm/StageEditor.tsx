import { useState } from 'react';
import { Stage } from '@/types/lead';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface StageEditorProps {
    open: boolean;
    onClose: () => void;
    stages: Stage[];
    onSave: (stages: Stage[]) => void;
}

const PRESET_COLORS = [
    '#3b82f6', // blue
    '#22d3ee', // cyan
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
];

const StageEditor = ({ open, onClose, stages, onSave }: StageEditorProps) => {
    const [localStages, setLocalStages] = useState<Stage[]>(stages);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(localStages);
        const [reordered] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reordered);

        // Update order values
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index,
        }));

        setLocalStages(updatedItems);
    };

    const handleAddStage = () => {
        const newStage: Stage = {
            id: `stage-${Date.now()}`,
            name: 'Nova Etapa',
            color: PRESET_COLORS[localStages.length % PRESET_COLORS.length],
            order: localStages.length,
        };
        setLocalStages([...localStages, newStage]);
    };

    const handleRemoveStage = (id: string) => {
        if (localStages.length <= 1) return;
        setLocalStages(localStages.filter(s => s.id !== id));
    };

    const handleUpdateStage = (id: string, updates: Partial<Stage>) => {
        setLocalStages(localStages.map(s =>
            s.id === id ? { ...s, ...updates } : s
        ));
    };

    const handleSave = () => {
        onSave(localStages);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border/30 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Personalizar Etapas do Funil</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="stages">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="space-y-2"
                                >
                                    {localStages.map((stage, index) => (
                                        <Draggable key={stage.id} draggableId={stage.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3"
                                                >
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="text-muted-foreground hover:text-foreground cursor-grab"
                                                    >
                                                        <GripVertical className="w-4 h-4" />
                                                    </div>

                                                    <div className="flex-1 flex items-center gap-3">
                                                        <div className="relative">
                                                            <input
                                                                type="color"
                                                                value={stage.color}
                                                                onChange={(e) => handleUpdateStage(stage.id, { color: e.target.value })}
                                                                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                            />
                                                        </div>
                                                        <Input
                                                            value={stage.name}
                                                            onChange={(e) => handleUpdateStage(stage.id, { name: e.target.value })}
                                                            className="flex-1 bg-background/50 border-border/30"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveStage(stage.id)}
                                                        disabled={localStages.length <= 1}
                                                        className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    <button
                        onClick={handleAddStage}
                        className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border/50 rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Etapa
                    </button>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StageEditor;

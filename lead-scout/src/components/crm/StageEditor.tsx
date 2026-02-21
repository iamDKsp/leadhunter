import { useState, useEffect } from 'react';
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

    useEffect(() => {
        setLocalStages(stages);
    }, [stages, open]);

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
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="bg-card border-border/30 max-w-2xl w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="text-foreground text-xl">Personalizar Etapas do Funil</DialogTitle>
                </DialogHeader>

                <div className="py-6">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="stages" direction="horizontal">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                >
                                    {localStages.map((stage, index) => (
                                        <Draggable key={stage.id} draggableId={stage.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="bg-card border border-border/50 rounded-xl p-3 shadow-sm group hover:border-primary/30 transition-all"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-secondary"
                                                        >
                                                            <GripVertical className="w-4 h-4" />
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveStage(stage.id)}
                                                            disabled={localStages.length <= 1}
                                                            className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors disabled:opacity-30"
                                                            title="Remover etapa"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={stage.color}
                                                                onChange={(e) => handleUpdateStage(stage.id, { color: e.target.value })}
                                                                className="w-8 h-8 rounded-md cursor-pointer border border-border/50 p-0.5 bg-background flex-shrink-0"
                                                            />
                                                            <Input
                                                                value={stage.name}
                                                                onChange={(e) => handleUpdateStage(stage.id, { name: e.target.value })}
                                                                className="flex-1 bg-background/50 border-border/30 focus:bg-background h-8 text-sm"
                                                                placeholder="Nome da etapa"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* Add Button as a card at the end */}
                                    <button
                                        onClick={handleAddStage}
                                        className="border-2 border-dashed border-border/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all min-h-[100px]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-sm">Adicionar</span>
                                    </button>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                <DialogFooter className="border-t border-border/30 pt-4">
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

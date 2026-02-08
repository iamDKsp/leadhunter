import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lead, Stage } from '@/types/lead';
import KanbanBoard from '@/components/crm/KanbanBoard';
import LeadsTable from '@/components/crm/LeadsTable';
import StageEditor from '@/components/crm/StageEditor';
import LeadFormModal from '@/components/crm/LeadFormModal';
import { LeadAssignmentModal } from '@/components/LeadAssignmentModal';
import { LayoutGrid, List, Settings2, Search, Filter, Plus } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const defaultStages: Stage[] = [
    { id: 'prospeccao', name: 'Prospecção', color: '#3b82f6', order: 0 },
    { id: 'abordagem', name: 'Abordagem', color: '#22d3ee', order: 1 },
    { id: 'apresentacao', name: 'Apresentação', color: '#f59e0b', order: 2 },
    { id: 'fechamento', name: 'Fechamento', color: '#10b981', order: 3 },
];

type ViewMode = 'kanban' | 'list';


const LeadsCRM = () => {
    const { leads, addLead, updateLead, deleteLead, refresh } = useLeads();
    const isMobile = useIsMobile();

    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return window.innerWidth < 768 ? 'list' : 'kanban';
    });

    const [stages, setStages] = useState<Stage[]>(defaultStages);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageEditorOpen, setStageEditorOpen] = useState(false);
    const [leadFormOpen, setLeadFormOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    // Lead assignment state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assigningLead, setAssigningLead] = useState<Lead | null>(null);

    const filteredLeads = leads.filter(lead => {
        const searchLower = searchQuery.toLowerCase();
        const tagsArray = Array.isArray((lead as any).tags) ? (lead as any).tags : [];
        return (
            lead.name.toLowerCase().includes(searchLower) ||
            tagsArray.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
            (lead.phone || '').includes(searchQuery)
        );
    });

    const handleLeadMove = (leadId: string, newStageId: string, newIndex: number) => {
        updateLead(leadId, { stageId: newStageId });
    };

    const handleSaveStages = (newStages: Stage[]) => {
        setStages(newStages);
    };

    const handleViewLead = (lead: Lead) => {
        setEditingLead(lead);
        setLeadFormOpen(true);
    };

    const handleEditLead = (lead: Lead) => {
        setEditingLead(lead);
        setLeadFormOpen(true);
    };

    const handleDeleteLead = (lead: Lead) => {
        if (confirm('Tem certeza que deseja excluir este lead?')) {
            deleteLead(lead.id);
            toast.success('Lead excluído');
        }
    };

    const handleSaveLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'folderId'> & { id?: string }) => {
        if (leadData.id) {
            updateLead(leadData.id, leadData);
            toast.success('Lead atualizado');
        } else {
            addLead(leadData);
            toast.success('Lead criado');
        }
        setEditingLead(null);
    };

    const handleOpenNewLead = () => {
        setEditingLead(null);
        setLeadFormOpen(true);
    };

    const handleAssignLead = (lead: Lead) => {
        setAssigningLead(lead);
        setAssignModalOpen(true);
    };

    return (
        <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-card/60 border-border/30"
                        />
                    </div>
                    <Button variant="outline" size="icon" className="border-border/30">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-card/60 border border-border/30 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === 'kanban'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === 'list'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            Lista
                        </button>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setStageEditorOpen(true)}
                        className="border-border/30"
                    >
                        <Settings2 className="w-4 h-4 mr-2" />
                        Etapas
                    </Button>

                    <Button onClick={handleOpenNewLead}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Lead
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'kanban' ? (
                    <KanbanBoard
                        leads={filteredLeads}
                        stages={stages}
                        onLeadMove={handleLeadMove}
                        onEditStage={() => setStageEditorOpen(true)}
                        onViewLead={handleViewLead}
                        onAssignLead={handleAssignLead}
                    />
                ) : (
                    <div className="overflow-auto h-full">
                        <LeadsTable
                            leads={filteredLeads}
                            stages={stages}
                            onViewLead={handleViewLead}
                            onEditLead={handleEditLead}
                            onDeleteLead={handleDeleteLead}
                        />
                    </div>
                )}
            </div>

            <StageEditor
                open={stageEditorOpen}
                onClose={() => setStageEditorOpen(false)}
                stages={stages}
                onSave={handleSaveStages}
            />

            <LeadFormModal
                open={leadFormOpen}
                onClose={() => {
                    setLeadFormOpen(false);
                    setEditingLead(null);
                }}
                onSave={handleSaveLead}
                lead={editingLead}
                stages={stages}
            />

            <LeadAssignmentModal
                open={assignModalOpen}
                onOpenChange={setAssignModalOpen}
                leadId={assigningLead?.id}
                leadName={assigningLead?.name}
                currentResponsibleId={(assigningLead as any)?.responsibleId}
                onAssigned={() => {
                    refresh();
                    setAssigningLead(null);
                }}
            />
        </div>
    );
};

export default LeadsCRM;

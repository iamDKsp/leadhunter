import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lead, Stage } from '@/types/lead';
import KanbanBoard from '@/components/crm/KanbanBoard';
import KanbanCard from '@/components/crm/KanbanCard';
import LeadsTable from '@/components/crm/LeadsTable';
import StageEditor from '@/components/crm/StageEditor';
import LeadFormModal from '@/components/crm/LeadFormModal';
import { MobileStageTabs } from '@/components/crm/MobileStageTabs';
import { LeadAssignmentModal } from '@/components/LeadAssignmentModal';
import { LeadFilterModal, FilterState } from '@/components/crm/LeadFilterModal';
import { BulkActionsToolbar } from '@/components/crm/BulkActionsToolbar';
import { LayoutGrid, List, Settings2, Search, Filter, Plus } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { stages as stagesApi } from '@/services/api';
import { useEffect } from 'react';

const defaultStages: Stage[] = [
    { id: 'prospeccao', name: 'Prospecção', color: '#3b82f6', order: 0 },
    { id: 'abordagem', name: 'Abordagem', color: '#22d3ee', order: 1 },
    { id: 'apresentacao', name: 'Apresentação', color: '#f59e0b', order: 2 },
    { id: 'fechamento', name: 'Fechamento', color: '#10b981', order: 3 },
];

type ViewMode = 'kanban' | 'list';


import { User } from '@/types/auth'; // Import User type

interface LeadsCRMProps {
    user?: User | undefined;
}

const LeadsCRM = ({ user }: LeadsCRMProps) => {
    const {
        leads,
        addLead,
        updateLead,
        deleteLead,
        bulkAssignLeads,
        bulkMoveLeads,
        bulkDeleteLeads,
        refresh
    } = useLeads('ACTIVE');
    const isMobile = useIsMobile();

    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return window.innerWidth < 768 ? 'list' : 'kanban';
    });

    const [stages, setStages] = useState<Stage[]>(defaultStages);
    const [selectedMobileStageId, setSelectedMobileStageId] = useState<string>('prospeccao');

    // Load stages from API
    useEffect(() => {
        const loadStages = async () => {
            try {
                const fetchedStages = await stagesApi.getAll();
                if (fetchedStages && fetchedStages.length > 0) {
                    setStages(fetchedStages);
                    setSelectedMobileStageId(prev => fetchedStages.some(s => s.id === prev) ? prev : fetchedStages[0].id);
                }
            } catch (error) {
                console.error("Failed to load stages", error);
                // toast.error("Erro ao carregar etapas");
            }
        };
        loadStages();
    }, []);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageEditorOpen, setStageEditorOpen] = useState(false);
    const [leadFormOpen, setLeadFormOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    // Bulk Actions state
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

    const handleSelectLead = (leadId: string, selected: boolean) => {
        setSelectedLeads(prev =>
            selected ? [...prev, leadId] : prev.filter(id => id !== leadId)
        );
    };

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            setSelectedLeads(filteredLeads.map(l => l.id));
        } else {
            setSelectedLeads([]);
        }
    };

    // Lead assignment state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assigningLead, setAssigningLead] = useState<Lead | null>(null);

    // Filter state
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        stageId: 'all',
        responsibleId: 'all',
        successChanceMin: 0,
        hasWebsite: 'all'
    });

    const filteredLeads = leads.filter(lead => {
        const searchLower = searchQuery.toLowerCase();
        const tagsArray = Array.isArray((lead as any).tags) ? (lead as any).tags : [];
        const matchesSearch = (
            lead.name.toLowerCase().includes(searchLower) ||
            tagsArray.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
            (lead.phone || '').includes(searchQuery)
        );

        if (!matchesSearch) return false;

        // Apply filters
        if (activeFilters.stageId !== 'all' && lead.stageId !== activeFilters.stageId) return false;

        if (activeFilters.responsibleId !== 'all') {
            if (activeFilters.responsibleId === 'unassigned') {
                // Check if it has NO responsible assigned
                const responsible = (lead as any).responsible;
                const hasResponsible = responsible && responsible.id;
                if (hasResponsible) return false;
            } else {
                // Check specific responsible
                if ((lead as any).responsibleId !== activeFilters.responsibleId) return false;
            }
        }
        if (activeFilters.successChanceMin > 0 && (lead.successChance || 0) < activeFilters.successChanceMin) return false;
        if (activeFilters.hasWebsite !== 'all') {
            const hasWeb = !!lead.website && lead.website.trim() !== '';
            if (activeFilters.hasWebsite === true && !hasWeb) return false;
            if (activeFilters.hasWebsite === false && hasWeb) return false;
        }

        return true;
    });

    const handleLeadMove = (leadId: string, newStageId: string, newIndex: number) => {
        updateLead(leadId, { stageId: newStageId });
    };

    const handleSaveStages = async (newStages: Stage[]) => {
        try {
            // Optimistic update
            setStages(newStages);
            // Save to backend
            await stagesApi.saveAll(newStages);
            toast.success('Etapas salvas com sucesso!');
        } catch (error) {
            console.error("Failed to save stages", error);
            toast.error("Erro ao salvar etapas");
            // Revert on error? For now, we keep optimistic state but warn user.
        }
    };

    const handleAddStage = async (currentStageId: string) => {
        const currentStageIndex = stages.findIndex(s => s.id === currentStageId);
        if (currentStageIndex === -1) return;

        const newStage: Stage = {
            id: `stage-${Date.now()}`,
            name: 'Nova Etapa',
            color: '#94a3b8',
            order: currentStageIndex + 1
        };

        const newStages = [...stages];
        newStages.splice(currentStageIndex + 1, 0, newStage);

        // Reorder subsequent stages
        const reorderedStages = newStages.map((stage, index) => ({
            ...stage,
            order: index
        }));

        setStages(reorderedStages);
        await stagesApi.saveAll(reorderedStages);
        toast.success('Nova etapa criada');

        // Open editor for the new stage
        // Optional: Could set editing stage here if we had a way to open specific stage edit
        setStageEditorOpen(true);
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
            // No toast and no editingLead reset for auto-save
        } else {
            addLead(leadData);
            toast.success('Lead criado');
            setEditingLead(null);
        }
    };

    const handleOpenNewLead = () => {
        setEditingLead(null);
        setLeadFormOpen(true);
    };

    const handleAssignLead = (lead: Lead) => {
        setAssigningLead(lead);
        setAssignModalOpen(true);
    };

    const handleBulkAssign = async (userId: string) => {
        try {
            await bulkAssignLeads(selectedLeads, userId);
            toast.success(`${selectedLeads.length} leads atribuídos com sucesso!`);
            setSelectedLeads([]);
            refresh();
        } catch (error) {
            console.error(error);
        }
    };

    const handleBulkMove = async (stageId: string) => {
        try {
            await bulkMoveLeads(selectedLeads, stageId);
            toast.success(`${selectedLeads.length} leads movidos com sucesso!`);
            setSelectedLeads([]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleBulkDelete = async () => {
        try {
            await bulkDeleteLeads(selectedLeads);
            toast.success(`${selectedLeads.length} leads excluídos com sucesso!`);
            setSelectedLeads([]);
        } catch (error) {
            console.error(error);
        }
    };

    const hasManagePermissions = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.permissions?.canManageLeads;

    return (
        <div className="flex-1 overflow-hidden p-2 sm:p-4 md:p-6 flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[180px] sm:min-w-[200px] max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-card/60 border-border/30"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className={`border-border/30 ${activeFilters.stageId !== 'all' ||
                            activeFilters.responsibleId !== 'all' ||
                            activeFilters.successChanceMin > 0 ||
                            activeFilters.hasWebsite !== 'all'
                            ? 'text-primary border-primary' : ''
                            }`}
                        onClick={() => setFilterModalOpen(true)}
                    >
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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

                    <Button onClick={handleOpenNewLead} className="hidden md:inline-flex">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Lead
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {selectedLeads.length > 0 && viewMode === 'list' && (
                    <div className="mb-4">
                        <BulkActionsToolbar
                            selectedCount={selectedLeads.length}
                            stages={stages}
                            onClearSelection={() => setSelectedLeads([])}
                            onBulkAssign={handleBulkAssign}
                            onBulkMove={handleBulkMove}
                            onBulkDelete={handleBulkDelete}
                        />
                    </div>
                )}
                {viewMode === 'kanban' ? (
                    <>
                        {/* Desktop Multi-column Kanban */}
                        <div className="hidden md:block h-full">
                            <KanbanBoard
                                leads={filteredLeads}
                                stages={stages}
                                onLeadMove={handleLeadMove}
                                onEditStage={() => setStageEditorOpen(true)}
                                onViewLead={handleViewLead}
                                onAssignLead={handleAssignLead}
                                onAddStage={handleAddStage}
                                onLeadStageAdvance={(leadId, newStageId) => updateLead(leadId, { stageId: newStageId })}
                            />
                        </div>

                        {/* Mobile App-Style Tabbed Stage Feed */}
                        <div className="block md:hidden h-full flex flex-col overflow-hidden">
                            <MobileStageTabs
                                stages={stages}
                                leads={filteredLeads}
                                activeStageId={selectedMobileStageId}
                                onSelectStage={setSelectedMobileStageId}
                                onOpenNewLead={handleOpenNewLead}
                            />
                            <div className="flex-1 overflow-y-auto space-y-3 pb-24 custom-scrollbar px-0.5">
                                {(() => {
                                    const currentStageLeads = filteredLeads.filter(
                                        l => (l.stageId || 'prospeccao') === selectedMobileStageId
                                    );
                                    if (currentStageLeads.length === 0) {
                                        return (
                                            <div className="p-8 text-center bg-card/40 rounded-2xl border border-dashed border-border/40 mt-4 animate-fade-in">
                                                <p className="text-sm text-muted-foreground mb-3 font-medium">
                                                    Nenhum lead nesta etapa
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleOpenNewLead}
                                                    className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                                                >
                                                    <Plus className="w-4 h-4 mr-1.5" /> Adicionar Lead
                                                </Button>
                                            </div>
                                        );
                                    }
                                    return currentStageLeads.map(lead => (
                                        <KanbanCard
                                            key={lead.id}
                                            lead={lead}
                                            isDragging={false}
                                            onView={() => handleViewLead(lead)}
                                            onAssign={() => handleAssignLead(lead)}
                                            stages={stages}
                                            onLeadStageAdvance={(leadId, newStageId) => updateLead(leadId, { stageId: newStageId })}
                                        />
                                    ));
                                })()}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="overflow-auto h-full">
                        <LeadsTable
                            leads={filteredLeads}
                            stages={stages}
                            onViewLead={handleViewLead}
                            onEditLead={handleEditLead}
                            onDeleteLead={handleDeleteLead}
                            selectedLeads={selectedLeads}
                            onSelectLead={handleSelectLead}
                            onSelectAll={handleSelectAll}
                            selectionEnabled={hasManagePermissions}
                        />
                    </div>
                )}
            </div>

            {/* Mobile Floating Action Button (FAB) */}
            <button
                onClick={handleOpenNewLead}
                className="fixed bottom-20 right-4 z-30 md:hidden w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-[0_4px_25px_rgba(16,185,129,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label="Criar novo lead"
            >
                <Plus className="w-7 h-7" />
            </button>

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

            <LeadFilterModal
                open={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                onApply={setActiveFilters}
                currentFilters={activeFilters}
                stages={stages}
                user={user}
            />
        </div>
    );
};

export default LeadsCRM;

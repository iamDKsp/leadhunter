import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead } from '@/types/lead';
import { useLeads } from '@/hooks/useLeads';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';
import { SearchFilters, SearchFiltersState } from '@/components/SearchFilters';
import { LeadCard } from '@/components/LeadCard';
import { LeadModal } from '@/components/LeadModal';
import { Analytics } from '@/components/Analytics';
import { GoogleMapsSearch } from '@/components/GoogleMapsSearch';
import { WhatsAppDrawer } from '@/components/WhatsAppDrawer';
import { cn } from '@/lib/utils';
import { Users } from '@/components/Users';
import { Costs } from '@/components/Costs';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string, email: string } | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token) {
      navigate('/login');
    } else if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, [navigate]);

  const { leads, folders, addLead, updateLead, deleteLead, refresh } = useLeads();
  const [activeView, setActiveView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<SearchFiltersState>({
    searchTerm: '',
    type: 'all',
    size: 'all',
    activityBranch: 'all',
    contacted: 'all',
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<{ number: string, name: string } | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search term filter
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesSearch =
          (lead.name?.toLowerCase() || '').includes(term) ||
          (lead.email?.toLowerCase() || '').includes(term) ||
          (lead.phone?.includes(term) || false) ||
          (lead.location?.toLowerCase() || '').includes(term);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type !== 'all' && lead.type !== filters.type) return false;

      // Size filter
      if (filters.size !== 'all' && lead.size !== filters.size) return false;

      // Activity branch filter
      if (filters.activityBranch !== 'all' && lead.activityBranch !== filters.activityBranch) return false;

      // Contacted filter
      if (filters.contacted === 'yes' && !lead.contacted) return false;
      if (filters.contacted === 'no' && lead.contacted) return false;

      return true;
    });
  }, [leads, filters]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    toast.success('Logout realizado com sucesso!');
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleSaveLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingLead) {
      updateLead(editingLead.id, leadData);
      toast.success('Lead atualizado com sucesso!');
    } else {
      addLead(leadData);
      toast.success('Lead criado com sucesso!');
    }
  };

  const handleDeleteLead = (id: string) => {
    deleteLead(id);
    toast.success('Lead excluído com sucesso!');
  };

  const handleToggleContacted = (id: string, contacted: boolean) => {
    updateLead(id, { contacted });
    toast.success(contacted ? 'Lead marcado como contatado!' : 'Lead marcado como não contatado!');
  };

  const handleAddFolder = () => {
    toast.info('Funcionalidade de pastas em desenvolvimento!');
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Visão geral dos seus leads' };
      case 'leads':
        return { title: 'Todos os Leads', subtitle: `${leads.length} empresas cadastradas` };
      case 'search':
        return { title: 'Buscar Empresas', subtitle: 'Encontre novas oportunidades' };
      case 'analytics':
        return { title: 'Análises', subtitle: 'Métricas e estatísticas' };
      case 'users':
        return { title: 'Usuários', subtitle: 'Gerenciamento de acesso' };
      case 'costs':
        return { title: 'Custos da API', subtitle: 'Monitoramento de gastos' };
      default:
        return { title: 'Lead Hunter', subtitle: '' };
    }
  };

  const viewInfo = getViewTitle();

  const renderContent = () => {
    if (activeView === 'analytics') {
      return <Analytics leads={leads} />;
    }
    if (activeView === 'users') {
      return <Users />;
    }
    if (activeView === 'costs') {
      return <Costs />;
    }

    return (
      <>
        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards leads={leads} />
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <SearchFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={handleEditLead}
              onDelete={handleDeleteLead}
              onToggleContacted={handleToggleContacted}
              onChatClick={() => {
                setActiveChat({
                  number: lead.phone,
                  name: lead.name
                });
                setIsChatOpen(true);
              }}
            />
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {filters.searchTerm || filters.type !== 'all' || filters.size !== 'all'
                ? 'Nenhum lead encontrado com os filtros aplicados.'
                : 'Nenhum lead cadastrado ainda. Clique em "Novo Lead" para começar!'}
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background transition-all duration-300">
      <Sidebar
        folders={folders}
        activeView={activeView}
        onViewChange={setActiveView}
        onAddFolder={handleAddFolder}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={cn(
        "p-8 transition-all duration-300",
        isSidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        <Header
          title={viewInfo.title}
          subtitle={viewInfo.subtitle}
          onAddLead={handleAddLead}
          user={user}
          onLogout={handleLogout}
        />

        {activeView === 'search' ? (
          <GoogleMapsSearch onLeadAdded={(newLead) => {
            toast.success("Lead salvo! Verifique na aba 'Todos os Leads'");
            refresh(); // Update the list immediately
          }} />
        ) : (
          renderContent()
        )}
      </main>

      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        editingLead={editingLead}
      />

      <WhatsAppDrawer
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        targetNumber={activeChat?.number}
        targetName={activeChat?.name}
      />
    </div>
  );
};

export default Index;

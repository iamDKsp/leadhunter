import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { AccessGroups } from '@/components/AccessGroups';
import { Shield } from 'lucide-react'; // Import Shield
import LeadsCRM from './LeadsCRM';
import Personal from './Personal';
import Conversas from './Conversas';
import Monitoring from './Monitoring';
import LeadManagement from './LeadManagement';
import { toast } from 'sonner';
import { User } from '@/types/auth'; // Import User type
import { canViewPage } from '@/utils/permissions'; // Import permission helper
import { SettingsModal } from '@/components/SettingsModal';

const Index = () => {
  const navigate = useNavigate();
  const { view } = useParams();
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    // Initial load from local storage if available
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // Always fetch fresh user data including avatar
    import('@/services/api').then(({ auth }) => {
      auth.me()
        .then(userData => {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
          // If 401, redirect to login
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }
        });
    });

  }, [navigate]);

  const { leads, folders, addLead, updateLead, deleteLead, refresh } = useLeads();
  const [activeView, setActiveView] = useState(view || 'dashboard');

  useEffect(() => {
    if (view) {
      setActiveView(view);
    } else {
      // Default routing based on role
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        setActiveView('management');
        navigate('/management', { replace: true });
      } else {
        setActiveView('leads');
        navigate('/leads', { replace: true });
      }
    }
  }, [view, user]);

  // Handle view change by navigating
  const handleViewChange = (newView: string) => {
    setActiveView(newView);
    if (newView === 'dashboard') {
      navigate('/');
    } else {
      navigate(`/${newView}`);
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<SearchFiltersState>({
    searchTerm: '',
    type: 'all',
    size: 'all',
    activityBranch: 'all',
    contacted: 'all',
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<{ number: string, name: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      case 'management':
        return { title: 'Gestão de Leads', subtitle: 'Triagem e distribuição de leads' };
      case 'dashboard':
        return { title: 'Visão Geral', subtitle: 'Visão geral dos seus leads' };
      case 'personal':
        return { title: 'Pessoal', subtitle: 'Seu desempenho e metas' };
      case 'leads':
        return { title: 'CRM', subtitle: `${leads.length} empresas cadastradas` };
      case 'monitoring':
        return { title: 'Monitoramento', subtitle: 'Acompanhamento da equipe em tempo real' };
      case 'search':
        return { title: 'Buscar Empresas', subtitle: 'Encontre novas oportunidades' };
      case 'analytics':
        return { title: 'Análises', subtitle: 'Métricas e estatísticas' };
      case 'users':
        return { title: 'Usuários', subtitle: 'Gerenciamento de acesso' };
      case 'costs':
        return { title: 'Custos da API', subtitle: 'Monitoramento de gastos' };
      case 'access-groups':
        return { title: 'Grupos de Acesso', subtitle: 'Gerenciamento de permissões' };
      default:
        return { title: 'Lead Hunter', subtitle: '' };
    }
  };

  const viewInfo = getViewTitle();

  const renderContent = () => {
    // Permission check
    if (user && !canViewPage(user, activeView)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground max-w-md">
            Você não tem permissão para acessar esta página. Entre em contato com seu administrador se acreditar que isso é um erro.
          </p>
        </div>
      );
    }

    if (activeView === 'analytics') {
      return <Analytics leads={leads} />;
    }
    if (activeView === 'personal') {
      return <Personal userName={user?.name || 'Usuário'} />;
    }
    if (activeView === 'monitoring') {
      return <Monitoring />;
    }
    if (activeView === 'users') {
      return <Users />;
    }
    if (activeView === 'costs') {
      return <Costs />;
    }
    if (activeView === 'access-groups') {
      return <AccessGroups />;
    }

    if (activeView === 'management') {
      return <LeadManagement />;
    }

    if (activeView === 'conversas') {
      return <Conversas />;
    }

    if (activeView === 'leads') {
      return <LeadsCRM user={user} />;
    }


    return (
      <>
        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards leads={leads} />
        </div>

        {/* Search and Filters */}
        <div className="mb-6 animate-fade-in delay-100">
          <SearchFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in delay-200">
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
          <div className="bg-card/40 backdrop-blur-sm border border-border/30 p-12 text-center rounded-xl animate-fade-in">
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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        folders={folders}
        activeView={activeView}
        onViewChange={handleViewChange}
        onAddFolder={handleAddFolder}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}

        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        isSidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        <Header
          title={viewInfo.title}
          subtitle={viewInfo.subtitle}
          onAddLead={handleAddLead}
          user={user}
          onLogout={handleLogout}
        />

        <div className={cn(
          "flex-1 overflow-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background",
          activeView === 'conversas' ? "p-0" : "p-6"
        )}>
          {activeView === 'search' ? (
            <GoogleMapsSearch onLeadAdded={(newLead) => {
              const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
              const message = isAdmin
                ? "Lead enviado para triagem. Verifique na aba 'Gestão de Leads'."
                : "Lead salvo com sucesso! Aguarde a aprovação.";
              toast.success(message);
              refresh(); // Update the list immediately
            }} />
          ) : (
            renderContent()
          )}
        </div>
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


      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
      />
    </div>
  );
};

export default Index;

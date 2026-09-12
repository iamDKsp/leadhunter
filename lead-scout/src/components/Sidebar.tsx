import { Folder } from '@/types/lead';
import { User } from '@/types/auth'; // Import User type
import { canViewPage } from '@/utils/permissions'; // Import permission helper
import {
  LayoutDashboard,
  Layers, // Gestão de Leads
  TrendingUp,
  Globe, // Prospecção
  FolderPlus,
  Settings,
  ChevronLeft,
  Crown,
  FolderOpen,
  Shield,
  User as UserIcon,
  Eye,
  MessageSquare,
  Users as UsersIcon, // Equipe
  BarChart3, // Análises
  DollarSign, // Custos
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  folders: Folder[];
  activeView: string;
  onViewChange: (view: string) => void;
  onAddFolder: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  user?: User | null;
  onOpenSettings?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  folders,
  activeView,
  onViewChange,
  onAddFolder,
  isCollapsed,
  toggleSidebar,
  user,
  onOpenSettings,
  mobileOpen,
  onCloseMobile
}: SidebarProps) {
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Gestão de Leads', id: 'management' },
    { icon: UserIcon, label: 'Pessoal', id: 'personal' },
    { icon: MessageSquare, label: 'Conversas', id: 'conversas' },
    { icon: Layers, label: 'CRM', id: 'leads' },
    { icon: Globe, label: 'Prospecção', id: 'search' },
    { icon: Eye, label: 'Monitoramento', id: 'monitoring' },
    { icon: UsersIcon, label: 'Equipe', id: 'users' },
    { icon: Shield, label: 'Grupos de Acesso', id: 'access-groups' },
    { icon: DollarSign, label: 'Custos', id: 'costs' },
    { icon: BarChart3, label: 'Análises', id: 'analytics' },
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => canViewPage(user, item.id));

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      <aside className={cn(
        "bg-card/95 backdrop-blur-xl border-r border-border/30 flex flex-col transition-all duration-300 fixed left-0 top-0 h-screen z-50",
        // Mobile positioning: slide-out drawer
        "w-64",
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        // Desktop positioning: fixed sidebar
        "md:translate-x-0",
        isCollapsed ? "md:w-20" : "md:w-64"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-border/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
              <img src="/logo-lion.png" alt="Lead Hunter Logo" className="w-full h-full object-contain" />
            </div>
            {(!isCollapsed || mobileOpen) && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-foreground tracking-wide">Lead Hunter</h1>
                <p className="text-xs text-muted-foreground">Capture & Organize</p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Menu Principal */}
      <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        {!isCollapsed && <p className="text-xs text-muted-foreground px-3 mb-2 uppercase tracking-wider font-semibold">Menu Principal</p>}
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  if (item.id === 'settings') {
                    onOpenSettings?.();
                  } else {
                    onViewChange(item.id);
                  }
                  onCloseMobile?.();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                  activeView === item.id
                    ? "bg-primary/20 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  isCollapsed && !mobileOpen && "justify-center px-2"
                )}
                title={isCollapsed && !mobileOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(!isCollapsed || mobileOpen) && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>

        {/* Pastas */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-3 mb-2">
            {(!isCollapsed || mobileOpen) && <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pastas</p>}
            <button
              onClick={onAddFolder}
              className={cn(
                "text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/10",
                isCollapsed && !mobileOpen && "mx-auto"
              )}
              title="Nova Pasta"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <ul className="space-y-1">
            {folders.map((folder) => (
              <li key={folder.id}>
                <button
                  onClick={() => {
                    onViewChange(`folder-${folder.id}`);
                    onCloseMobile?.();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                    activeView === `folder-${folder.id}`
                      ? "bg-primary/20 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isCollapsed && !mobileOpen && "justify-center px-2"
                  )}
                  title={isCollapsed && !mobileOpen ? folder.name : undefined}
                >
                  <FolderOpen className="w-5 h-5 flex-shrink-0" style={{ color: folder.color }} />
                  {(!isCollapsed || mobileOpen) && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium truncate">{folder.name}</span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {folder.leadCount}
                      </span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/30 bg-card/50">
        <button
          onClick={() => {
            onOpenSettings?.();
            onCloseMobile?.();
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-300",
            isCollapsed && !mobileOpen && "justify-center px-2"
          )}
          title={isCollapsed && !mobileOpen ? "Configurações" : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || mobileOpen) && <span className="text-sm font-medium">Configurações</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all mt-1 justify-center"
          title={isCollapsed ? "Expandir" : "Minimizar"}
        >
          <ChevronLeft className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300", isCollapsed && "rotate-180")} />
          {!isCollapsed && <span className="text-sm font-medium">Minimizar Menu</span>}
        </button>
      </div>
    </aside>
    </>
  );
}

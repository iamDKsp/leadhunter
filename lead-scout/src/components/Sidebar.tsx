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
  DollarSign // Custos
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
}

export function Sidebar({ folders, activeView, onViewChange, onAddFolder, isCollapsed, toggleSidebar, user, onOpenSettings }: SidebarProps) {
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
    <aside className={cn(
      "bg-card/90 backdrop-blur-xl border-r border-border/30 flex flex-col transition-all duration-300 fixed left-0 top-0 h-screen z-50",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-border/30 flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
          <Crown className="w-6 h-6 text-background" />
        </div>
        {!isCollapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-foreground tracking-wide">Lead Hunter</h1>
            <p className="text-xs text-muted-foreground">Capture & Organize</p>
          </div>
        )}
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
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                  activeView === item.id
                    ? "bg-primary/20 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>

        {/* Pastas */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-3 mb-2">
            {!isCollapsed && <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pastas</p>}
            <button
              onClick={onAddFolder}
              className={cn(
                "text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/10",
                isCollapsed && "mx-auto"
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
                  onClick={() => onViewChange(`folder-${folder.id}`)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
                    activeView === `folder-${folder.id}`
                      ? "bg-primary/20 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? folder.name : undefined}
                >
                  <FolderOpen className="w-5 h-5 flex-shrink-0" style={{ color: folder.color }} />
                  {!isCollapsed && (
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
          onClick={onOpenSettings}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-300",
            // activeView === 'settings' && "bg-primary/20 text-primary", // Settings is modal now, might not need active state or handle it differently
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Configurações" : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all mt-1 justify-center"
          title={isCollapsed ? "Expandir" : "Minimizar"}
        >
          <ChevronLeft className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300", isCollapsed && "rotate-180")} />
          {!isCollapsed && <span className="text-sm font-medium">Minimizar Menu</span>}
        </button>
      </div>
    </aside>
  );
}

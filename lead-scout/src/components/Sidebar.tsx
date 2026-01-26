import { Folder } from '@/types/lead';
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  Plus,
  Settings,
  TrendingUp,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  folders: Folder[];
  onViewChange: (view: string) => void;
  onAddFolder: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ folders, activeView, onViewChange, onAddFolder, isCollapsed, toggleSidebar }: SidebarProps) {
  return (
    <aside className={cn(
      "h-screen fixed left-0 top-0 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border relative">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Lead Hunter Logo"
            className="w-10 h-10 object-contain"
          />
          {!isCollapsed && (
            <div>
              <h1 className="font-display font-bold text-lg text-foreground">Lead Hunter</h1>
              <p className="text-xs text-muted-foreground">Capture & Organize</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-3">
            Menu Principal
          </p>
        )}

        <button
          onClick={() => onViewChange('dashboard')}
          className={cn('sidebar-item w-full', activeView === 'dashboard' && 'sidebar-item-active', isCollapsed && 'justify-center px-2')}
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Dashboard</span>}
        </button>

        <button
          onClick={() => onViewChange('leads')}
          className={cn('sidebar-item w-full', activeView === 'leads' && 'sidebar-item-active', isCollapsed && 'justify-center px-2')}
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Todos os Leads</span>}
        </button>

        {/* NEW MODULES */}
        <button
          onClick={() => onViewChange('users')}
          className={cn('sidebar-item w-full', activeView === 'users' && 'sidebar-item-active', isCollapsed && 'justify-center px-2')}
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Usuários</span>}
        </button>

        <button
          onClick={() => onViewChange('costs')}
          className={cn('sidebar-item w-full', activeView === 'costs' && 'sidebar-item-active', isCollapsed && 'justify-center px-2')}
        >
          <TrendingUp className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Custos</span>}
        </button>

        <button
          onClick={() => onViewChange('search')}
          className={cn('sidebar-item w-full', activeView === 'search' && 'sidebar-item-active', isCollapsed && 'justify-center px-2')}
        >
          <Search className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Buscar Empresas</span>}
        </button>

        <button
          onClick={() => onViewChange('analytics')}
          className={cn('sidebar-item w-full', activeView === 'analytics' && 'sidebar-item-active', isCollapsed && 'justify-center px-2')}
        >
          <TrendingUp className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Análises</span>}
        </button>

        {/* Folders Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between px-4 mb-3">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pastas
              </p>
            )}
            <button
              onClick={onAddFolder}
              className={cn(
                "p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors",
                isCollapsed && "mx-auto"
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onViewChange(`folder-${folder.id}`)}
              className={cn(
                'sidebar-item w-full',
                activeView === `folder-${folder.id}` && 'sidebar-item-active',
                isCollapsed && 'justify-center px-2'
              )}
            >
              <FolderOpen
                className="w-5 h-5 flex-shrink-0"
                style={{ color: folder.color }}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{folder.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {folder.leadCount}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Settings & Collapse */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button
          onClick={() => onViewChange('settings')}
          className={cn('sidebar-item w-full', activeView === 'settings' && 'sidebar-item-active', isCollapsed && 'justify-center px-2')}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Configurações</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className={cn('sidebar-item w-full justify-center text-muted-foreground hover:text-foreground')}
        >
          {isCollapsed ? (
            <Plus className="w-5 h-5 rotate-45" /* Using Plus as generic icon or ArrowRight implies expand */ />
          ) : (
            <div className="flex items-center gap-2 w-full">
              {/* Icon for collapse could be added here, or just a text button */}
              <span className="text-xs uppercase font-bold">Minimizar Menu</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

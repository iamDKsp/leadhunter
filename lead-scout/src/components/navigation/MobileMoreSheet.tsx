import React from 'react';
import {
  Globe,
  Eye,
  Users,
  Shield,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  X,
  ChevronRight,
  User as UserIcon,
  Crown
} from 'lucide-react';
import { User } from '@/types/auth';
import { canViewPage } from '@/utils/permissions';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
  user?: User | null;
  onOpenSettings?: () => void;
  onLogout: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  activeView,
  onViewChange,
  user,
  onOpenSettings,
  onLogout,
}) => {
  if (!isOpen) return null;

  const moreItems = [
    {
      id: 'search',
      label: 'Prospecção (Maps)',
      description: 'Buscar empresas no Google Maps',
      icon: Globe,
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      id: 'monitoring',
      label: 'Monitoramento',
      description: 'Acompanhar conversas em tempo real',
      icon: Eye,
      color: 'text-purple-400 bg-purple-500/10',
    },
    {
      id: 'users',
      label: 'Equipe',
      description: 'Membros e operadores',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'access-groups',
      label: 'Grupos de Acesso',
      description: 'Permissões e papéis',
      icon: Shield,
      color: 'text-amber-400 bg-amber-500/10',
    },
    {
      id: 'costs',
      label: 'Custos',
      description: 'Gastos de APIs e consumo',
      icon: DollarSign,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'analytics',
      label: 'Análises',
      description: 'Métricas e relatórios de conversão',
      icon: BarChart3,
      color: 'text-cyan-400 bg-cyan-500/10',
    },
  ];

  const visibleItems = moreItems.filter((item) => canViewPage(user, item.id));

  const handleItemClick = (id: string) => {
    onViewChange(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-card/95 backdrop-blur-2xl border-t border-border/50 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {/* Drag Handle Indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header with User Info */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-base overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                (user?.name || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {user?.name || 'Usuário'}
                </h3>
                {user?.role === 'SUPER_ADMIN' && (
                  <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
            Recursos Adicionais
          </p>

          <div className="grid grid-cols-1 gap-1.5">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    isActive
                      ? 'bg-primary/15 border-primary/40 text-foreground'
                      : 'bg-muted/30 hover:bg-muted/60 border-border/30 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                </button>
              );
            })}
          </div>

          {/* Settings and Logout Section */}
          <div className="pt-3 border-t border-border/40 mt-3 space-y-1.5 pb-6">
            {onOpenSettings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border/30 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-500/10 text-muted-foreground flex items-center justify-center flex-shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      Configurações
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Perfil, senha e preferências
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium text-sm transition-all mt-2"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

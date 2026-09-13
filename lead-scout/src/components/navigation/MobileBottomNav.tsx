import React from 'react';
import { User } from '@/types/auth';
import { canViewPage } from '@/utils/permissions';
import {
  MessageSquare,
  Layers,
  LayoutDashboard,
  User as UserIcon,
  MoreHorizontal
} from 'lucide-react';
import { useWhatsApp } from '@/context/WhatsAppContext';
import { triggerHaptic } from '@/utils/haptics';

interface MobileBottomNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenMore: () => void;
  isHidden?: boolean;
  user?: User | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onViewChange,
  onOpenMore,
  isHidden = false,
  user,
}) => {
  const { pendingNotifications } = useWhatsApp();

  if (isHidden) return null;

  const unreadCount = pendingNotifications.length;

  const navItems = [
    {
      id: 'conversas',
      label: 'Conversas',
      icon: MessageSquare,
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : null,
    },
    {
      id: 'leads',
      label: 'CRM',
      icon: Layers,
    },
    {
      id: 'management',
      label: 'Leads',
      icon: LayoutDashboard,
    },
    {
      id: 'personal',
      label: 'Pessoal',
      icon: UserIcon,
    },
  ];

  const visibleNavItems = navItems.filter(item => canViewPage(user, item.id));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/50 md:hidden pb-[env(safe-area-inset-bottom,0px)] shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                triggerHaptic('light');
                onViewChange(item.id);
              }}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary/15 text-primary scale-105'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {item.badge && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-semibold text-primary' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenMore();
          }}
          className="flex flex-col items-center justify-center flex-1 py-1.5 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <div className="p-1 rounded-xl text-muted-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">
            Mais
          </span>
        </button>
      </div>
    </nav>
  );
};

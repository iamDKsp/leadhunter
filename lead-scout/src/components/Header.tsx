import { Plus, Bell, User, LogOut, MessageSquare, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWhatsApp } from '@/context/WhatsAppContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddLead: () => void;
  user?: { name: string; email: string };
  onLogout: () => void;
}

export function Header({ title, subtitle, onAddLead, user, onLogout }: HeaderProps) {
  const { pendingNotifications, dismissNotification, dismissAllNotifications } = useWhatsApp();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-40 transition-all duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative w-10 h-10 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all outline-none">
              <Bell className="w-5 h-5" />
              {pendingNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-card">
                  {pendingNotifications.length > 9 ? '9+' : pendingNotifications.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-border/50 backdrop-blur-xl">
            <div className="flex items-center justify-between pr-2">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              {pendingNotifications.length > 0 && (
                <button
                  onClick={dismissAllNotifications}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  Limpar Todas
                </button>
              )}
            </div>

            <DropdownMenuSeparator className="bg-border/50" />

            <div className="max-h-[300px] overflow-y-auto w-full">
              {pendingNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma nova notificação.
                </div>
              ) : (
                <div className="flex flex-col">
                  {pendingNotifications.map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-primary/5 focus:text-foreground rounded-none border-b border-border/20 last:border-0"
                      onClick={() => {
                        dismissNotification(notif.id);
                        navigate(`/conversas?chatId=${encodeURIComponent(notif.chatId)}`);
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-sm truncate pr-2">
                          {notif.senderName || 'Desconhecido'}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {new Date(notif.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1 truncate w-full">
                        {notif.type === 'ptt' || notif.type === 'audio' ? '🎤 Áudio' : notif.type === 'image' || notif.type === 'video' ? '📷 Mídia' : notif.body}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`${user?.avatar ? 'p-0.5' : 'p-0'} w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all outline-none overflow-hidden`}>
              {user?.avatar ? (
                <img
                  src={user.avatar.startsWith('http') || user.avatar.startsWith('/')
                    ? `${user.avatar.startsWith('/') ? import.meta.env.VITE_API_URL || 'http://localhost:3000' : ''}${user.avatar}`
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border/50 backdrop-blur-xl">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-3 items-center text-center p-2">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                  {user?.avatar ? (
                    <img
                      src={user.avatar.startsWith('http') || user.avatar.startsWith('/')
                        ? `${user.avatar.startsWith('/') ? import.meta.env.VITE_API_URL || 'http://localhost:3000' : ''}${user.avatar}`
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-0.5">
                  <span className="font-medium text-foreground">{user?.name || 'Usuário'}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                  {user?.customTag ? (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full w-fit mx-auto mt-1"
                      style={{
                        backgroundColor: `${user.customTagColor || '#000000'}20`,
                        color: user.customTagColor || '#000000',
                        border: `1px solid ${user.customTagColor || '#000000'}50`
                      }}
                    >
                      {user.customTag}
                    </span>
                  ) : user?.role === 'SUPER_ADMIN' ? (
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full w-fit mx-auto mt-1">Super Admin</span>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div >
    </header >
  );
}

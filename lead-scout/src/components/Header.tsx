import { Plus, Bell, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddLead: () => void;
  user?: { name: string; email: string };
  onLogout: () => void;
}

export function Header({ title, subtitle, onAddLead, user, onLogout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-40 transition-all duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all outline-none">
              <Bell className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-border/50 backdrop-blur-xl">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma nova notificação.
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
      </div>
    </header>
  );
}

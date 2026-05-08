import { ReactNode } from 'react';
import { NavLink, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useFinance';
import { LayoutDashboard, Receipt, Wallet, PiggyBank, History, Settings, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import OfflineBanner from './OfflineBanner';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import Avatar from './Avatar';

const NAV = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/contas', label: 'Contas', icon: Receipt },
  { to: '/renda', label: 'Renda', icon: Wallet },
  { to: '/investimentos', label: 'Investir', icon: TrendingUp },
  { to: '/historico', label: 'Histórico', icon: History },
];

const SIDE_NAV = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/contas', label: 'Contas', icon: Receipt },
  { to: '/renda', label: 'Renda', icon: Wallet },
  { to: '/poupanca', label: 'Poupança', icon: PiggyBank },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/historico', label: 'Histórico', icon: History },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  useOnlineSync();

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const displayName = profile?.display_name || user.user_metadata?.username || user.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen flex bg-background">
      <OfflineBanner />
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link to="/perfil" className="flex items-center gap-3 group">
            <Avatar name={displayName} size="md" status="verified" />
            <div className="min-w-0">
              <div className="font-bold leading-none text-sm truncate group-hover:text-primary transition-colors">{displayName}</div>
              <div className="text-[11px] text-muted-foreground mt-1 truncate">Conta verificada</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {SIDE_NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-elevated'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}>
              <n.icon className="size-4" />
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/ajustes" className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            isActive ? 'bg-primary text-primary-foreground shadow-elevated' : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}>
            <Settings className="size-4" />Ajustes
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile glass header */}
        <header className="md:hidden sticky top-0 z-30 glass border-b border-border/40">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-gradient-hero grid place-items-center text-primary-foreground font-bold text-sm shadow-soft">F</div>
              <span className="font-bold">FinWise</span>
            </div>
            <Link to="/perfil" className="flex items-center gap-2 pr-1 pl-3 py-1 rounded-full bg-muted/70 tap-scale hover-lift">
              <span className="text-xs font-semibold max-w-[80px] truncate hidden xs:inline">{displayName}</span>
              <Avatar name={displayName} size="sm" status="verified" />
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-bottom-nav md:pb-8 animate-fade-in">{children}</main>

        {/* Mobile floating bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-safe pointer-events-none">
          <div className="pointer-events-auto glass rounded-2xl shadow-elevated border border-border/50 px-2 py-2">
            <div className="grid grid-cols-5 gap-1">
              {NAV.map(n => (
                <NavLink key={n.to} to={n.to} end={n.end} className="tap-scale">
                  {({ isActive }) => (
                    <div className={cn(
                      'flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-medium transition-all',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}>
                      <n.icon className={cn('size-5 transition-transform', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="leading-none">{n.label}</span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

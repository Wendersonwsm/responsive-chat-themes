import { ReactNode } from 'react';
import { NavLink, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Receipt, Wallet, PiggyBank, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import OfflineBanner from './OfflineBanner';
import { useOnlineSync } from '@/hooks/useOnlineSync';

const NAV = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/contas', label: 'Contas', icon: Receipt },
  { to: '/renda', label: 'Renda', icon: Wallet },
  { to: '/poupanca', label: 'Poupança', icon: PiggyBank },
  { to: '/historico', label: 'Histórico', icon: History },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  useOnlineSync();

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const initials = (user.user_metadata?.username || user.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      <OfflineBanner />
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-gradient-hero text-primary-foreground grid place-items-center font-bold shadow-elevated">F</div>
            <div>
              <div className="font-bold leading-none text-base">FinWise</div>
              <div className="text-xs text-muted-foreground mt-1">Banco pessoal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(n => (
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
            <Link to="/ajustes"
              className="size-9 rounded-full bg-muted grid place-items-center text-xs font-semibold tap-scale">
              {initials}
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

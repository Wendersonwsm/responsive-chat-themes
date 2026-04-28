import { ReactNode } from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Receipt, Wallet, PiggyBank, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/contas', label: 'Contas', icon: Receipt },
  { to: '/renda', label: 'Renda', icon: Wallet },
  { to: '/poupanca', label: 'Poupança', icon: PiggyBank },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen grid place-items-center">Carregando…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">F</div>
            <div>
              <div className="font-bold leading-none">FinWise</div>
              <div className="text-xs text-muted-foreground mt-1">Controle financeiro</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}>
              <n.icon className="size-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-bottom-nav md:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-bottom-nav bg-card/95 backdrop-blur border-t border-border">
          <div className="grid grid-cols-6 h-16">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => cn(
                  'flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                <n.icon className="size-5" />
                <span className="leading-none">{n.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

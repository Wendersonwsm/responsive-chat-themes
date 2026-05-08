import { useState } from 'react';
import { Link } from 'react-router-dom';
import { todayKey, monthLabel, fmtMoney } from '@/lib/format';
import { useMonth, useBills, useIncomesExtra, useSavings, useCategories } from '@/hooks/useFinance';
import { useInvestments } from '@/hooks/useInvestments';
import { currentValue } from '@/lib/investments';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, Eye, EyeOff, Plus, History, Receipt, Sparkles, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCategoryIcon } from '@/lib/categoryIcons';
import ChartsSection from '@/components/dashboard/ChartsSection';

export default function Dashboard() {
  const [monthKey] = useState(todayKey());
  const { data: month } = useMonth(monthKey);
  const { data: bills = [] } = useBills(month?.id);
  const { data: extras = [] } = useIncomesExtra(month?.id);
  const { data: savings } = useSavings(month?.id);
  const { data: categories = [] } = useCategories();
  const { data: investments = [] } = useInvestments();
  const [hidden, setHidden] = useState<boolean>(() => localStorage.getItem('finwise-hide') === '1');

  const toggleHide = () => {
    setHidden(h => {
      const nv = !h;
      localStorage.setItem('finwise-hide', nv ? '1' : '0');
      return nv;
    });
  };

  if (!month) return (
    <div className="px-4 py-6 space-y-3 max-w-5xl mx-auto">
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid grid-cols-4 gap-2">{[0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );

  const monthSavings = savings?.monthNet ?? Number(month.savings_contrib);
  const totalIncome = Number(month.income) + extras.reduce((s, e) => s + Number(e.amount), 0);
  const totalBills = bills.reduce((s, b) => s + Number(b.amount), 0);
  const paidBills = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.amount), 0);
  const balance = totalIncome - totalBills - monthSavings;
  const billsProgress = totalBills > 0 ? (paidBills / totalBills) * 100 : 0;

  const upcoming = bills
    .filter(b => !b.paid)
    .sort((a, b) => (a.due_day || 99) - (b.due_day || 99))
    .slice(0, 3);

  const byCategory = categories.map(c => {
    const sum = bills.filter(b => b.category === c.name).reduce((s, b) => s + Number(b.amount), 0);
    return { ...c, sum };
  }).filter(c => c.sum > 0).sort((a, b) => b.sum - a.sum).slice(0, 5);

  const mask = (v: string) => hidden ? '••••••' : v;

  const actions = [
    { to: '/contas', label: 'Conta', icon: Receipt, color: 'hsl(var(--primary))' },
    { to: '/renda', label: 'Renda', icon: Plus, color: 'hsl(var(--success))' },
    { to: '/poupanca', label: 'Poupar', icon: PiggyBank, color: 'hsl(var(--warning))' },
    { to: '/historico', label: 'Histórico', icon: History, color: 'hsl(var(--accent-foreground))' },
  ];

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-5xl mx-auto space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{monthLabel(monthKey)}</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-0.5">Olá 👋</h1>
        </div>
      </header>

      {/* Hero balance */}
      <Card className="relative overflow-hidden p-5 bg-gradient-hero text-primary-foreground border-0 shadow-elevated animate-scale-in">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-12 size-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-90">Saldo do mês</p>
            <button onClick={toggleHide} aria-label="Ocultar valores"
              className="size-8 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 tap-scale">
              {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-3xl md:text-4xl font-extrabold mt-1 tracking-tight">{mask(fmtMoney(balance))}</p>
          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[10px] opacity-80 flex items-center gap-1"><TrendingUp className="size-3" /> Renda</p>
              <p className="font-semibold text-sm mt-0.5">{mask(fmtMoney(totalIncome))}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[10px] opacity-80 flex items-center gap-1"><TrendingDown className="size-3" /> Despesas</p>
              <p className="font-semibold text-sm mt-0.5">{mask(fmtMoney(totalBills))}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[10px] opacity-80 flex items-center gap-1"><PiggyBank className="size-3" /> Poupado</p>
              <p className="font-semibold text-sm mt-0.5">{mask(fmtMoney(monthSavings))}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2 animate-fade-in" style={{ animationDelay: '60ms' }}>
        {actions.map(a => (
          <Link key={a.to} to={a.to} className="flex flex-col items-center gap-1.5 tap-scale">
            <div className="size-14 rounded-2xl bg-card shadow-soft grid place-items-center hover-lift"
              style={{ color: a.color }}>
              <a.icon className="size-5" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Savings + Total */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '120ms' }}>
        <Card className="p-4 hover-lift">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><PiggyBank className="size-4" /> Poupança</div>
          <p className="text-xl font-bold mt-1">{mask(fmtMoney(savings?.total ?? 0))}</p>
        </Card>
        <Card className="p-4 hover-lift">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Wallet className="size-4" /> No mês</div>
          <p className={`text-xl font-bold mt-1 ${monthSavings >= 0 ? '' : 'text-destructive'}`}>{mask(fmtMoney(monthSavings))}</p>
        </Card>
      </div>

      {/* Bills progress */}
      <Card className="p-5 animate-fade-in" style={{ animationDelay: '180ms' }}>
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="font-semibold">Contas pagas</h2>
          <span className="text-xs text-muted-foreground">{mask(fmtMoney(paidBills))} / {mask(fmtMoney(totalBills))}</span>
        </div>
        <Progress value={billsProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{bills.filter(b => b.paid).length} de {bills.length} contas pagas</p>
      </Card>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Card className="p-5 animate-fade-in" style={{ animationDelay: '240ms' }}>
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="font-semibold">Próximas contas</h2>
            <Link to="/contas" className="text-xs text-primary font-medium">Ver todas</Link>
          </div>
          <ul className="space-y-2">
            {upcoming.map(b => {
              const cat = categories.find(c => c.name === b.category);
              const Icon = getCategoryIcon(cat?.icon);
              const color = cat?.color || 'hsl(var(--muted-foreground))';
              return (
                <li key={b.id} className="flex items-center gap-3">
                  <div className="size-10 rounded-xl grid place-items-center" style={{ background: `${color}1a`, color }}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{b.description}</p>
                    <p className="text-[11px] text-muted-foreground">{b.due_day ? `Vence dia ${b.due_day}` : b.category}</p>
                  </div>
                  <p className="text-sm font-semibold">{mask(fmtMoney(Number(b.amount)))}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* By category */}
      {byCategory.length > 0 && (
        <Card className="p-5 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="font-semibold mb-3">Despesas por categoria</h2>
          <ul className="space-y-3">
            {byCategory.map(c => {
              const pct = totalBills > 0 ? (c.sum / totalBills) * 100 : 0;
              const Icon = getCategoryIcon(c.icon);
              return (
                <li key={c.id}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="size-7 rounded-lg grid place-items-center" style={{ background: `${c.color}22`, color: c.color }}>
                        <Icon className="size-3.5" />
                      </span>
                      {c.name}
                    </span>
                    <span className="text-muted-foreground text-xs">{mask(fmtMoney(c.sum))} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

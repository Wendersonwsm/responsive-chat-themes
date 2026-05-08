import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, Wallet, Sparkles, ArrowRight, Coins } from 'lucide-react';
import { useInvestments } from '@/hooks/useInvestments';
import { currentValue, profit, profitability, buildSeries, FREQ_LABEL } from '@/lib/investments';
import { fmtMoney } from '@/lib/format';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvestimentosPage() {
  const { data: investments = [], isLoading } = useInvestments();

  const totalInvested = investments.reduce((s, i) => s + Number(i.amount_invested), 0);
  const totalCurrent = investments.reduce((s, i) => s + currentValue(i), 0);
  const totalProfit = totalCurrent - totalInvested;
  const totalReturn = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Aggregated patrimony series (sum across all investments by date approximation: take longest series)
  const patrimonyData = (() => {
    if (investments.length === 0) return [];
    // Use monthly buckets last 12
    const points: { date: string; total: number }[] = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 15);
      const total = investments.reduce((s, inv) => {
        const start = new Date(inv.start_date + 'T00:00:00');
        if (d < start) return s;
        return s + currentValue(inv, d);
      }, 0);
      points.push({ date: d.toLocaleDateString('pt-BR', { month: 'short' }), total });
    }
    return points;
  })();

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-5xl mx-auto space-y-4 pb-24">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Investimentos</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-0.5">Seu patrimônio</h1>
        </div>
        <Link to="/investimentos/novo">
          <Button size="sm" className="h-10 rounded-full"><Plus className="size-4 mr-1" />Novo</Button>
        </Link>
      </header>

      {/* Hero card */}
      <Card className="relative overflow-hidden p-5 bg-gradient-hero text-primary-foreground border-0 shadow-elevated animate-scale-in">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-12 size-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-sm opacity-90 flex items-center gap-1.5"><Sparkles className="size-3.5" /> Patrimônio total</p>
          <p className="text-3xl md:text-4xl font-extrabold mt-1 tracking-tight tabular-nums">{fmtMoney(totalCurrent)}</p>
          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[10px] opacity-80 flex items-center gap-1"><Wallet className="size-3" /> Investido</p>
              <p className="font-semibold text-sm mt-0.5 tabular-nums">{fmtMoney(totalInvested)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[10px] opacity-80 flex items-center gap-1">
                {totalProfit >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />} Lucro
              </p>
              <p className="font-semibold text-sm mt-0.5 tabular-nums">{fmtMoney(totalProfit)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[10px] opacity-80">Rentab.</p>
              <p className="font-semibold text-sm mt-0.5 tabular-nums">{totalReturn.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Patrimony chart */}
      {investments.length > 0 && (
        <Card className="p-4 animate-fade-in">
          <h2 className="font-semibold text-sm">Evolução do patrimônio</h2>
          <p className="text-[11px] text-muted-foreground mb-2">Últimos 12 meses</p>
          <div className="h-[200px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patrimonyData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => fmtMoney(v)}
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="total" name="Patrimônio" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#patGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm pl-1">Meus investimentos</h2>
        {isLoading && <Skeleton className="h-24 rounded-2xl" />}
        {!isLoading && investments.length === 0 && (
          <Card className="p-6 text-center">
            <Coins className="size-10 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm font-medium mt-2">Você ainda não tem investimentos</p>
            <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro para acompanhar a rentabilidade.</p>
            <Link to="/investimentos/novo"><Button className="mt-3" size="sm"><Plus className="size-4 mr-1" />Criar investimento</Button></Link>
          </Card>
        )}
        {investments.map((inv, idx) => {
          const cv = currentValue(inv);
          const p = profit(inv);
          const pct = profitability(inv);
          const positive = p >= 0;
          const series = buildSeries(inv).slice(-30);
          return (
            <Link key={inv.id} to={`/investimentos/${inv.id}`} className="block tap-scale">
              <Card className="p-4 hover-lift animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-gradient-hero text-primary-foreground grid place-items-center shrink-0 shadow-soft">
                    <Coins className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{inv.name}</p>
                    <p className="text-[11px] text-muted-foreground">{inv.type} · {FREQ_LABEL[inv.yield_frequency]} · {inv.yield_rate}%</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm tabular-nums">{fmtMoney(cv)}</p>
                    <p className={`text-[11px] font-medium tabular-nums flex items-center gap-0.5 justify-end ${positive ? 'text-success' : 'text-destructive'}`}>
                      {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {pct.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="h-10 mt-2 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <Area type="monotone" dataKey="value" stroke={positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} strokeWidth={2} fill={positive ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--destructive) / 0.15)'} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-end mt-1 text-[11px] text-primary font-medium">
                  Ver detalhes <ArrowRight className="size-3 ml-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDeleteInvestment, useInvestment } from '@/hooks/useInvestments';
import { ChevronLeft, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { buildSeries, currentValue, FREQ_LABEL, periodsElapsed, profit, profitability } from '@/lib/investments';
import { fmtMoneyFull } from '@/lib/format';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvestimentoDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: inv, isLoading } = useInvestment(id);
  const del = useDeleteInvestment();

  if (isLoading) return <div className="p-4"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!inv) return <div className="p-6 text-center text-muted-foreground">Investimento não encontrado.</div>;

  const cv = currentValue(inv);
  const p = profit(inv);
  const pct = profitability(inv);
  const positive = p >= 0;
  const series = buildSeries(inv);
  const periods = periodsElapsed(inv);

  const remove = async () => {
    if (!confirm('Remover este investimento?')) return;
    await del.mutateAsync(inv.id);
    navigate('/investimentos');
  };

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-3xl mx-auto space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <Link to="/investimentos" className="size-9 rounded-full bg-muted grid place-items-center tap-scale"><ChevronLeft className="size-5" /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">{inv.name}</h1>
          <p className="text-xs text-muted-foreground">{inv.type} · {FREQ_LABEL[inv.yield_frequency]} · {inv.yield_rate}%</p>
        </div>
        <Button variant="ghost" size="icon" onClick={remove} className="text-destructive"><Trash2 className="size-4" /></Button>
      </div>

      <Card className="relative overflow-hidden p-5 bg-gradient-hero text-primary-foreground border-0 shadow-elevated animate-scale-in">
        <p className="text-sm opacity-90">Valor atual</p>
        <p className="text-3xl md:text-4xl font-extrabold mt-1 tabular-nums">{fmtMoneyFull(cv)}</p>
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="rounded-xl bg-white/10 p-2.5">
            <p className="text-[10px] opacity-80">Investido</p>
            <p className="font-semibold text-sm mt-0.5 tabular-nums">{fmtMoneyFull(Number(inv.amount_invested))}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2.5">
            <p className="text-[10px] opacity-80 flex items-center gap-1">
              {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />} Lucro
            </p>
            <p className="font-semibold text-sm mt-0.5 tabular-nums">{fmtMoneyFull(p)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-2.5">
            <p className="text-[10px] opacity-80">Rentab.</p>
            <p className="font-semibold text-sm mt-0.5 tabular-nums">{pct.toFixed(2)}%</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold text-sm">Evolução</h2>
        <p className="text-[11px] text-muted-foreground mb-2">Desde {new Date(inv.start_date).toLocaleDateString('pt-BR')}</p>
        <div className="h-[260px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => fmtMoneyFull(v)}
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="value" name="Valor" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#invGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 space-y-2 text-sm">
        <h2 className="font-semibold">Detalhes</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-muted p-2"><p className="text-muted-foreground">Períodos transcorridos</p><p className="font-semibold mt-0.5 tabular-nums">{periods.toFixed(2)}</p></div>
          <div className="rounded-lg bg-muted p-2"><p className="text-muted-foreground">Rendimento acumulado</p><p className={`font-semibold mt-0.5 tabular-nums ${positive ? 'text-success' : 'text-destructive'}`}>{fmtMoneyFull(p)}</p></div>
          {inv.notes && <div className="col-span-2 rounded-lg bg-muted p-2"><p className="text-muted-foreground">Observações</p><p className="mt-0.5">{inv.notes}</p></div>}
        </div>
      </Card>
    </div>
  );
}

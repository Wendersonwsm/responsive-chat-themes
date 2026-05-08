import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';
import { fmtMoney } from '@/lib/format';
import { History } from 'lucide-react';
import type { MonthlyAgg } from '@/hooks/useMonthlyAggregates';

interface Props { data: MonthlyAgg[]; delay?: number; }

export default function HistoricoFinanceiroChart({ data, delay }: Props) {
  let cumIncome = 0, cumExp = 0;
  const series = data.map(d => {
    cumIncome += d.income; cumExp += d.expenses;
    return { label: d.label, Receita: cumIncome, Despesa: cumExp };
  });
  return (
    <ChartCard title="Histórico financeiro" subtitle="Receita e despesa acumuladas" icon={<History className="size-4" />} delay={delay}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: number) => fmtMoney(v)}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="Receita" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#incGrad)" />
          <Area type="monotone" dataKey="Despesa" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#expGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

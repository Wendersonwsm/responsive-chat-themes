import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';
import { fmtMoney } from '@/lib/format';
import { TrendingUp } from 'lucide-react';
import type { MonthlyAgg } from '@/hooks/useMonthlyAggregates';

interface Props { data: MonthlyAgg[]; delay?: number; }

export default function EvolucaoSaldoChart({ data, delay }: Props) {
  return (
    <ChartCard title="Evolução do saldo" subtitle="Últimos meses (acumulado)" icon={<TrendingUp className="size-4" />} delay={delay}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: number) => fmtMoney(v)}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="balance" name="Saldo" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#balGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

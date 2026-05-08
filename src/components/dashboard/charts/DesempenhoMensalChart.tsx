import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';
import { fmtMoney } from '@/lib/format';
import { BarChart3 } from 'lucide-react';
import type { MonthlyAgg } from '@/hooks/useMonthlyAggregates';

interface Props { data: MonthlyAgg[]; delay?: number; }

export default function DesempenhoMensalChart({ data, delay }: Props) {
  return (
    <ChartCard title="Desempenho mensal" subtitle="Renda x despesa" icon={<BarChart3 className="size-4" />} delay={delay}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: number) => fmtMoney(v)}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
          />
          <Bar dataKey="income" name="Renda" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expenses" name="Despesa" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

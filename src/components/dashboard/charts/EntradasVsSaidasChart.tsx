import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';
import { fmtMoney } from '@/lib/format';
import { ArrowDownUp } from 'lucide-react';

interface Props { income: number; expenses: number; delay?: number; }

export default function EntradasVsSaidasChart({ income, expenses, delay }: Props) {
  const data = [{ name: 'Mês atual', Entradas: income, Saídas: expenses }];
  return (
    <ChartCard title="Entradas vs Saídas" subtitle="Comparação do mês atual" icon={<ArrowDownUp className="size-4" />} delay={delay}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: number) => fmtMoney(v)}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
          />
          <Bar dataKey="Entradas" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} maxBarSize={60} />
          <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from '../ChartCard';
import { fmtMoney } from '@/lib/format';
import { PieChart as PieIcon } from 'lucide-react';

interface Props { data: { name: string; value: number; color: string }[]; delay?: number; }

export default function GastosPorCategoriaChart({ data, delay }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title="Gastos por categoria" subtitle="Distribuição do mês" icon={<PieIcon className="size-4" />} delay={delay}>
      {data.length === 0 ? (
        <div className="h-full grid place-items-center text-xs text-muted-foreground">Sem despesas neste mês.</div>
      ) : (
        <div className="grid grid-cols-2 h-full items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                {data.map((d, i) => <Cell key={i} fill={d.color} stroke="hsl(var(--card))" strokeWidth={2} />)}
              </Pie>
              <Tooltip
                formatter={(v: number) => fmtMoney(v)}
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="space-y-1.5 overflow-y-auto max-h-full pr-2">
            {data.map((d) => (
              <li key={d.name} className="flex items-center gap-2 text-xs">
                <span className="size-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="truncate flex-1">{d.name}</span>
                <span className="text-muted-foreground tabular-nums">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

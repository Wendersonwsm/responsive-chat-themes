import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SlidersHorizontal, BarChart3, PieChart, TrendingUp, Activity, History, ArrowDownUp } from 'lucide-react';
import EntradasVsSaidasChart from './charts/EntradasVsSaidasChart';
import GastosPorCategoriaChart from './charts/GastosPorCategoriaChart';
import EvolucaoSaldoChart from './charts/EvolucaoSaldoChart';
import DesempenhoMensalChart from './charts/DesempenhoMensalChart';
import ReceitasVsDespesasChart from './charts/ReceitasVsDespesasChart';
import HistoricoFinanceiroChart from './charts/HistoricoFinanceiroChart';
import { useMonthlyAggregates } from '@/hooks/useMonthlyAggregates';
import { Skeleton } from '@/components/ui/skeleton';

type ChartId = 'entradasSaidas' | 'porCategoria' | 'evolucao' | 'desempenho' | 'receitasDespesas' | 'historico';

const CHART_META: { id: ChartId; label: string; icon: any }[] = [
  { id: 'entradasSaidas', label: 'Entradas vs Saídas', icon: ArrowDownUp },
  { id: 'porCategoria', label: 'Gastos por categoria', icon: PieChart },
  { id: 'evolucao', label: 'Evolução do saldo', icon: TrendingUp },
  { id: 'desempenho', label: 'Desempenho mensal', icon: BarChart3 },
  { id: 'receitasDespesas', label: 'Receitas x Despesas', icon: Activity },
  { id: 'historico', label: 'Histórico financeiro', icon: History },
];

const DEFAULTS: ChartId[] = ['entradasSaidas', 'porCategoria', 'evolucao'];
const STORAGE_KEY = 'finwise-charts-v1';

interface Props {
  income: number;
  expenses: number;
  byCategory: { name: string; value: number; color: string }[];
}

export default function ChartsSection({ income, expenses, byCategory }: Props) {
  const [enabled, setEnabled] = useState<ChartId[]>(DEFAULTS);
  const { data: monthly = [], isLoading } = useMonthlyAggregates(6);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) setEnabled(parsed); } catch {}
    }
  }, []);

  const toggle = (id: ChartId) => {
    setEnabled(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Análises</h2>
          <p className="text-xs text-muted-foreground">Acompanhe sua saúde financeira</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-full"><SlidersHorizontal className="size-4 mr-1.5" />Personalizar</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader><SheetTitle>Escolha seus gráficos</SheetTitle></SheetHeader>
            <ul className="mt-4 space-y-2">
              {CHART_META.map(c => (
                <li key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-card grid place-items-center text-primary"><c.icon className="size-4" /></div>
                    <span className="text-sm font-medium">{c.label}</span>
                  </div>
                  <Switch checked={enabled.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                </li>
              ))}
            </ul>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-3">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : enabled.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-8">Nenhum gráfico selecionado.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {enabled.includes('entradasSaidas') && <EntradasVsSaidasChart income={income} expenses={expenses} delay={0} />}
          {enabled.includes('porCategoria') && <GastosPorCategoriaChart data={byCategory} delay={60} />}
          {enabled.includes('evolucao') && <EvolucaoSaldoChart data={monthly} delay={120} />}
          {enabled.includes('desempenho') && <DesempenhoMensalChart data={monthly} delay={180} />}
          {enabled.includes('receitasDespesas') && <ReceitasVsDespesasChart data={monthly} delay={240} />}
          {enabled.includes('historico') && <HistoricoFinanceiroChart data={monthly} delay={300} />}
        </div>
      )}
    </section>
  );
}

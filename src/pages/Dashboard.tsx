import { useState } from 'react';
import { todayKey, monthLabel, fmtMoney } from '@/lib/format';
import { useMonth, useBills, useIncomesExtra, useSavings, useCategories } from '@/hooks/useFinance';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [monthKey] = useState(todayKey());
  const { data: month } = useMonth(monthKey);
  const { data: bills = [] } = useBills(month?.id);
  const { data: extras = [] } = useIncomesExtra(month?.id);
  const { data: savings } = useSavings(month?.id);
  const { data: categories = [] } = useCategories();

  if (!month) return <div className="p-4 space-y-3"><Skeleton className="h-32" /><Skeleton className="h-40" /></div>;

  const totalIncome = Number(month.income) + extras.reduce((s, e) => s + Number(e.amount), 0);
  const totalBills = bills.reduce((s, b) => s + Number(b.amount), 0);
  const paidBills = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.amount), 0);
  const balance = totalIncome - totalBills - Number(month.savings_contrib);
  const billsProgress = totalBills > 0 ? (paidBills / totalBills) * 100 : 0;

  const byCategory = categories.map(c => {
    const sum = bills.filter(b => b.category === c.name).reduce((s, b) => s + Number(b.amount), 0);
    return { ...c, sum };
  }).filter(c => c.sum > 0).sort((a, b) => b.sum - a.sum);

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-5">
      <header>
        <p className="text-sm text-muted-foreground">{monthLabel(monthKey)}</p>
        <h1 className="text-2xl md:text-3xl font-bold">Olá! 👋</h1>
      </header>

      {/* Hero balance */}
      <Card className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <p className="text-sm opacity-90">Saldo do mês</p>
        <p className="text-3xl md:text-4xl font-bold mt-1">{fmtMoney(balance)}</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <p className="text-xs opacity-80 flex items-center gap-1"><TrendingUp className="size-3" /> Renda</p>
            <p className="font-semibold">{fmtMoney(totalIncome)}</p>
          </div>
          <div>
            <p className="text-xs opacity-80 flex items-center gap-1"><TrendingDown className="size-3" /> Despesas</p>
            <p className="font-semibold">{fmtMoney(totalBills)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><PiggyBank className="size-4" /> Poupança</div>
          <p className="text-xl font-bold mt-1">{fmtMoney(savings?.total ?? 0)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Wallet className="size-4" /> Este mês</div>
          <p className="text-xl font-bold mt-1">{fmtMoney(Number(month.savings_contrib))}</p>
        </Card>
      </div>

      {/* Bills progress */}
      <Card className="p-5">
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="font-semibold">Contas pagas</h2>
          <span className="text-sm text-muted-foreground">{fmtMoney(paidBills)} / {fmtMoney(totalBills)}</span>
        </div>
        <Progress value={billsProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{bills.filter(b => b.paid).length} de {bills.length} contas pagas</p>
      </Card>

      {/* By category */}
      <Card className="p-5">
        <h2 className="font-semibold mb-3">Despesas por categoria</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem despesas neste mês ainda.</p>
        ) : (
          <ul className="space-y-3">
            {byCategory.map(c => {
              const pct = totalBills > 0 ? (c.sum / totalBills) * 100 : 0;
              return (
                <li key={c.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{fmtMoney(c.sum)} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

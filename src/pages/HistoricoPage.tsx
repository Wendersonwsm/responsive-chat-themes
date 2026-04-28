import { useAllMonths } from '@/hooks/useFinance';
import { Card } from '@/components/ui/card';
import { fmtMoney, monthLabel } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export default function HistoricoPage() {
  const { user } = useAuth();
  const { data: months = [] } = useAllMonths();

  const { data: bills = [] } = useQuery({
    queryKey: ['all-bills', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('bills').select('month_id, amount');
      return data || [];
    },
  });
  const { data: extras = [] } = useQuery({
    queryKey: ['all-extras', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('incomes_extra').select('month_id, amount');
      return data || [];
    },
  });

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Histórico</h1>
      {months.length === 0 && <Card className="p-6 text-center text-muted-foreground text-sm">Nenhum mês registrado.</Card>}
      <ul className="space-y-2">
        {months.map(m => {
          const billsTotal = bills.filter((b: any) => b.month_id === m.id).reduce((s: number, b: any) => s + Number(b.amount), 0);
          const extraTotal = extras.filter((e: any) => e.month_id === m.id).reduce((s: number, e: any) => s + Number(e.amount), 0);
          const incomeTotal = Number(m.income) + extraTotal;
          const balance = incomeTotal - billsTotal - Number(m.savings_contrib);
          return (
            <Card key={m.id} className="p-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold">{monthLabel(m.year_month)}</h3>
                <span className={`font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtMoney(balance)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                <div>Renda: <span className="text-foreground font-medium">{fmtMoney(incomeTotal)}</span></div>
                <div>Despesas: <span className="text-foreground font-medium">{fmtMoney(billsTotal)}</span></div>
              </div>
            </Card>
          );
        })}
      </ul>
    </div>
  );
}

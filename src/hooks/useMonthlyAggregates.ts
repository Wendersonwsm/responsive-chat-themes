import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { shiftMonth, todayKey, shortMonthLabel } from '@/lib/format';

export interface MonthlyAgg {
  monthKey: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
  balance: number; // cumulative
}

/** Aggregates last N months including current. */
export function useMonthlyAggregates(months = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['monthly-aggregates', user?.id, months],
    enabled: !!user,
    queryFn: async (): Promise<MonthlyAgg[]> => {
      const keys: string[] = [];
      for (let i = months - 1; i >= 0; i--) keys.push(shiftMonth(todayKey(), -i));

      const { data: monthRows } = await supabase.from('months').select('*').in('year_month', keys);
      const rows = monthRows || [];
      const ids = rows.map((m: any) => m.id);
      const [billsRes, extrasRes, savingsRes] = await Promise.all([
        ids.length ? supabase.from('bills').select('month_id, amount').in('month_id', ids) : Promise.resolve({ data: [] as any[] }),
        ids.length ? supabase.from('incomes_extra').select('month_id, amount').in('month_id', ids) : Promise.resolve({ data: [] as any[] }),
        ids.length ? supabase.from('savings_log').select('month_id, amount, kind').in('month_id', ids) : Promise.resolve({ data: [] as any[] }),
      ]);
      const bills = (billsRes as any).data || [];
      const extras = (extrasRes as any).data || [];
      const savings = (savingsRes as any).data || [];

      let cumBalance = 0;
      const result: MonthlyAgg[] = keys.map((k) => {
        const m = rows.find((r: any) => r.year_month === k);
        if (!m) {
          return { monthKey: k, label: shortMonthLabel(k), income: 0, expenses: 0, savings: 0, balance: cumBalance };
        }
        const expenses = bills.filter((b: any) => b.month_id === m.id).reduce((s: number, b: any) => s + Number(b.amount), 0);
        const extra = extras.filter((e: any) => e.month_id === m.id).reduce((s: number, e: any) => s + Number(e.amount), 0);
        const income = Number(m.income) + extra;
        const savingsNet = savings.filter((r: any) => r.month_id === m.id)
          .reduce((s: number, r: any) => s + (r.kind === 'add' ? Number(r.amount) : -Number(r.amount)), 0);
        const monthBalance = income - expenses - savingsNet;
        cumBalance += monthBalance;
        return { monthKey: k, label: shortMonthLabel(k), income, expenses, savings: savingsNet, balance: cumBalance };
      });
      return result;
    },
  });
}

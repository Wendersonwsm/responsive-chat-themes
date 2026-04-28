import { useState, FormEvent, useEffect } from 'react';
import { todayKey, monthLabel, fmtMoney, shiftMonth } from '@/lib/format';
import { useMonth, useIncomesExtra, useInvalidate } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RendaPage() {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState(todayKey());
  const { data: month } = useMonth(monthKey);
  const { data: extras = [] } = useIncomesExtra(month?.id);
  const [income, setIncome] = useState('');
  const invalidate = useInvalidate();

  useEffect(() => { if (month) setIncome(String(month.income || '')); }, [month?.id]);

  const saveIncome = async () => {
    if (!month) return;
    await supabase.from('months').update({ income: Number(income) || 0 }).eq('id', month.id);
    invalidate();
    toast.success('Renda atualizada');
  };

  const addExtra = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !month) return;
    const fd = new FormData(e.currentTarget);
    const description = String(fd.get('description') || '').trim();
    const amount = Number(fd.get('amount') || 0);
    if (!description || amount <= 0) return;
    await supabase.from('incomes_extra').insert({ user_id: user.id, month_id: month.id, description, amount });
    (e.target as HTMLFormElement).reset();
    invalidate();
  };

  const removeExtra = async (id: string) => {
    await supabase.from('incomes_extra').delete().eq('id', id);
    invalidate();
  };

  const total = (Number(month?.income) || 0) + extras.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Renda</h1>

      <Card className="p-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonthKey(shiftMonth(monthKey, -1))}><ChevronLeft /></Button>
        <span className="font-medium">{monthLabel(monthKey)}</span>
        <Button variant="ghost" size="icon" onClick={() => setMonthKey(shiftMonth(monthKey, 1))}><ChevronRight /></Button>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-success/90 to-success text-success-foreground border-0">
        <p className="text-sm opacity-90">Total recebido</p>
        <p className="text-3xl font-bold mt-1">{fmtMoney(total)}</p>
      </Card>

      <Card className="p-4 space-y-2">
        <Label>Renda principal</Label>
        <div className="flex gap-2">
          <Input type="number" step="0.01" value={income} onChange={e => setIncome(e.target.value)} />
          <Button onClick={saveIncome}>Salvar</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Rendas extras</h2>
        <form onSubmit={addExtra} className="grid grid-cols-[1fr_120px_auto] gap-2">
          <Input name="description" placeholder="Descrição" required />
          <Input name="amount" type="number" step="0.01" placeholder="Valor" required />
          <Button size="icon"><Plus className="size-4" /></Button>
        </form>
        <ul className="space-y-2">
          {extras.length === 0 && <p className="text-sm text-muted-foreground">Sem rendas extras.</p>}
          {extras.map(x => (
            <li key={x.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
              <span className="text-sm">{x.description}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{fmtMoney(Number(x.amount))}</span>
                <button onClick={() => removeExtra(x.id)} className="text-destructive"><Trash2 className="size-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

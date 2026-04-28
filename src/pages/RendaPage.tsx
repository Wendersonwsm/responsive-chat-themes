import { useState, FormEvent, useEffect, useMemo } from 'react';
import { todayKey, monthLabel, fmtMoney, shiftMonth } from '@/lib/format';
import { useMonth, useIncomesExtra, useInvalidate, useAllMonths } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Plus, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];
const PRESETS = ['Freelance', 'Bônus', 'Cashback', 'Vale', 'Venda', 'Restituição', '13º', 'Investimento'];

export default function RendaPage() {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState(todayKey());
  const { data: month } = useMonth(monthKey);
  const { data: extras = [] } = useIncomesExtra(month?.id);
  const { data: allMonths = [] } = useAllMonths();
  const [income, setIncome] = useState('');
  const [extraDesc, setExtraDesc] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const invalidate = useInvalidate();

  useEffect(() => { if (month) setIncome(String(month.income || '')); }, [month?.id]);

  // Sugestão da última renda principal usada
  const lastIncome = useMemo(() => {
    const m = allMonths.find(m => m.year_month !== monthKey && Number(m.income) > 0);
    return m ? Number(m.income) : 0;
  }, [allMonths, monthKey]);

  const saveIncome = async (value?: number) => {
    if (!month) return;
    const v = value !== undefined ? value : Number(income) || 0;
    setIncome(String(v));
    await supabase.from('months').update({ income: v }).eq('id', month.id);
    invalidate();
    toast.success('Renda atualizada');
  };

  const addExtra = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!user || !month) return;
    const description = extraDesc.trim();
    const amount = Number(extraAmount);
    if (!description || amount <= 0) { toast.error('Preencha descrição e valor'); return; }
    await supabase.from('incomes_extra').insert({ user_id: user.id, month_id: month.id, description, amount });
    setExtraDesc(''); setExtraAmount('');
    invalidate();
    toast.success('Renda extra adicionada');
  };

  const removeExtra = async (id: string) => {
    await supabase.from('incomes_extra').delete().eq('id', id);
    invalidate();
  };

  const total = (Number(month?.income) || 0) + extras.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-3xl mx-auto space-y-3 pb-24">
      <h1 className="text-xl md:text-2xl font-bold">Renda</h1>

      <Card className="p-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMonthKey(shiftMonth(monthKey, -1))}><ChevronLeft /></Button>
        <span className="font-medium text-sm">{monthLabel(monthKey)}</span>
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMonthKey(shiftMonth(monthKey, 1))}><ChevronRight /></Button>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-success/90 to-success text-success-foreground border-0">
        <p className="text-sm opacity-90">Total recebido</p>
        <p className="text-3xl font-bold mt-1">{fmtMoney(total)}</p>
      </Card>

      <Card className="p-4 space-y-3">
        <Label className="text-base">Renda principal</Label>
        <div className="flex gap-2">
          <Input type="number" inputMode="decimal" step="0.01" value={income}
            onChange={e => setIncome(e.target.value)} className="h-12 text-base" placeholder="0,00" />
          <Button onClick={() => saveIncome()} className="h-12 px-5">Salvar</Button>
        </div>
        {lastIncome > 0 && Number(income) !== lastIncome && (
          <button onClick={() => saveIncome(lastIncome)}
            className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent active:scale-[0.98] transition">
            <Sparkles className="size-3.5" /> Repetir do mês anterior: {fmtMoney(lastIncome)}
          </button>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-base">Rendas extras</h2>
        <form onSubmit={addExtra} className="space-y-3">
          <Input placeholder="Descrição (ex: Freelance)" value={extraDesc}
            onChange={e => setExtraDesc(e.target.value)} className="h-11 text-base" />
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(p => (
              <button type="button" key={p} onClick={() => setExtraDesc(p)}
                className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-accent active:scale-95 transition">
                {p}
              </button>
            ))}
          </div>
          <Input type="number" inputMode="decimal" step="0.01" placeholder="Valor"
            value={extraAmount} onChange={e => setExtraAmount(e.target.value)} className="h-11 text-base" />
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map(v => (
              <button type="button" key={v} onClick={() => setExtraAmount(String(v))}
                className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-accent active:scale-95 transition">
                R$ {v}
              </button>
            ))}
          </div>
          <Button type="submit" className="w-full h-11"><Plus className="size-4 mr-1" /> Adicionar</Button>
        </form>
        <ul className="space-y-2 pt-2">
          {extras.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Sem rendas extras.</p>}
          {extras.map(x => (
            <li key={x.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium truncate">{x.description}</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">{fmtMoney(Number(x.amount))}</span>
                <button onClick={() => removeExtra(x.id)}
                  className="size-9 grid place-items-center text-destructive active:scale-90"><Trash2 className="size-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

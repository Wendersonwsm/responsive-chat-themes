import { useState, FormEvent } from 'react';
import { useSavings, useInvalidate, useMonth } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fmtMoney, todayKey, monthLabel, shiftMonth } from '@/lib/format';
import { PiggyBank, Plus, Minus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const QUICK = [50, 100, 200, 500, 1000];

export default function PoupancaPage() {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState(todayKey());
  const { data: month } = useMonth(monthKey);
  const { data: savings } = useSavings(month?.id);
  const [kind, setKind] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const invalidate = useInvalidate();

  const recomputeMonthContrib = async (monthId: string) => {
    const { data } = await supabase.from('savings_log').select('kind,amount').eq('month_id', monthId);
    const net = (data || []).reduce((s, r: any) => s + (r.kind === 'add' ? Number(r.amount) : -Number(r.amount)), 0);
    await supabase.from('months').update({ savings_contrib: net }).eq('id', monthId);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !month) return;
    const amt = Number(amount);
    if (amt <= 0) return toast.error('Informe um valor');
    await supabase.from('savings_log').insert({
      user_id: user.id, kind, amount: amt, note: note || null, month_id: month.id,
    });
    await recomputeMonthContrib(month.id);
    setAmount(''); setNote('');
    invalidate();
    toast.success(kind === 'add' ? 'Adicionado à poupança' : 'Retirado da poupança');
  };

  const removeEntry = async (r: any) => {
    await supabase.from('savings_log').delete().eq('id', r.id);
    if (r.month_id) await recomputeMonthContrib(r.month_id);
    invalidate();
    toast.success('Movimentação removida');
  };

  const monthNet = savings?.monthNet ?? 0;

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-3xl mx-auto space-y-3 pb-24">
      <h1 className="text-xl md:text-2xl font-bold">Poupança</h1>

      <Card className="p-6 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground border-0 text-center">
        <PiggyBank className="size-8 mx-auto mb-2" />
        <p className="text-sm opacity-90">Saldo total</p>
        <p className="text-4xl font-bold mt-1">{fmtMoney(savings?.total ?? 0)}</p>
      </Card>

      <Card className="p-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMonthKey(shiftMonth(monthKey, -1))}><ChevronLeft /></Button>
        <span className="font-medium text-sm">{monthLabel(monthKey)}</span>
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMonthKey(shiftMonth(monthKey, 1))}><ChevronRight /></Button>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Movimentado neste mês (afeta o saldo do mês)</p>
        <p className={`text-2xl font-bold mt-1 ${monthNet >= 0 ? 'text-success' : 'text-destructive'}`}>
          {monthNet >= 0 ? '+' : ''}{fmtMoney(monthNet)}
        </p>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <Button variant={kind === 'add' ? 'default' : 'outline'} className="flex-1 h-11" onClick={() => setKind('add')}>
            <Plus className="size-4 mr-1" />Adicionar
          </Button>
          <Button variant={kind === 'withdraw' ? 'default' : 'outline'} className="flex-1 h-11" onClick={() => setKind('withdraw')}>
            <Minus className="size-4 mr-1" />Retirar
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Valor</Label>
            <Input type="number" inputMode="decimal" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} className="h-11 text-base" required placeholder="0,00" />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {QUICK.map(v => (
                <button type="button" key={v} onClick={() => setAmount(String(v))}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-accent active:scale-95 transition">
                  R$ {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} className="h-11 text-base" />
          </div>
          <Button type="submit" className="w-full h-11">Confirmar</Button>
        </form>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Histórico</h2>
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {savings?.log.length === 0 && <p className="text-sm text-muted-foreground">Sem movimentações ainda.</p>}
          {savings?.log.map((r: any) => (
            <li key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="min-w-0">
                <p className="text-sm font-medium">{r.kind === 'add' ? '+ Depósito' : '− Retirada'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}{r.note ? ` · ${r.note}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-semibold text-sm ${r.kind === 'add' ? 'text-success' : 'text-destructive'}`}>
                  {r.kind === 'add' ? '+' : '−'}{fmtMoney(Number(r.amount))}
                </span>
                <button onClick={() => removeEntry(r)} className="size-9 grid place-items-center text-destructive active:scale-90">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

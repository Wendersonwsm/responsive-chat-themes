import { useState, FormEvent } from 'react';
import { useSavings, useInvalidate } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fmtMoney } from '@/lib/format';
import { PiggyBank, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function PoupancaPage() {
  const { user } = useAuth();
  const { data: savings } = useSavings();
  const [kind, setKind] = useState<'add' | 'withdraw'>('add');
  const invalidate = useInvalidate();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get('amount') || 0);
    const note = String(fd.get('note') || '');
    if (amount <= 0) return toast.error('Informe um valor');
    await supabase.from('savings_log').insert({ user_id: user.id, kind, amount, note: note || null });
    (e.target as HTMLFormElement).reset();
    invalidate();
    toast.success(kind === 'add' ? 'Adicionado à poupança' : 'Retirado da poupança');
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Poupança</h1>

      <Card className="p-6 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground border-0 text-center">
        <PiggyBank className="size-8 mx-auto mb-2" />
        <p className="text-sm opacity-90">Saldo total</p>
        <p className="text-4xl font-bold mt-1">{fmtMoney(savings?.total ?? 0)}</p>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <Button variant={kind === 'add' ? 'default' : 'outline'} className="flex-1" onClick={() => setKind('add')}>
            <Plus className="size-4 mr-1" />Adicionar
          </Button>
          <Button variant={kind === 'withdraw' ? 'default' : 'outline'} className="flex-1" onClick={() => setKind('withdraw')}>
            <Minus className="size-4 mr-1" />Retirar
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Valor</Label><Input name="amount" type="number" step="0.01" required /></div>
          <div><Label>Nota (opcional)</Label><Input name="note" /></div>
          <Button type="submit" className="w-full">Confirmar</Button>
        </form>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Histórico</h2>
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {savings?.log.length === 0 && <p className="text-sm text-muted-foreground">Sem movimentações ainda.</p>}
          {savings?.log.map((r: any) => (
            <li key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
              <div>
                <p className="text-sm font-medium">{r.kind === 'add' ? '+ Depósito' : '− Retirada'}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}{r.note ? ` · ${r.note}` : ''}</p>
              </div>
              <span className={`font-semibold ${r.kind === 'add' ? 'text-success' : 'text-destructive'}`}>
                {r.kind === 'add' ? '+' : '−'}{fmtMoney(Number(r.amount))}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

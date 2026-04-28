import { useState, FormEvent } from 'react';
import { todayKey, monthLabel, fmtMoney, shiftMonth, mkKey, parseKey } from '@/lib/format';
import { useMonth, useBills, useCategories, useInvalidate } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ChevronLeft, ChevronRight, Trash2, Check, Repeat, Layers } from 'lucide-react';
import { toast } from 'sonner';

type Filter = 'current' | 'overdue' | 'paid' | 'all';

export default function ContasPage() {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState(todayKey());
  const [filter, setFilter] = useState<Filter>('current');
  const [open, setOpen] = useState(false);
  const { data: month } = useMonth(monthKey);
  const { data: bills = [] } = useBills(month?.id);
  const { data: categories = [] } = useCategories();
  const invalidate = useInvalidate();

  const today = new Date();
  const { year, month: mIdx } = parseKey(monthKey);
  const filtered = bills.filter(b => {
    if (filter === 'paid') return b.paid;
    if (filter === 'overdue') return !b.paid && b.due_day && new Date(year, mIdx, b.due_day) < today;
    if (filter === 'current') return !b.paid;
    return true;
  });

  const togglePaid = async (id: string, paid: boolean) => {
    await supabase.from('bills').update({ paid: !paid }).eq('id', id);
    invalidate();
  };
  const remove = async (id: string) => {
    await supabase.from('bills').delete().eq('id', id);
    invalidate();
    toast.success('Conta removida');
  };

  const addBill = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !month) return;
    const f = e.currentTarget;
    const fd = new FormData(f);
    const description = String(fd.get('description') || '').trim();
    const amount = Number(fd.get('amount') || 0);
    const category = String(fd.get('category') || '');
    const subcategory = String(fd.get('subcategory') || '') || null;
    const due_day = Number(fd.get('due_day') || 0) || null;
    const is_recurring = fd.get('is_recurring') === 'on';
    const installment_total = Number(fd.get('installment_total') || 0) || null;

    if (!description || amount <= 0 || !category) {
      toast.error('Preencha descrição, valor e categoria');
      return;
    }

    if (installment_total && installment_total > 1) {
      // Cria N parcelas, uma por mês
      const rows = [];
      for (let i = 0; i < installment_total; i++) {
        const ymKey = shiftMonth(monthKey, i);
        const { data: m } = await supabase.from('months')
          .upsert({ user_id: user.id, year_month: ymKey }, { onConflict: 'user_id,year_month' })
          .select('id').single();
        if (m) rows.push({
          user_id: user.id, month_id: m.id, category, subcategory,
          description, amount, due_day,
          installment_current: i + 1, installment_total, is_recurring: false,
        });
      }
      await supabase.from('bills').insert(rows);
    } else {
      await supabase.from('bills').insert({
        user_id: user.id, month_id: month.id, category, subcategory,
        description, amount, due_day, is_recurring,
      });
    }
    invalidate();
    setOpen(false);
    toast.success('Conta adicionada');
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contas</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm"><Plus className="size-4 mr-1" />Nova</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
            <SheetHeader><SheetTitle>Nova conta</SheetTitle></SheetHeader>
            <form onSubmit={addBill} className="space-y-3 mt-4">
              <div><Label>Descrição</Label><Input name="description" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor</Label><Input name="amount" type="number" step="0.01" required /></div>
                <div><Label>Vence dia</Label><Input name="due_day" type="number" min={1} max={31} /></div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select name="category" required>
                  <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Subcategoria (opcional)</Label><Input name="subcategory" /></div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <Label className="flex items-center gap-2 m-0"><Repeat className="size-4" /> Recorrente</Label>
                <Switch name="is_recurring" />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Layers className="size-4" /> Parcelas (deixe vazio se não for)</Label>
                <Input name="installment_total" type="number" min={2} max={60} placeholder="Ex: 12" />
              </div>
              <Button type="submit" className="w-full">Adicionar</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="p-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonthKey(shiftMonth(monthKey, -1))}><ChevronLeft /></Button>
        <span className="font-medium">{monthLabel(monthKey)}</span>
        <Button variant="ghost" size="icon" onClick={() => setMonthKey(shiftMonth(monthKey, 1))}><ChevronRight /></Button>
      </Card>

      <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="current">Atuais</TabsTrigger>
          <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
          <TabsTrigger value="paid">Pagas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      <ul className="space-y-2">
        {filtered.length === 0 && <Card className="p-6 text-center text-muted-foreground text-sm">Nenhuma conta neste filtro.</Card>}
        {filtered.map(b => {
          const cat = categories.find(c => c.name === b.category);
          return (
            <Card key={b.id} className="p-3 flex items-center gap-3">
              <button onClick={() => togglePaid(b.id, b.paid)}
                className={`size-9 rounded-full grid place-items-center shrink-0 transition ${b.paid ? 'bg-success text-success-foreground' : 'bg-muted'}`}>
                <Check className="size-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium truncate ${b.paid ? 'line-through text-muted-foreground' : ''}`}>{b.description}</p>
                  {b.installment_total && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{b.installment_current}/{b.installment_total}</span>}
                  {b.is_recurring && <Repeat className="size-3 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span style={{ color: cat?.color }}>●</span> {b.category}{b.subcategory ? ` · ${b.subcategory}` : ''}{b.due_day ? ` · dia ${b.due_day}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{fmtMoney(Number(b.amount))}</p>
                <button onClick={() => remove(b.id)} className="text-destructive text-xs mt-1"><Trash2 className="size-3.5 inline" /></button>
              </div>
            </Card>
          );
        })}
      </ul>
    </div>
  );
}

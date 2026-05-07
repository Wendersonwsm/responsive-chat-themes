import { useState, FormEvent, useMemo, useEffect } from 'react';
import { todayKey, monthLabel, fmtMoney, shiftMonth, parseKey } from '@/lib/format';
import { useMonth, useBills, useCategories, useInvalidate } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ChevronLeft, ChevronRight, Trash2, Check, Repeat, Layers, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCategoryIcon } from '@/lib/categoryIcons';

type Filter = 'current' | 'overdue' | 'paid' | 'all';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function ContasPage() {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState(todayKey());
  const [filter, setFilter] = useState<Filter>('current');
  const [open, setOpen] = useState(false);
  const { data: month } = useMonth(monthKey);
  const { data: bills = [] } = useBills(month?.id);
  const { data: categories = [] } = useCategories();
  const invalidate = useInvalidate();

  // Form state
  const [description, setDescription] = useState('');
  const [descTouched, setDescTouched] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [installments, setInstallments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const selectedCat = categories.find(c => c.name === category);

  const recentDescriptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    [...bills].reverse().forEach(b => {
      if (!seen.has(b.description.toLowerCase())) {
        seen.add(b.description.toLowerCase());
        list.push(b.description);
      }
    });
    return list.slice(0, 6);
  }, [bills]);

  // Auto-preenche valor/categoria/dia se descrição já foi usada antes
  useEffect(() => {
    if (!description) return;
    const match = bills.find(b => b.description.toLowerCase() === description.toLowerCase());
    if (match) {
      if (!amount) setAmount(String(match.amount));
      if (!category) setCategory(match.category);
      if (!dueDay && match.due_day) setDueDay(String(match.due_day));
    }
  }, [description]);

  // Auto-título a partir da categoria/subcategoria
  const pickCategory = (name: string) => {
    setCategory(name);
    setSubcategory('');
    if (!descTouched || !description) {
      setDescription(name);
      setDescTouched(false);
    }
  };
  const pickSubcategory = (sub: string) => {
    const newSub = subcategory === sub ? '' : sub;
    setSubcategory(newSub);
    if (!descTouched || description === category || description === `${category} · ${subcategory}`) {
      setDescription(newSub ? `${category} · ${newSub}` : category);
      setDescTouched(false);
    }
  };

  const resetForm = () => {
    setDescription(''); setDescTouched(false); setAmount(''); setCategory(''); setSubcategory('');
    setDueDay(''); setIsRecurring(false); setInstallments('');
  };

  const today = new Date();
  const { year, month: mIdx } = parseKey(monthKey);
  const filtered = bills.filter(b => {
    if (filter === 'paid') return b.paid;
    if (filter === 'overdue') return !b.paid && b.due_day && new Date(year, mIdx, b.due_day) < today;
    if (filter === 'current') return !b.paid;
    return true;
  });

  const totalPending = bills.filter(b => !b.paid).reduce((s, b) => s + Number(b.amount), 0);
  const totalPaid = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.amount), 0);

  const togglePaid = async (id: string, paid: boolean) => {
    setBusyId(id);
    const t = toast.loading(paid ? 'Marcando como pendente...' : 'Marcando como paga...');
    try {
      await supabase.from('bills').update({ paid: !paid }).eq('id', id);
      invalidate();
      toast.success(paid ? 'Conta pendente' : 'Conta paga', { id: t });
    } catch {
      toast.error('Não foi possível atualizar', { id: t });
    } finally {
      setBusyId(null);
    }
  };
  const remove = async (id: string) => {
    setBusyId(id);
    const t = toast.loading('Removendo conta...');
    try {
      await supabase.from('bills').delete().eq('id', id);
      invalidate();
      toast.success('Conta removida', { id: t });
    } catch {
      toast.error('Não foi possível remover', { id: t });
    } finally {
      setBusyId(null);
    }
  };

  const duplicate = async (b: any) => {
    if (!user || !month) return;
    setBusyId(b.id);
    const t = toast.loading('Duplicando conta...');
    try {
      await supabase.from('bills').insert({
        user_id: user.id, month_id: month.id,
        category: b.category, subcategory: b.subcategory,
        description: b.description, amount: b.amount, due_day: b.due_day,
        is_recurring: false, paid: false,
      });
      invalidate();
      toast.success('Conta duplicada', { id: t });
    } catch {
      toast.error('Não foi possível duplicar', { id: t });
    } finally {
      setBusyId(null);
    }
  };

  const addBill = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !month || submitting) return;
    const amt = Number(amount);
    if (!description.trim() || amt <= 0 || !category) {
      toast.error('Preencha descrição, valor e categoria');
      return;
    }
    const due_day = Number(dueDay) || null;
    const installment_total = Number(installments) || null;

    setSubmitting(true);
    const t = toast.loading(installment_total && installment_total > 1 ? 'Criando parcelas...' : 'Adicionando conta...');
    try {
      if (installment_total && installment_total > 1) {
        const rows = [];
        for (let i = 0; i < installment_total; i++) {
          const ymKey = shiftMonth(monthKey, i);
          const { data: m } = await supabase.from('months')
            .upsert({ user_id: user.id, year_month: ymKey }, { onConflict: 'user_id,year_month' })
            .select('id').single();
          if (m) rows.push({
            user_id: user.id, month_id: m.id, category, subcategory: subcategory || null,
            description, amount: amt, due_day,
            installment_current: i + 1, installment_total, is_recurring: false,
          });
        }
        const { error } = await supabase.from('bills').insert(rows);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bills').insert({
          user_id: user.id, month_id: month.id, category, subcategory: subcategory || null,
          description, amount: amt, due_day, is_recurring: isRecurring,
        });
        if (error) throw error;
      }
      invalidate();
      setOpen(false);
      resetForm();
      toast.success('Conta adicionada', { id: t });
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível adicionar a conta', { id: t });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-5xl mx-auto space-y-3 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">Contas</h1>
        <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <SheetTrigger asChild>
            <Button size="sm" className="h-10 px-4"><Plus className="size-4 mr-1" />Nova</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl">
            <SheetHeader><SheetTitle>Nova conta</SheetTitle></SheetHeader>
            <form onSubmit={addBill} className="space-y-4 mt-4">
              <div>
                <Label>Categoria</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1.5">
                  {categories.map(c => {
                    const Icon = getCategoryIcon(c.icon);
                    const active = category === c.name;
                    return (
                      <button type="button" key={c.id} onClick={() => pickCategory(c.name)}
                        className={`relative p-2.5 rounded-xl border-2 text-center transition active:scale-95 overflow-hidden ${
                          active ? 'border-transparent text-white shadow-md' : 'border-border bg-card hover:border-muted-foreground/30'
                        }`}
                        style={active ? { background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)` } : undefined}>
                        <div className="size-9 mx-auto rounded-lg grid place-items-center mb-1.5"
                          style={{ background: active ? 'rgba(255,255,255,0.22)' : `${c.color}1a`, color: active ? '#fff' : c.color }}>
                          <Icon className="size-5" />
                        </div>
                        <span className="text-[11px] font-medium block leading-tight">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedCat && selectedCat.subcategories?.length > 0 && (
                <div>
                  <Label>Subcategoria</Label>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {selectedCat.subcategories.map(s => (
                      <button type="button" key={s} onClick={() => pickSubcategory(s)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition active:scale-95 ${
                          subcategory === s ? 'text-white border-transparent' : 'bg-muted border-transparent'
                        }`}
                        style={subcategory === s ? { background: selectedCat.color } : undefined}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Descrição</Label>
                <Input list="recent-descs" value={description}
                  onChange={e => { setDescription(e.target.value); setDescTouched(true); }}
                  className="h-11 text-base" required placeholder="Ex: Aluguel, Netflix…" />
                <datalist id="recent-descs">
                  {recentDescriptions.map(d => <option key={d} value={d} />)}
                </datalist>
                {recentDescriptions.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {recentDescriptions.slice(0, 4).map(d => (
                      <button type="button" key={d} onClick={() => { setDescription(d); setDescTouched(true); }}
                        className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-accent active:scale-95 transition">
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Valor</Label>
                <Input type="number" inputMode="decimal" step="0.01" value={amount}
                  onChange={e => setAmount(e.target.value)} className="h-11 text-base" required placeholder="0,00" />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {QUICK_AMOUNTS.map(v => (
                    <button type="button" key={v} onClick={() => setAmount(String(v))}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-accent active:scale-95 transition">
                      R$ {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Vence dia (opcional)</Label>
                <Input type="number" inputMode="numeric" min={1} max={31} value={dueDay}
                  onChange={e => setDueDay(e.target.value)} className="h-11 text-base" placeholder="Ex: 10" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <Label className="flex items-center gap-2 m-0 cursor-pointer">
                  <Repeat className="size-4" /> Repetir todo mês
                </Label>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>

              <div>
                <Label className="flex items-center gap-2"><Layers className="size-4" /> Parcelas</Label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {['', '2', '3', '6', '12', '24'].map(n => (
                    <button type="button" key={n || 'none'} onClick={() => setInstallments(n)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition active:scale-95 ${
                        installments === n ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent'
                      }`}>
                      {n ? `${n}x` : 'Sem'}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-semibold">
                {submitting ? (<><Loader2 className="size-4 mr-2 animate-spin" />Adicionando...</>) : 'Adicionar conta'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">A pagar</p>
          <p className="text-lg font-bold text-destructive">{fmtMoney(totalPending)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Pago</p>
          <p className="text-lg font-bold text-success">{fmtMoney(totalPaid)}</p>
        </Card>
      </div>

      <Card className="p-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMonthKey(shiftMonth(monthKey, -1))}><ChevronLeft /></Button>
        <span className="font-medium text-sm">{monthLabel(monthKey)}</span>
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMonthKey(shiftMonth(monthKey, 1))}><ChevronRight /></Button>
      </Card>

      <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
        <TabsList className="grid grid-cols-4 w-full h-10">
          <TabsTrigger value="current" className="text-xs sm:text-sm">Atuais</TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs sm:text-sm">Atrasadas</TabsTrigger>
          <TabsTrigger value="paid" className="text-xs sm:text-sm">Pagas</TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      <ul className="space-y-2">
        {filtered.length === 0 && <Card className="p-6 text-center text-muted-foreground text-sm">Nenhuma conta neste filtro.</Card>}
        {filtered.map(b => {
          const cat = categories.find(c => c.name === b.category);
          const Icon = getCategoryIcon(cat?.icon);
          const color = cat?.color || 'hsl(var(--muted-foreground))';
          return (
            <Card key={b.id} className="p-3 flex items-center gap-3">
              <button onClick={() => togglePaid(b.id, b.paid)}
                className={`size-11 rounded-full grid place-items-center shrink-0 transition active:scale-90 ${b.paid ? 'bg-success text-success-foreground' : ''}`}
                style={!b.paid ? { background: `${color}1a`, color } : undefined}>
                {b.paid ? <Check className="size-5" /> : <Icon className="size-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-medium truncate ${b.paid ? 'line-through text-muted-foreground' : ''}`}>{b.description}</p>
                  {b.installment_total && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{b.installment_current}/{b.installment_total}</span>}
                  {b.is_recurring && <Repeat className="size-3 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  <span style={{ color }}>●</span> {b.category}{b.subcategory ? ` · ${b.subcategory}` : ''}{b.due_day ? ` · dia ${b.due_day}` : ''}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="font-semibold text-sm">{fmtMoney(Number(b.amount))}</p>
                <div className="flex gap-1">
                  <button onClick={() => duplicate(b)} className="size-8 grid place-items-center text-muted-foreground hover:text-primary active:scale-90"><Copy className="size-3.5" /></button>
                  <button onClick={() => remove(b.id)} className="size-8 grid place-items-center text-destructive active:scale-90"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </ul>
    </div>
  );
}

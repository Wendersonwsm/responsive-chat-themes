import { useState, FormEvent, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, THEMES, ThemeName } from '@/hooks/useTheme';
import { useCategories, useInvalidate } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, Plus, Trash2, Download, Upload, Palette } from 'lucide-react';
import { toast } from 'sonner';

export default function AjustesPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: categories = [] } = useCategories();
  const invalidate = useInvalidate();
  const [openCat, setOpenCat] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const color = String(fd.get('color') || '#2563eb');
    const subs = String(fd.get('subs') || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!name) return;
    await supabase.from('categories').insert({
      user_id: user.id, name, color, icon: 'Tag', subcategories: subs, sort_order: categories.length + 1,
    });
    (e.target as HTMLFormElement).reset();
    invalidate();
    toast.success('Categoria adicionada');
  };

  const removeCat = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    invalidate();
  };

  const exportData = async (format: 'json' | 'csv') => {
    const [m, b, ie, sl, c] = await Promise.all([
      supabase.from('months').select('*'),
      supabase.from('bills').select('*'),
      supabase.from('incomes_extra').select('*'),
      supabase.from('savings_log').select('*'),
      supabase.from('categories').select('*'),
    ]);
    if (format === 'json') {
      const blob = new Blob([JSON.stringify({
        months: m.data, bills: b.data, incomes_extra: ie.data, savings_log: sl.data, categories: c.data,
      }, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `finwise-backup-${Date.now()}.json`);
    } else {
      const months = m.data || [];
      const rows = ['mes,categoria,subcategoria,descricao,valor,vencimento,paga'];
      (b.data || []).forEach((bill: any) => {
        const month = months.find((mm: any) => mm.id === bill.month_id);
        rows.push(`${month?.year_month || ''},${bill.category},${bill.subcategory || ''},"${bill.description}",${bill.amount},${bill.due_day || ''},${bill.paid}`);
      });
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      downloadBlob(blob, `finwise-contas-${Date.now()}.csv`);
    }
    toast.success('Exportado!');
  };

  const importData = async (file: File) => {
    if (!user) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!confirm('Isso vai substituir seus dados atuais. Continuar?')) return;
      // Wipe
      await Promise.all([
        supabase.from('bills').delete().eq('user_id', user.id),
        supabase.from('incomes_extra').delete().eq('user_id', user.id),
        supabase.from('savings_log').delete().eq('user_id', user.id),
        supabase.from('months').delete().eq('user_id', user.id),
      ]);
      // Re-insert with user_id
      const stamp = (rows: any[]) => (rows || []).map(r => ({ ...r, user_id: user.id }));
      if (data.months?.length) await supabase.from('months').insert(stamp(data.months));
      if (data.bills?.length) await supabase.from('bills').insert(stamp(data.bills));
      if (data.incomes_extra?.length) await supabase.from('incomes_extra').insert(stamp(data.incomes_extra));
      if (data.savings_log?.length) await supabase.from('savings_log').insert(stamp(data.savings_log));
      invalidate();
      toast.success('Dados importados!');
    } catch (err: any) {
      toast.error('Arquivo inválido: ' + err.message);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <p className="text-sm text-muted-foreground">{user?.email}</p>

      {/* Themes */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Palette className="size-4" /> Tema</h2>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id as ThemeName)}
              className={`p-3 rounded-xl border-2 transition text-left ${theme === t.id ? 'border-primary' : 'border-border'}`}>
              <div className="h-12 rounded-lg mb-2" style={{ background: t.preview }} />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Categories */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Categorias</h2>
          <Sheet open={openCat} onOpenChange={setOpenCat}>
            <SheetTrigger asChild><Button size="sm" variant="outline"><Plus className="size-4 mr-1" />Nova</Button></SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader><SheetTitle>Nova categoria</SheetTitle></SheetHeader>
              <form onSubmit={(e) => { addCategory(e); setOpenCat(false); }} className="space-y-3 mt-4">
                <div><Label>Nome</Label><Input name="name" required /></div>
                <div><Label>Cor</Label><Input name="color" type="color" defaultValue="#2563eb" /></div>
                <div><Label>Subcategorias (separe por vírgula)</Label><Input name="subs" placeholder="Ex: Mercado, Restaurante" /></div>
                <Button type="submit" className="w-full">Adicionar</Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        <ul className="space-y-2">
          {categories.map(c => (
            <li key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <span className="size-4 rounded" style={{ backgroundColor: c.color }} />
                <span className="text-sm">{c.name}</span>
                {c.subcategories.length > 0 && <span className="text-xs text-muted-foreground">({c.subcategories.length})</span>}
              </div>
              <button onClick={() => removeCat(c.id)} className="text-destructive"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      </Card>

      {/* Export / Import */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Backup</h2>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => exportData('json')}><Download className="size-4 mr-1" />JSON</Button>
          <Button variant="outline" onClick={() => exportData('csv')}><Download className="size-4 mr-1" />CSV</Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
        <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4 mr-1" />Importar JSON
        </Button>
      </Card>

      <Button variant="destructive" className="w-full" onClick={signOut}>
        <LogOut className="size-4 mr-1" />Sair
      </Button>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

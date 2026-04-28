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
import { getCategoryIcon, ICON_OPTIONS, ICON_MAP } from '@/lib/categoryIcons';

const PRESET_COLORS = [
  '#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0ea5e9',
  '#f59e0b','#ec4899','#a855f7','#10b981','#ef4444','#64748b',
  '#8b5cf6','#f43f5e','#0891b2','#6b7280',
];

export default function AjustesPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: categories = [] } = useCategories();
  const invalidate = useInvalidate();
  const [openCat, setOpenCat] = useState(false);
  const [pickedIcon, setPickedIcon] = useState<string>('Tag');
  const [pickedColor, setPickedColor] = useState<string>('#2563eb');
  const fileRef = useRef<HTMLInputElement>(null);

  const addCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const subs = String(fd.get('subs') || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!name) return;
    await supabase.from('categories').insert({
      user_id: user.id, name, color: pickedColor, icon: pickedIcon,
      subcategories: subs, sort_order: categories.length + 1,
    });
    (e.target as HTMLFormElement).reset();
    setPickedIcon('Tag'); setPickedColor('#2563eb');
    invalidate();
    setOpenCat(false);
    toast.success('Categoria adicionada');
  };

  const removeCat = async (id: string) => {
    if (!confirm('Remover esta categoria?')) return;
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
      await Promise.all([
        supabase.from('bills').delete().eq('user_id', user.id),
        supabase.from('incomes_extra').delete().eq('user_id', user.id),
        supabase.from('savings_log').delete().eq('user_id', user.id),
        supabase.from('months').delete().eq('user_id', user.id),
      ]);
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
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-3xl mx-auto space-y-4 pb-24">
      <h1 className="text-xl md:text-2xl font-bold">Ajustes</h1>
      <p className="text-sm text-muted-foreground">{user?.email}</p>

      {/* Themes */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Palette className="size-4" /> Tema</h2>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id as ThemeName)}
              className={`p-3 rounded-xl border-2 transition text-left active:scale-[0.98] ${theme === t.id ? 'border-primary' : 'border-border'}`}>
              <div className="h-12 rounded-lg mb-2" style={{ background: t.preview }} />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Categories */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Categorias <span className="text-xs text-muted-foreground font-normal">({categories.length})</span></h2>
          <Sheet open={openCat} onOpenChange={setOpenCat}>
            <SheetTrigger asChild><Button size="sm" variant="outline" className="h-9"><Plus className="size-4 mr-1" />Nova</Button></SheetTrigger>
            <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl">
              <SheetHeader><SheetTitle>Nova categoria</SheetTitle></SheetHeader>
              <form onSubmit={addCategory} className="space-y-4 mt-4">
                <div>
                  <Label>Nome</Label>
                  <Input name="name" required autoFocus className="h-11 text-base" placeholder="Ex: Mercado" />
                </div>

                <div>
                  <Label>Ícone</Label>
                  <div className="grid grid-cols-6 gap-2 mt-1.5">
                    {ICON_OPTIONS.map(name => {
                      const Icon = ICON_MAP[name];
                      const active = pickedIcon === name;
                      return (
                        <button type="button" key={name} onClick={() => setPickedIcon(name)}
                          className={`aspect-square rounded-lg grid place-items-center border-2 transition active:scale-90 ${
                            active ? 'border-transparent text-white' : 'border-border bg-card'
                          }`}
                          style={active ? { background: pickedColor } : undefined}>
                          <Icon className="size-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Cor</Label>
                  <div className="grid grid-cols-8 gap-2 mt-1.5">
                    {PRESET_COLORS.map(c => (
                      <button type="button" key={c} onClick={() => setPickedColor(c)}
                        className={`aspect-square rounded-lg transition active:scale-90 ${pickedColor === c ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : ''}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Subcategorias <span className="text-xs text-muted-foreground">(separadas por vírgula)</span></Label>
                  <Input name="subs" placeholder="Ex: Mercado, Restaurante" className="h-11 text-base" />
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold">Adicionar</Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map(c => {
            const Icon = getCategoryIcon(c.icon);
            return (
              <div key={c.id} className="relative p-3 rounded-xl border bg-card overflow-hidden group">
                <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${c.color}, transparent)` }} />
                <div className="relative flex items-start gap-2">
                  <div className="size-9 rounded-lg grid place-items-center shrink-0"
                    style={{ background: `${c.color}22`, color: c.color }}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.subcategories.length} subcategorias</p>
                  </div>
                  <button onClick={() => removeCat(c.id)}
                    className="text-destructive opacity-60 hover:opacity-100 active:scale-90">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Export / Import */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Backup</h2>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-11" onClick={() => exportData('json')}><Download className="size-4 mr-1" />JSON</Button>
          <Button variant="outline" className="h-11" onClick={() => exportData('csv')}><Download className="size-4 mr-1" />CSV</Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
        <Button variant="outline" className="w-full h-11" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4 mr-1" />Importar JSON
        </Button>
      </Card>

      <Button variant="destructive" className="w-full h-11" onClick={signOut}>
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

import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useInvalidate } from '@/hooks/useFinance';
import { useTheme, THEMES, ThemeName } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ChevronRight, LogOut, ShieldCheck, Bell, EyeOff, KeyRound, Settings, Palette,
  BadgeCheck, Pencil, Check, X, Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import Avatar from '@/components/Avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

export default function PerfilPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const invalidate = useInvalidate();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.display_name || user?.user_metadata?.username || '');
  const [savingName, setSavingName] = useState(false);
  const [hideValues, setHideValues] = useState(localStorage.getItem('finwise-hide') === '1');
  const [notifications, setNotifications] = useState(localStorage.getItem('finwise-notif') !== '0');
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const displayName = profile?.display_name || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuário';

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    try {
      await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user.id);
      invalidate();
      setEditingName(false);
      toast.success('Nome atualizado');
    } catch {
      toast.error('Não foi possível atualizar');
    } finally { setSavingName(false); }
  };

  const toggleHide = (v: boolean) => {
    setHideValues(v);
    localStorage.setItem('finwise-hide', v ? '1' : '0');
  };
  const toggleNotif = (v: boolean) => {
    setNotifications(v);
    localStorage.setItem('finwise-notif', v ? '1' : '0');
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) { toast.error('Senha deve ter ao menos 6 caracteres'); return; }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success('Senha alterada com sucesso');
      setPwOpen(false);
      setNewPw('');
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível alterar a senha');
    } finally { setPwSaving(false); }
  };

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-3xl mx-auto space-y-4 pb-24">
      {/* Hero profile card */}
      <Card className="relative overflow-hidden p-5 bg-gradient-hero text-primary-foreground border-0 shadow-elevated animate-scale-in">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <Avatar name={displayName} size="xl" status="verified" />
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <Input value={name} onChange={e => setName(e.target.value)} className="h-9 text-base bg-white/20 border-white/30 text-primary-foreground placeholder:text-white/60" autoFocus />
                <button onClick={saveName} disabled={savingName} className="size-9 rounded-full bg-white/20 grid place-items-center"><Check className="size-4" /></button>
                <button onClick={() => { setEditingName(false); setName(displayName); }} className="size-9 rounded-full bg-white/20 grid place-items-center"><X className="size-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold truncate">{displayName}</h1>
                <button onClick={() => setEditingName(true)} className="size-7 rounded-full bg-white/20 grid place-items-center tap-scale"><Pencil className="size-3.5" /></button>
              </div>
            )}
            <p className="text-xs opacity-90 truncate flex items-center gap-1 mt-1"><Mail className="size-3" />{user?.email}</p>
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-medium">
              <BadgeCheck className="size-3" /> Conta verificada
            </div>
          </div>
        </div>
      </Card>

      {/* Quick settings */}
      <Card className="p-4 space-y-2 animate-fade-in">
        <h2 className="font-semibold text-sm flex items-center gap-2"><Settings className="size-4" /> Configurações rápidas</h2>
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-card grid place-items-center text-primary"><EyeOff className="size-4" /></div>
            <div><p className="text-sm font-medium">Ocultar valores</p><p className="text-[11px] text-muted-foreground">Esconde saldos no app</p></div>
          </div>
          <Switch checked={hideValues} onCheckedChange={toggleHide} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-card grid place-items-center text-primary"><Bell className="size-4" /></div>
            <div><p className="text-sm font-medium">Notificações</p><p className="text-[11px] text-muted-foreground">Avisos e alertas</p></div>
          </div>
          <Switch checked={notifications} onCheckedChange={toggleNotif} />
        </div>
      </Card>

      {/* Theme */}
      <Card className="p-4 space-y-3 animate-fade-in">
        <h2 className="font-semibold text-sm flex items-center gap-2"><Palette className="size-4" /> Tema</h2>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id as ThemeName)}
              className={`p-3 rounded-xl border-2 transition text-left active:scale-[0.98] ${theme === t.id ? 'border-primary shadow-soft' : 'border-border'}`}>
              <div className="h-10 rounded-lg mb-2" style={{ background: t.preview }} />
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card className="p-4 animate-fade-in">
        <h2 className="font-semibold text-sm flex items-center gap-2 mb-2"><ShieldCheck className="size-4" /> Segurança</h2>
        <button onClick={() => setPwOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted hover-lift">
          <div className="size-9 rounded-lg bg-card grid place-items-center text-primary"><KeyRound className="size-4" /></div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Alterar senha</p>
            <p className="text-[11px] text-muted-foreground">Atualize sua senha de acesso</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </Card>

      {/* Settings link (categories, backup) */}
      <Card className="p-4 animate-fade-in">
        <Link to="/ajustes" className="flex items-center gap-3 p-3 rounded-xl bg-muted hover-lift">
          <div className="size-9 rounded-lg bg-card grid place-items-center text-primary"><Settings className="size-4" /></div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Categorias e backup</p>
            <p className="text-[11px] text-muted-foreground">Gerencie categorias, exporte/importe</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </Card>

      <Button variant="destructive" className="w-full h-11" onClick={signOut}>
        <LogOut className="size-4 mr-2" />Sair da conta
      </Button>

      <p className="text-[11px] text-muted-foreground text-center">FinWise · v1.0</p>

      {/* Password dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Alterar senha</DialogTitle></DialogHeader>
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <Label>Nova senha</Label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="h-11" minLength={6} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pwSaving} className="w-full">{pwSaving ? 'Salvando...' : 'Atualizar senha'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

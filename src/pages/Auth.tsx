import { useState, FormEvent, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Wallet, Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';

const USER_DOMAIN = 'finwise.local';
const sanitize = (u: string) =>
  u.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);
const toEmail = (u: string) => `${sanitize(u)}@${USER_DOMAIN}`;

export default function Auth() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const firstSignIn = useRef<HTMLInputElement>(null);
  const firstSignUp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      (tab === 'signin' ? firstSignIn : firstSignUp).current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, [tab]);

  if (loading) return <div className="min-h-[100dvh] grid place-items-center text-sm text-muted-foreground">Carregando…</div>;
  if (user) return <Navigate to="/" replace />;

  const validate = (): string | null => {
    const u = sanitize(username);
    if (u.length < 3) return 'Usuário precisa ter ao menos 3 caracteres.';
    if (password.length < 6) return 'Senha precisa ter ao menos 6 caracteres.';
    return null;
  };

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate(); if (err) return toast.error(err);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
    setBusy(false);
    if (error) {
      const msg = error.message || '';
      if (/invalid login/i.test(msg)) toast.error('Usuário ou senha incorretos.');
      else toast.error(msg);
    } else toast.success('Bem-vindo de volta!');
  };

  const signUp = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate(); if (err) return toast.error(err);
    setBusy(true);
    const email = toEmail(username);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { display_name: username.trim() } },
    });
    if (error) {
      setBusy(false);
      const msg = (error as any).message || '';
      if ((error as any).code === 'weak_password' || /weak|pwned/i.test(msg)) {
        toast.error('Senha muito comum. Use uma senha mais forte.');
      } else if (/already registered|already exists/i.test(msg)) {
        toast.error('Usuário já cadastrado. Faça login.');
        setTab('signin');
      } else toast.error(msg || 'Erro ao criar conta.');
      return;
    }
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signErr) toast.success('Conta criada! Faça login.');
    else toast.success('Conta criada com sucesso!');
  };

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6 bg-gradient-to-br from-background via-background to-secondary/40">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-5">
          <div className="size-16 rounded-2xl bg-primary text-primary-foreground grid place-items-center mb-3 shadow-xl shadow-primary/20">
            <Wallet className="size-8" />
          </div>
          <h1 className="text-2xl font-bold">FinWise</h1>
          <p className="text-sm text-muted-foreground">Controle financeiro simples</p>
        </div>

        <Card className="p-4 sm:p-5 shadow-lg">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 mb-5 h-11">
              <TabsTrigger value="signin" className="h-9 text-base">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="h-9 text-base">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="si-user" className="text-sm">Usuário</Label>
                  <div className="relative">
                    <UserIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input ref={firstSignIn} id="si-user" autoComplete="username" autoCapitalize="none"
                      enterKeyHint="next" required value={username} onChange={e => setUsername(e.target.value)}
                      className="pl-10 h-12 text-base" placeholder="seu_usuario" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pwd" className="text-sm">Senha</Label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="si-pwd" type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                      enterKeyHint="go" required value={password} onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-12 h-12 text-base" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-9 grid place-items-center text-muted-foreground active:scale-95">
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full h-12 text-base font-semibold" disabled={busy}>
                  {busy ? 'Entrando…' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-user" className="text-sm">Usuário</Label>
                  <div className="relative">
                    <UserIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input ref={firstSignUp} id="su-user" autoComplete="username" autoCapitalize="none"
                      enterKeyHint="next" required value={username} onChange={e => setUsername(e.target.value)}
                      className="pl-10 h-12 text-base" placeholder="escolha um usuário" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Apenas letras, números, . _ -</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pwd" className="text-sm">Senha</Label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="su-pwd" type={showPwd ? 'text' : 'password'} autoComplete="new-password"
                      enterKeyHint="go" minLength={6} required value={password} onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-12 h-12 text-base" placeholder="Mín. 6 caracteres" />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-9 grid place-items-center text-muted-foreground active:scale-95">
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <Button className="w-full h-12 text-base font-semibold" disabled={busy}>
                  {busy ? 'Criando…' : 'Criar conta e entrar'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Sem e-mail. Sem verificação. Acesso imediato. ⚡
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </main>
  );
}

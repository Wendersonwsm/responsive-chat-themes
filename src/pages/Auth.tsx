import { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';

export default function Auth() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (loading) return <div className="min-h-screen grid place-items-center">Carregando…</div>;
  if (user) return <Navigate to="/" replace />;

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success('Bem-vindo de volta!');
  };

  const signUp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { display_name: name } },
    });
    setBusy(false);
    if (error) {
      const msg = (error as any).message || '';
      if ((error as any).code === 'weak_password' || /weak|pwned/i.test(msg)) {
        toast.error('Senha muito fraca ou já vazada em outros sites. Use uma senha forte e única (ex: 8+ caracteres com letras, números e símbolos).');
      } else if (/already registered|already exists/i.test(msg)) {
        toast.error('Este e-mail já está cadastrado. Tente fazer login.');
      } else {
        toast.error(msg || 'Erro ao criar conta.');
      }
    } else {
      toast.success('Conta criada! Verifique seu e-mail.');
    }
  };

  return (
    <main className="min-h-screen grid place-items-center px-4 py-8 bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="size-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center mb-3 shadow-lg">
            <Wallet className="size-7" />
          </div>
          <h1 className="text-2xl font-bold">FinWise</h1>
          <p className="text-sm text-muted-foreground">Seu controle financeiro pessoal</p>
        </div>
        <Card className="p-5">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3">
                <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Senha</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button className="w-full" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3">
                <div><Label>Nome</Label><Input required value={name} onChange={e => setName(e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div>
                  <Label>Senha (mín. 8)</Label>
                  <Input type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">Use letras, números e símbolos. Evite senhas comuns ou reutilizadas.</p>
                </div>
                <Button className="w-full" disabled={busy}>{busy ? 'Criando…' : 'Criar conta'}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </main>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import {
  getCurrentAppSession,
  signInWithSupabaseEmailAndPassword,
  signOut,
} from '@/lib/storage';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [hasUsers, setHasUsers] = React.useState(true);
  const [startupError, setStartupError] = React.useState<string | null>(null);
  const [startupNotice, setStartupNotice] = React.useState<string | null>(null);

  const [newUser, setNewUser] = React.useState({ name: '', login: '', password: '' });

  React.useEffect(() => {
    const checkSessionAndUsers = async () => {
      try {
        const session = await getCurrentAppSession();
        setHasUsers(true);
        setStartupError(null);
        setStartupNotice(null);

        if (session.isPlatformAdmin) {
          router.replace('/admin');
          return;
        }

        if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant) {
          router.replace('/clientes');
          return;
        }

        if (session.authSource === 'supabase-only') {
          setStartupNotice(
            'Esta conta esta autenticada, mas nao possui acesso a nenhuma empresa. Encerre a sessao abaixo para entrar com outra conta.'
          );
        }
      } catch (error: any) {
        setStartupError(error?.message || 'Nao foi possivel conectar ao servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndUsers();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const normalizedIdentifier = login.trim();

      const session = await signInWithSupabaseEmailAndPassword(normalizedIdentifier, password);
      toast({
        title: 'Login bem-sucedido!',
        description: `Bem-vindo, ${session.supabaseUser?.email || normalizedIdentifier}! Redirecionando...`,
      });
      if (session.isPlatformAdmin) return router.push('/admin');
      if (session.tenantAccess?.canAccessTenant) return router.push('/clientes');
      setStartupNotice('Login realizado, mas esta conta nao possui uma membership ativa em nenhuma empresa.');
      setIsLoading(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: error?.message || 'Nao foi possivel realizar o login.',
      });
      setIsLoading(false);
    }
  };

  const handleSwitchUser = async () => {
    try {
      await signOut();
      setLogin('');
      setPassword('');
      setStartupNotice(null);
      toast({ title: 'Sessao encerrada', description: 'Agora voce pode entrar com outra conta.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha ao encerrar sessao',
        description: error?.message || 'Nao foi possivel encerrar a sessao atual.',
      });
    }
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    toast({ variant: 'destructive', title: 'Cadastro indisponivel', description: 'Usuarios SaaS devem ser criados por um administrador da empresa.' });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm border-border shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <Logo onLoginPage={true} />
          {hasUsers ? (
            <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
          ) : (
            <CardTitle className="text-2xl font-bold">Crie sua conta de Admin</CardTitle>
          )}
          {startupError ? (
            <CardDescription className="text-sm text-destructive">
              {startupError}
            </CardDescription>
          ) : startupNotice ? (
            <div className="space-y-2">
              <CardDescription className="text-sm text-amber-600">{startupNotice}</CardDescription>
              <Button type="button" variant="outline" size="sm" onClick={() => void handleSwitchUser()}>
                Encerrar sessao e trocar usuario
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {hasUsers ? (
            <form onSubmit={handleLogin} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login">E-mail</Label>
                <Input
                  id="login"
                  type="email"
                  placeholder="email@dominio.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Sua senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Login'}
              </Button>
              <Button type="button" variant="link" className="w-full" onClick={async () => {
                const email = window.prompt('Informe seu e-mail para recuperar a senha:');
                if (!email) return;
                await fetch('/api/auth/password/recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                toast({ title: 'Se o e-mail existir, enviaremos as instrucoes de recuperacao.' });
              }}>Esqueci minha senha</Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 pt-4">
              <p className="text-sm text-center text-muted-foreground">
                Nenhum usuario encontrado. Crie o primeiro usuario administrador para comecar.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nome Completo</Label>
                <Input id="reg-name" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-login">Login de Acesso</Label>
                <Input
                  id="reg-login"
                  required
                  placeholder="Ex: admin"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={newUser.login}
                  onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Senha</Label>
                <Input id="reg-password" required type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Criar Usuario e Entrar</Button>
            </form>
          )}
        </CardContent>
        {hasUsers && (
          <CardFooter className="flex-col gap-4">
            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="w-full">
                  Registrar novo usuario (requer permissao)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Novo Usuario</DialogTitle>
                  <DialogDescription>
                    Apenas usuarios existentes com permissao podem registrar novas contas.
                    Esta funcionalidade esta disponivel no painel de Configuracoes.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button type="button" onClick={() => setIsRegisterOpen(false)}>Entendi</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

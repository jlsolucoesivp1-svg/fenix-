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
  hasRegisteredUsers,
  registerUser,
  signInWithLoginAndPassword,
  signInWithSupabaseEmailAndPassword,
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
        const [usersExist, session] = await Promise.all([hasRegisteredUsers(), getCurrentAppSession()]);
        setHasUsers(usersExist);
        setStartupError(null);
        setStartupNotice(null);

        if (session.user) {
          router.replace('/dashboard');
          return;
        }

        if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant) {
          router.replace('/clientes');
          return;
        }

        if (session.authSource === 'supabase-only') {
          setStartupNotice(
            'Sessao Supabase detectada, mas o shell legado continua bloqueado ate concluirmos a integracao SaaS no runtime.'
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

      if (normalizedIdentifier.includes('@')) {
        const session = await signInWithSupabaseEmailAndPassword(normalizedIdentifier, password);
        toast({
          title: 'Login bem-sucedido!',
          description: `Bem-vindo, ${session.supabaseUser?.email || normalizedIdentifier}! Redirecionando...`,
        });

        if (session.tenantAccess?.canAccessTenant) {
          router.push('/clientes');
          return;
        }

        router.push('/admin');
        return;
      }

      const user = await signInWithLoginAndPassword(normalizedIdentifier, password);
      toast({
        title: 'Login bem-sucedido!',
        description: `Bem-vindo, ${user.name}! Redirecionando...`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: error?.message || 'Nao foi possivel realizar o login.',
      });
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.login || !newUser.password) {
      toast({ variant: 'destructive', title: 'Campos obrigatorios', description: 'Por favor, preencha todos os campos.' });
      return;
    }
    if (newUser.password.length < 6) {
      toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    try {
      await registerUser(newUser.name, newUser.login, newUser.password);
      toast({ title: 'Usuario registrado com sucesso!', description: 'Agora voce pode fazer login com suas novas credenciais.' });
      setIsRegisterOpen(false);
      setNewUser({ name: '', login: '', password: '' });
      setHasUsers(true);
      setStartupError(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro no Registro', description: error.message || 'Nao foi possivel registrar o usuario.' });
    }
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
            <CardDescription className="text-sm text-amber-600">
              {startupNotice}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {hasUsers ? (
            <form onSubmit={handleLogin} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login">Login ou E-mail</Label>
                <Input
                  id="login"
                  type="text"
                  placeholder="seu.login ou email@dominio.com"
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

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
import { getLoggedInUser, hasRegisteredUsers, registerUser, signInWithLoginAndPassword } from '@/lib/storage';
import type { SystemActivation } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [hasUsers, setHasUsers] = React.useState(true);
  const [startupError, setStartupError] = React.useState<string | null>(null);
  const [activation, setActivation] = React.useState<SystemActivation | null>(null);
  const [serial, setSerial] = React.useState('');
  const [isActivating, setIsActivating] = React.useState(false);

  const [newUser, setNewUser] = React.useState({ name: '', login: '', password: '' });

  React.useEffect(() => {
    const checkSessionAndUsers = async () => {
      try {
        const [user, usersExist, activationResponse] = await Promise.all([
          getLoggedInUser(),
          hasRegisteredUsers(),
          fetch('/api/activation', { cache: 'no-store' }),
        ]);

        if (!activationResponse.ok) {
          throw new Error('Nao foi possivel verificar a ativacao desta instalacao.');
        }

        const activationPayload: SystemActivation = await activationResponse.json();
        setActivation(activationPayload);
        setHasUsers(usersExist);
        setStartupError(null);

        if (user && activationPayload.status === 'active') {
          router.replace('/dashboard');
          return;
        }
      } catch (error: any) {
        setStartupError(error?.message || 'Nao foi possivel conectar ao servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndUsers();
  }, [router]);

  const handleActivation = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!serial.trim()) {
      toast({
        variant: 'destructive',
        title: 'Codigo obrigatorio',
        description: 'Cole o codigo de ativacao gerado para esta instalacao.',
      });
      return;
    }

    setIsActivating(true);
    try {
      const response = await fetch('/api/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial: serial.trim() }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel concluir a ativacao.');
      }

      setActivation(payload.activation);
      setSerial('');
      toast({
        title: 'Sistema ativado',
        description: 'A instalacao foi liberada. Voce ja pode acessar normalmente.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha na ativacao',
        description: error?.message || 'Nao foi possivel validar o codigo informado.',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleCopyMachineKey = async () => {
    if (!activation?.machineKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activation.machineKey);
      toast({ title: 'Chave copiada', description: 'Envie a chave para gerar a ativacao no seu ativador externo.' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Nao foi possivel copiar',
        description: 'Copie a chave manualmente.',
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await signInWithLoginAndPassword(login, password);
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
          {activation?.status !== 'active' ? (
            <CardTitle className="text-2xl font-bold">Liberacao da instalacao</CardTitle>
          ) : hasUsers ? (
            <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
          ) : (
            <CardTitle className="text-2xl font-bold">Crie sua conta de Admin</CardTitle>
          )}
          {startupError ? (
            <CardDescription className="text-sm text-destructive">
              {startupError}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          {activation?.status !== 'active' ? (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Na primeira execucao, copie a chave desta instalacao, gere a ativacao no seu aplicativo externo e cole o codigo abaixo.
              </p>

              {activation ? (
                <>
                  <div className="space-y-2 rounded border border-border bg-muted/50 p-3">
                    <Label htmlFor="machine-key">Chave desta instalacao</Label>
                    <Input id="machine-key" value={activation.machineKey} readOnly className="font-mono text-xs" />
                    <Button type="button" variant="outline" className="w-full" onClick={handleCopyMachineKey}>
                      Copiar chave
                    </Button>
                  </div>

                  <form onSubmit={handleActivation} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="activation-code">Codigo de ativacao</Label>
                      <Input
                        id="activation-code"
                        value={serial}
                        onChange={(e) => setSerial(e.target.value)}
                        placeholder="Cole aqui o codigo gerado"
                        disabled={isActivating}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isActivating}>
                      {isActivating ? 'Validando...' : 'Liberar sistema'}
                    </Button>
                  </form>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nao foi possivel carregar a chave desta instalacao.</p>
              )}
            </div>
          ) : hasUsers ? (
            <form onSubmit={handleLogin} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login">Login</Label>
                <Input
                  id="login"
                  type="text"
                  placeholder="seu.login"
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
                <Input id="reg-login" required placeholder="Ex: admin" value={newUser.login} onChange={(e) => setNewUser({ ...newUser, login: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Senha</Label>
                <Input id="reg-password" required type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Criar Usuario e Entrar</Button>
            </form>
          )}
        </CardContent>
        {activation?.status === 'active' && hasUsers && (
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

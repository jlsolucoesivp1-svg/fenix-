'use client';

import * as React from 'react';
import { PlusCircle, ShieldCheck, Trash2, User as UserIcon } from 'lucide-react';
import type { User, UserPermissions, UserStatus } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { ModuleLoadingState, ModuleState } from '@/components/ui/module-state';
import {
  createTenantUser,
  deleteTenantUser,
  getUsers,
  listTenantUsers,
  saveUsers,
  updateTenantUser,
} from '@/lib/storage';

const DEFAULT_PERMISSIONS: UserPermissions = {
  accessDashboard: true,
  accessClients: true,
  accessServiceOrders: true,
  accessInventory: true,
  accessSales: true,
  accessFinancials: true,
  accessSettings: true,
  accessDangerZone: false,
  accessAgenda: true,
  accessQuotes: true,
  accessLaudos: false,
  canEdit: true,
  canDelete: true,
  canViewPasswords: false,
  canManageUsers: false,
};

const DEFAULT_FORM_STATE: Partial<User> = {
  name: '',
  email: '',
  password: '',
  status: 'active',
  permissions: DEFAULT_PERMISSIONS,
};

const PERMISSION_GROUPS: Array<{
  title: string;
  items: Array<{ key: keyof UserPermissions; label: string }>;
}> = [
  {
    title: 'Acesso a modulos',
    items: [
      { key: 'accessDashboard', label: 'Dashboard' },
      { key: 'accessClients', label: 'Clientes' },
      { key: 'accessServiceOrders', label: 'Ordens de servico' },
      { key: 'accessInventory', label: 'Produtos e estoque' },
      { key: 'accessSales', label: 'Vendas' },
      { key: 'accessFinancials', label: 'Financeiro' },
      { key: 'accessAgenda', label: 'Agenda' },
      { key: 'accessQuotes', label: 'Orcamentos' },
      { key: 'accessSettings', label: 'Configuracoes' },
      { key: 'accessLaudos', label: 'Laudos' },
    ],
  },
  {
    title: 'Acoes gerais',
    items: [
      { key: 'canEdit', label: 'Pode editar' },
      { key: 'canDelete', label: 'Pode excluir' },
      { key: 'canViewPasswords', label: 'Pode ver senhas' },
      { key: 'canManageUsers', label: 'Gerenciar usuarios' },
      { key: 'accessDangerZone', label: 'Zona de perigo' },
    ],
  },
];

const statusLabels: Record<UserStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  invited: 'Convidado',
  revoked: 'Revogado',
};

export default function UsuariosPage() {
  const { toast } = useToast();
  const session = useCurrentAppSession();
  const { user: legacyUser } = useCurrentUser();

  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [formState, setFormState] = React.useState<Partial<User>>(DEFAULT_FORM_STATE);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const useSaasUsers =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;
  const currentUserId = useSaasUsers ? session.supabaseUser?.id : legacyUser?.id;
  const canManageUsers = useSaasUsers
    ? session.effectivePermissions?.canManageUsers === true
    : Boolean(legacyUser?.permissions.canManageUsers);

  const loadUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = useSaasUsers ? await listTenantUsers() : await getUsers();
      setUsers(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar os usuarios.';
      setLoadError(message);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar usuarios',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, useSaasUsers]);

  React.useEffect(() => {
    if (session.isLoading) {
      return;
    }

    void loadUsers();
  }, [loadUsers, session.isLoading]);

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormState({
      ...DEFAULT_FORM_STATE,
      permissions: { ...DEFAULT_PERMISSIONS },
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormState({
      ...user,
      password: '',
      permissions: {
        ...DEFAULT_PERMISSIONS,
        ...user.permissions,
      },
    });
    setIsDialogOpen(true);
  };

  const handleFieldChange = (field: keyof User, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePermissionChange = (permission: keyof UserPermissions, checked: boolean) => {
    setFormState((current) => ({
      ...current,
      permissions: {
        ...DEFAULT_PERMISSIONS,
        ...(current.permissions ?? {}),
        [permission]: checked,
      },
    }));
  };

  const handleSelectAllPermissions = () => {
    setFormState((current) => ({
      ...current,
      permissions: Object.keys(DEFAULT_PERMISSIONS).reduce((accumulator, key) => {
        accumulator[key as keyof UserPermissions] = true;
        return accumulator;
      }, {} as UserPermissions),
    }));
  };

  const handleSaveUser = async () => {
    try {
      setIsSaving(true);

      if (!formState.name?.trim()) {
        throw new Error('Nome do usuario e obrigatorio.');
      }

      if (useSaasUsers && !formState.email?.trim()) {
        throw new Error('E-mail do usuario e obrigatorio no runtime SaaS.');
      }

      if (!editingUser && !formState.password?.trim()) {
        throw new Error('Senha do usuario e obrigatoria.');
      }

      if (useSaasUsers) {
        const payload = {
          ...formState,
          status: (formState.status || 'active') as UserStatus,
        };

        const savedUser = editingUser
          ? await updateTenantUser({ ...payload, id: editingUser.id })
          : await createTenantUser(payload);

        setUsers((current) =>
          editingUser
            ? current.map((user) => (user.id === editingUser.id ? savedUser : user))
            : [...current, savedUser]
        );
      } else {
        const nextUser: User = editingUser
          ? {
              ...editingUser,
              ...formState,
              password: formState.password?.trim() ? formState.password : editingUser.password,
              permissions: formState.permissions ?? { ...DEFAULT_PERMISSIONS },
            }
          : {
              id: `USER-${Date.now()}`,
              name: formState.name!.trim(),
              login: formState.login!.trim(),
              email: formState.email?.trim() || undefined,
              password: formState.password!.trim(),
              status: (formState.status || 'active') as UserStatus,
              permissions: formState.permissions ?? { ...DEFAULT_PERMISSIONS },
            };

        const updatedUsers = editingUser
          ? users.map((user) => (user.id === editingUser.id ? nextUser : user))
          : [...users, nextUser];

        setUsers(updatedUsers);
        await saveUsers(updatedUsers);
      }

      toast({
        title: editingUser ? 'Usuario atualizado!' : 'Usuario criado!',
        description: `${formState.name} foi salvo com sucesso.`,
      });
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar usuario',
        description: error instanceof Error ? error.message : 'Nao foi possivel salvar o usuario.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      if (useSaasUsers) {
        await deleteTenantUser(user.id);
      } else {
        const updatedUsers = users.filter((item) => item.id !== user.id);
        await saveUsers(updatedUsers);
        setUsers(updatedUsers);
      }

      setUsers((current) => current.filter((item) => item.id !== user.id));
      toast({
        title: 'Usuario removido!',
        description: `${user.name} foi removido da lista ativa.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover usuario',
        description: error instanceof Error ? error.message : 'Nao foi possivel remover o usuario.',
      });
    }
  };

  const renderPermission = (key: keyof UserPermissions, label: string) => (
    <div key={key} className="flex items-center space-x-2">
      <Checkbox
        id={key}
        checked={formState.permissions?.[key] ?? false}
        onCheckedChange={(checked) => handlePermissionChange(key, Boolean(checked))}
        disabled={!canManageUsers}
      />
      <label htmlFor={key} className="text-sm font-medium leading-none">
        {label}
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {isLoading ? (
        <ModuleLoadingState
          title="Carregando usuarios"
          description="Sincronizando perfis, memberships e permissoes do contexto atual."
        />
      ) : null}
      {!isLoading && loadError ? (
        <ModuleState
          title="Nao foi possivel carregar usuarios"
          description={loadError}
          tone="destructive"
          actionLabel="Tentar novamente"
          onAction={() => void loadUsers()}
        />
      ) : null}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              {useSaasUsers
                ? 'Gerencie memberships, perfis e permissoes da empresa ativa no tenant SaaS.'
                : 'Gerencie usuarios e permissoes do runtime legado.'}
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} disabled={!canManageUsers}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Carregando usuarios...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-6">
                      <ModuleState
                        title="Falha ao carregar usuarios"
                        description={loadError}
                        tone="destructive"
                        compact
                        actionLabel="Recarregar"
                        onAction={() => void loadUsers()}
                      />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-6">
                      <ModuleState
                        title="Nenhum usuario encontrado"
                        description="Ainda nao existem usuarios vinculados a empresa ativa."
                        compact
                        actionLabel={canManageUsers ? 'Adicionar usuario' : undefined}
                        onAction={canManageUsers ? openCreateDialog : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {statusLabels[(user.status || 'active') as UserStatus]}
                          </Badge>
                          {user.isOwner ? <Badge variant="outline">Owner</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={!canManageUsers || user.id === currentUserId || user.isOwner}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar remocao</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acao remove o acesso de {user.name} a empresa atual.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => void handleDeleteUser(user)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex h-[90vh] max-w-4xl flex-col p-0">
          <DialogHeader className="border-b p-6 pb-4">
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Adicionar Usuario'}</DialogTitle>
            <DialogDescription>
              {useSaasUsers
                ? 'No runtime SaaS, o usuario recebe Auth, profile, role e membership da empresa ativa.'
                : 'No runtime legado, o usuario continua salvo na colecao local users.'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 md:grid-cols-2">
              <div className="space-y-4 md:col-span-2">
                <h3 className="flex items-center text-lg font-semibold">
                  <UserIcon className="mr-2 h-5 w-5" />
                  Dados do Usuario
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formState.name || ''}
                      onChange={(event) => handleFieldChange('name', event.target.value)}
                      disabled={!canManageUsers}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formState.email || ''}
                      onChange={(event) => handleFieldChange('email', event.target.value)}
                      disabled={!canManageUsers}
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formState.password || ''}
                      onChange={(event) => handleFieldChange('password', event.target.value)}
                      disabled={!canManageUsers}
                      placeholder={editingUser ? 'Deixe em branco para manter' : 'Senha inicial'}
                    />
                  </div>
                </div>

                <div className="max-w-xs space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={(formState.status || 'active') as string}
                    onValueChange={(value) => {
                      setFormState((current) => ({
                        ...current,
                        status: value as UserStatus,
                      }));
                    }}
                    disabled={!canManageUsers || Boolean(editingUser?.isOwner)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="invited">Convidado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="md:col-span-2" />

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center text-lg font-semibold">
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Permissoes
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleSelectAllPermissions} disabled={!canManageUsers}>
                    Selecionar Tudo
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-3 rounded-lg border p-4">
                      <h4 className="font-medium text-primary">{group.title}</h4>
                      <div className="space-y-3">
                        {group.items.map((item) => renderPermission(item.key, item.label))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t p-6">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSaveUser()} disabled={!canManageUsers || isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

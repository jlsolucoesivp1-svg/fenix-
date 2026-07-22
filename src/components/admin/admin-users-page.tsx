'use client';

import * as React from 'react';
import { CheckCircle2, Copy, KeyRound, Loader2, Pencil, RefreshCcw, ShieldBan, ShieldCheck, Users2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModuleState } from '@/components/ui/module-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  listSuperAdminCompanyUsers,
  resetSuperAdminCompanyUserPassword,
  updateSuperAdminCompanyUser,
  type SuperAdminCompanyRole,
  type SuperAdminCompanySummary,
  type SuperAdminCompanyUser,
  type UpdateSuperAdminCompanyUserInput,
} from '@/lib/storage';

interface AdminUsersPageProps {
  companies: SuperAdminCompanySummary[];
  initialCompanyId: string | null;
}

const toEditForm = (user: SuperAdminCompanyUser, fallbackRoleId: string): UpdateSuperAdminCompanyUserInput => ({
  companyId: '',
  userId: user.id,
  name: user.name,
  email: user.email || '',
  loginName: user.loginName || '',
  roleId: user.roleId || fallbackRoleId,
  status: user.status === 'active' ? 'active' : 'inactive',
});

export function AdminUsersPage({ companies, initialCompanyId }: AdminUsersPageProps) {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(initialCompanyId || companies[0]?.companyId || '');
  const [users, setUsers] = React.useState<SuperAdminCompanyUser[]>([]);
  const [roles, setRoles] = React.useState<SuperAdminCompanyRole[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<SuperAdminCompanyUser | null>(null);
  const [editForm, setEditForm] = React.useState<UpdateSuperAdminCompanyUserInput | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<SuperAdminCompanyUser | null>(null);
  const [passwordTarget, setPasswordTarget] = React.useState<SuperAdminCompanyUser | null>(null);
  const [newPassword, setNewPassword] = React.useState('');
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);

  const selectedCompany = companies.find((company) => company.companyId === selectedCompanyId) || null;
  const visibleUsers = Array.isArray(users) ? users : [];
  const availableRoles = Array.isArray(roles) ? roles : [];

  const loadUsers = React.useCallback(async () => {
    if (!selectedCompanyId) {
      setUsers([]);
      setRoles([]);
      return;
    }
    try {
      setIsLoading(true);
      const result = await listSuperAdminCompanyUsers(selectedCompanyId);
      if (!Array.isArray(result.users) || !Array.isArray(result.roles)) {
        throw new Error('Resposta invalida ao carregar usuarios da empresa.');
      }
      setUsers(result.users);
      setRoles(result.roles);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao carregar usuarios', description: error?.message || 'Nao foi possivel carregar os usuarios da empresa selecionada.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, toast]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openEdit = (user: SuperAdminCompanyUser) => {
    setEditingUser(user);
    setEditForm({ ...toEditForm(user, availableRoles[0]?.id || ''), companyId: selectedCompanyId });
  };

  const saveUser = async () => {
    if (!editForm) return;
    try {
      setIsSaving(true);
      await updateSuperAdminCompanyUser(editForm);
      toast({ title: 'Usuario atualizado', description: 'Auth, profile, membership e role foram sincronizados.' });
      setEditingUser(null);
      setEditForm(null);
      await loadUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao atualizar usuario', description: error?.message || 'Nao foi possivel salvar as alteracoes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async () => {
    if (!statusTarget) return;
    try {
      const form = toEditForm(statusTarget, availableRoles[0]?.id || '');
      await updateSuperAdminCompanyUser({ ...form, companyId: selectedCompanyId, status: statusTarget.status === 'active' ? 'inactive' : 'active' });
      toast({ title: statusTarget.status === 'active' ? 'Usuario suspenso' : 'Usuario reativado' });
      setStatusTarget(null);
      await loadUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao alterar status', description: error?.message || 'Nao foi possivel alterar o status do usuario.' });
    }
  };

  const resetPassword = async () => {
    if (!passwordTarget) return;
    try {
      setIsResettingPassword(true);
      await resetSuperAdminCompanyUserPassword({ companyId: selectedCompanyId, userId: passwordTarget.id, password: newPassword });
      toast({ title: 'Senha redefinida', description: 'A nova senha temporaria foi aplicada com sucesso.' });
      setPasswordTarget(null);
      setNewPassword('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha ao redefinir senha', description: error?.message || 'Nao foi possivel atualizar a senha.' });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Gestao de usuarios"
        title="Usuarios por empresa"
        description="Gerencie credenciais, roles e status dos usuarios de cada tenant. Acoes sensiveis sao executadas somente pelo Super Admin."
        actions={<Button variant="outline" onClick={() => void loadUsers()} disabled={isLoading || !selectedCompanyId}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}Atualizar</Button>}
      />

      <Card className="border-border bg-card shadow-sm">
        <CardHeader><CardTitle>Selecionar empresa</CardTitle><CardDescription>Use o filtro abaixo para gerenciar os usuarios do tenant desejado.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground lg:min-w-80" value={selectedCompanyId} onChange={(event) => setSelectedCompanyId(event.target.value)}>
            {companies.map((company) => <option key={company.companyId} value={company.companyId}>{company.tradeName} ({company.slug})</option>)}
          </select>
          {selectedCompany ? <div className="text-sm text-muted-foreground">Empresa ativa na tela: <strong>{selectedCompany.tradeName}</strong></div> : null}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader><CardTitle>Usuarios vinculados</CardTitle><CardDescription>O Owner permanece identificado e nao perde essa condicao ao ser editado.</CardDescription></CardHeader>
        <CardContent>
          {!selectedCompanyId ? <ModuleState title="Nenhuma empresa selecionada" description="Escolha um tenant para listar os usuarios vinculados." /> : visibleUsers.length === 0 && !isLoading ? <ModuleState title="Nenhum usuario encontrado" description="Ainda nao existem usuarios retornados para a empresa selecionada." icon={Users2} /> : (
            <Table><TableHeader><TableRow><TableHead>Nome e acesso</TableHead><TableHead>Login</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Owner</TableHead><TableHead className="text-right">Acoes</TableHead></TableRow></TableHeader>
              <TableBody>{visibleUsers.map((user) => <TableRow key={user.id}>
                <TableCell><div className="font-medium text-foreground">{user.name}</div><div className="text-xs text-muted-foreground">{user.email || user.id}</div></TableCell>
                <TableCell>{user.loginName || '—'}</TableCell>
                <TableCell>{user.roleName || 'Sem role'}{user.roleIsCompanyAdmin ? <Badge className="ml-2" variant="secondary">Admin</Badge> : null}</TableCell>
                <TableCell><Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status === 'active' ? 'Ativo' : 'Suspenso'}</Badge></TableCell>
                <TableCell>{user.isOwner ? <span className="inline-flex items-center gap-1 font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Owner</span> : '—'}</TableCell>
                <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(user)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
                  <Button variant="ghost" size="sm" disabled={!user.email} onClick={async () => { if (user.email) { await navigator.clipboard.writeText(user.email); toast({ title: 'E-mail copiado' }); } }}><Copy className="mr-2 h-4 w-4" />E-mail</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setPasswordTarget(user); setNewPassword(''); }}><KeyRound className="mr-2 h-4 w-4" />Senha</Button>
                  <Button variant="ghost" size="sm" onClick={() => setStatusTarget(user)}>{user.status === 'active' ? <><ShieldBan className="mr-2 h-4 w-4" />Suspender</> : <><ShieldCheck className="mr-2 h-4 w-4" />Reativar</>}</Button>
                </div></TableCell>
              </TableRow>)}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingUser && editForm)} onOpenChange={(open) => !open && (setEditingUser(null), setEditForm(null))}>
        <DialogContent><DialogHeader><DialogTitle>Editar usuario</DialogTitle><DialogDescription>As alteracoes sincronizam Supabase Auth, profile, membership e role.</DialogDescription></DialogHeader>
          {editForm ? <div className="grid gap-4"><div className="space-y-2"><Label>Nome</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div><div className="space-y-2"><Label>E-mail de acesso</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div><div className="space-y-2"><Label>Login de compatibilidade</Label><Input value={editForm.loginName || ''} onChange={(e) => setEditForm({ ...editForm, loginName: e.target.value })} /></div><div className="space-y-2"><Label>Role</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editForm.roleId} onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}>{availableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}{role.isCompanyAdmin ? ' (Admin)' : ''}</option>)}</select></div><div className="space-y-2"><Label>Status</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}><option value="active">Ativo</option><option value="inactive">Suspenso</option></select></div>{editingUser?.isOwner ? <p className="text-sm text-muted-foreground">Este usuario continuara como Owner, independentemente da role selecionada.</p> : null}</div> : null}
          <DialogFooter><Button variant="ghost" onClick={() => { setEditingUser(null); setEditForm(null); }}>Cancelar</Button><Button onClick={() => void saveUser()} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && setStatusTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{statusTarget?.status === 'active' ? 'Suspender usuario?' : 'Reativar usuario?'}</AlertDialogTitle><AlertDialogDescription>{statusTarget?.status === 'active' ? 'O usuario perdera acesso ao tenant ate ser reativado.' : 'O usuario voltara a ter acesso conforme sua role.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void changeStatus()}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <Dialog open={Boolean(passwordTarget)} onOpenChange={(open) => !open && (setPasswordTarget(null), setNewPassword(''))}><DialogContent><DialogHeader><DialogTitle>Redefinir senha temporaria</DialogTitle><DialogDescription>A senha nao sera exibida novamente nem registrada na auditoria.</DialogDescription></DialogHeader><div className="space-y-2"><Label>Nova senha temporaria</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div><DialogFooter><Button variant="ghost" onClick={() => { setPasswordTarget(null); setNewPassword(''); }}>Cancelar</Button><Button onClick={() => void resetPassword()} disabled={isResettingPassword}>{isResettingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Redefinir senha</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

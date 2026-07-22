'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Copy,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldBan,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  createSuperAdminCompany,
  listSuperAdminCompanies,
  setSuperAdminCompanyStatus,
  updateSuperAdminCompany,
  type CreateSuperAdminCompanyInput,
  type SuperAdminCompanySummary,
  type UpdateSuperAdminCompanyInput,
} from '@/lib/storage';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type CompanyStatus = 'active' | 'inactive' | 'suspended' | 'trial';

const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
  suspended: 'Suspensa',
  trial: 'Teste',
};

const DEFAULT_CREATE_FORM: CreateSuperAdminCompanyInput = {
  companyTradeName: '',
  companyLegalName: '',
  companySlug: '',
  documentNumber: '',
  phone: '',
  email: '',
  addressLine: '',
  city: '',
  stateCode: '',
  zipCode: '',
  status: 'trial',
  adminFullName: '',
  adminEmail: '',
  adminPassword: '',
  adminLoginName: '',
  defaultWarrantyDays: 90,
  planName: '',
  trialStartsAt: '',
  trialEndsAt: '',
  internalNotes: '',
  requirePasswordChange: true,
};

const mapCompanyToEditForm = (company: SuperAdminCompanySummary): UpdateSuperAdminCompanyInput => ({
  companyId: company.companyId,
  companyTradeName: company.tradeName,
  companyLegalName: company.legalName || '',
  documentNumber: company.documentNumber || '',
  phone: company.phone || '',
  email: company.email || '',
  addressLine: company.addressLine || '',
  city: company.city || '',
  stateCode: company.stateCode || '',
  zipCode: company.zipCode || '',
  status: company.status,
  defaultWarrantyDays: company.defaultWarrantyDays,
  planName: company.planName || '',
  trialStartsAt: company.trialStartsAt || '',
  trialEndsAt: company.trialEndsAt || '',
  internalNotes: company.internalNotes || '',
  requirePasswordChange: company.requirePasswordChange,
});

const getStatusBadgeVariant = (status: CompanyStatus) => {
  if (status === 'active') return 'default' as const;
  if (status === 'trial') return 'secondary' as const;
  return 'outline' as const;
};

interface AdminCompaniesPageProps {
  initialCompanies: SuperAdminCompanySummary[];
}

export function AdminCompaniesPage({ initialCompanies }: AdminCompaniesPageProps) {
  const { toast } = useToast();
  const [companies, setCompanies] = React.useState(initialCompanies);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | CompanyStatus>('all');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<CreateSuperAdminCompanyInput>(DEFAULT_CREATE_FORM);
  const [editingCompany, setEditingCompany] = React.useState<SuperAdminCompanySummary | null>(null);
  const [editForm, setEditForm] = React.useState<UpdateSuperAdminCompanyInput | null>(null);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<{ company: SuperAdminCompanySummary; status: CompanyStatus } | null>(null);

  const filteredCompanies = React.useMemo(() => {
    return companies.filter((company) => {
      const matchesStatus = statusFilter === 'all' ? true : company.status === statusFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        company.tradeName.toLowerCase().includes(term) ||
        company.slug.toLowerCase().includes(term) ||
        (company.legalName || '').toLowerCase().includes(term) ||
        (company.responsibleName || '').toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [companies, search, statusFilter]);

  const refreshCompanies = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      setCompanies(await listSuperAdminCompanies());
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar empresas',
        description: error?.message || 'Nao foi possivel atualizar a lista administrativa.',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  const handleCreateChange = (field: keyof CreateSuperAdminCompanyInput, value: string | boolean | number) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditChange = (field: keyof UpdateSuperAdminCompanyInput, value: string | boolean | number) => {
    setEditForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsCreating(true);
      await createSuperAdminCompany(createForm);
      toast({
        title: 'Empresa criada',
        description: 'A empresa e o administrador inicial foram provisionados com sucesso.',
      });
      setCreateForm(DEFAULT_CREATE_FORM);
      await refreshCompanies();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha ao criar empresa',
        description: error?.message || 'Nao foi possivel provisionar a empresa.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm) {
      return;
    }

    try {
      setIsSavingEdit(true);
      await updateSuperAdminCompany(editForm);
      toast({ title: 'Empresa atualizada', description: 'Os dados administrativos foram salvos.' });
      setEditingCompany(null);
      setEditForm(null);
      await refreshCompanies();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha ao atualizar empresa',
        description: error?.message || 'Nao foi possivel salvar a empresa.',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) {
      return;
    }

    try {
      await setSuperAdminCompanyStatus({
        companyId: statusTarget.company.companyId,
        status: statusTarget.status,
      });
      toast({
        title: 'Status alterado',
        description: `${statusTarget.company.tradeName} agora esta como ${COMPANY_STATUS_LABEL[statusTarget.status].toLowerCase()}.`,
      });
      setStatusTarget(null);
      await refreshCompanies();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Falha ao alterar status',
        description: error?.message || 'Nao foi possivel atualizar o status da empresa.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Provisionamento"
        title="Empresas"
        description="Cadastre novas empresas, acompanhe o status operacional de cada tenant e acesse rapidamente usuarios, logs e controle de acesso."
        actions={
          <Button variant="outline" onClick={() => void refreshCompanies()} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
        }
      />

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Nova empresa</CardTitle>
          <CardDescription>
            O backend cria o usuario admin no Supabase Auth, provisiona a empresa, memberships, configuracoes e branding sem expor segredos no navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4 xl:col-span-1">
              <div className="font-medium text-foreground">Dados da empresa</div>
              <div className="space-y-2">
                <Label htmlFor="companyTradeName">Nome fantasia</Label>
                <Input id="companyTradeName" value={createForm.companyTradeName} onChange={(e) => handleCreateChange('companyTradeName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyLegalName">Razao social</Label>
                <Input id="companyLegalName" value={createForm.companyLegalName} onChange={(e) => handleCreateChange('companyLegalName', e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">CNPJ/CPF</Label>
                  <Input id="documentNumber" value={createForm.documentNumber} onChange={(e) => handleCreateChange('documentNumber', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySlug">Slug</Label>
                  <Input id="companySlug" value={createForm.companySlug} onChange={(e) => handleCreateChange('companySlug', e.target.value)} placeholder="gerado automaticamente" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input id="companyPhone" value={createForm.phone} onChange={(e) => handleCreateChange('phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">E-mail</Label>
                  <Input id="companyEmail" type="email" value={createForm.email} onChange={(e) => handleCreateChange('email', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine">Endereco</Label>
                <Input id="addressLine" value={createForm.addressLine} onChange={(e) => handleCreateChange('addressLine', e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={createForm.city} onChange={(e) => handleCreateChange('city', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateCode">UF</Label>
                  <Input id="stateCode" maxLength={2} value={createForm.stateCode} onChange={(e) => handleCreateChange('stateCode', e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input id="zipCode" value={createForm.zipCode} onChange={(e) => handleCreateChange('zipCode', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={createForm.status}
                    onChange={(e) => handleCreateChange('status', e.target.value as CompanyStatus)}
                  >
                    <option value="trial">Teste</option>
                    <option value="active">Ativa</option>
                    <option value="suspended">Suspensa</option>
                    <option value="inactive">Inativa</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4 xl:col-span-1">
              <div className="font-medium text-foreground">Administrador inicial</div>
              <div className="space-y-2">
                <Label htmlFor="adminFullName">Nome completo</Label>
                <Input id="adminFullName" value={createForm.adminFullName} onChange={(e) => handleCreateChange('adminFullName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">E-mail</Label>
                <Input id="adminEmail" type="email" value={createForm.adminEmail} onChange={(e) => handleCreateChange('adminEmail', e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adminLoginName">Login de compatibilidade</Label>
                  <Input id="adminLoginName" value={createForm.adminLoginName} onChange={(e) => handleCreateChange('adminLoginName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Senha temporaria</Label>
                  <Input id="adminPassword" type="password" value={createForm.adminPassword} onChange={(e) => handleCreateChange('adminPassword', e.target.value)} />
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={Boolean(createForm.requirePasswordChange)}
                  onChange={(e) => handleCreateChange('requirePasswordChange', e.target.checked)}
                />
                Exigir troca de senha no primeiro acesso quando suportado pelo fluxo de login
              </label>
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4 xl:col-span-1">
              <div className="font-medium text-foreground">Configuracoes iniciais</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultWarrantyDays">Garantia padrao (dias)</Label>
                  <Input id="defaultWarrantyDays" type="number" value={createForm.defaultWarrantyDays} onChange={(e) => handleCreateChange('defaultWarrantyDays', Number(e.target.value || 0))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planName">Plano ou observacao</Label>
                  <Input id="planName" value={createForm.planName} onChange={(e) => handleCreateChange('planName', e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="trialStartsAt">Inicio do teste</Label>
                  <Input id="trialStartsAt" type="date" value={createForm.trialStartsAt} onChange={(e) => handleCreateChange('trialStartsAt', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trialEndsAt">Fim previsto do teste</Label>
                  <Input id="trialEndsAt" type="date" value={createForm.trialEndsAt} onChange={(e) => handleCreateChange('trialEndsAt', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="internalNotes">Observacoes internas</Label>
                <Textarea id="internalNotes" value={createForm.internalNotes} onChange={(e) => handleCreateChange('internalNotes', e.target.value)} rows={6} />
              </div>
            </div>

            <div className="xl:col-span-3">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Criar empresa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Empresas cadastradas</CardTitle>
            <CardDescription>Busca rapida, filtros de status e acoes administrativas principais.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar por empresa, slug ou responsavel"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-72"
            />
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | CompanyStatus)}
            >
              <option value="all">Todos os status</option>
              <option value="trial">Teste</option>
              <option value="active">Ativa</option>
              <option value="suspended">Suspensa</option>
              <option value="inactive">Inativa</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsavel</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Criacao</TableHead>
                <TableHead>Ultima atividade</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.companyId}>
                  <TableCell>
                    <div className="font-medium text-foreground">{company.tradeName}</div>
                    <div className="text-xs text-muted-foreground">{company.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(company.status)}>{COMPANY_STATUS_LABEL[company.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>{company.responsibleName || 'Nao definido'}</div>
                    <div className="text-xs text-muted-foreground">{company.responsibleEmail || company.companyId}</div>
                  </TableCell>
                  <TableCell>{company.usersCount}</TableCell>
                  <TableCell>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{company.lastActivityAt ? new Date(company.lastActivityAt).toLocaleString('pt-BR') : 'Sem atividade'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingCompany(company); setEditForm(mapCompanyToEditForm(company)); }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/usuarios?companyId=${company.companyId}`}>
                          <UserRound className="mr-2 h-4 w-4" />
                          Usuarios
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/auditoria?companyId=${company.companyId}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Logs
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await navigator.clipboard.writeText(company.companyId);
                          toast({ title: 'ID copiado', description: 'O ID da empresa foi copiado para a area de transferencia.' });
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        ID
                      </Button>
                      {company.status !== 'suspended' ? (
                        <Button variant="ghost" size="sm" onClick={() => setStatusTarget({ company, status: 'suspended' })}>
                          <ShieldBan className="mr-2 h-4 w-4" />
                          Suspender
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setStatusTarget({ company, status: 'active' })}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Reativar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingCompany && editForm)} onOpenChange={(open) => !open && (setEditingCompany(null), setEditForm(null))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar empresa</DialogTitle>
            <DialogDescription>Ajuste dados administrativos, status e configuracoes iniciais do tenant.</DialogDescription>
          </DialogHeader>
          {editForm ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome fantasia</Label>
                <Input value={editForm.companyTradeName} onChange={(e) => handleEditChange('companyTradeName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Razao social</Label>
                <Input value={editForm.companyLegalName} onChange={(e) => handleEditChange('companyLegalName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ/CPF</Label>
                <Input value={editForm.documentNumber} onChange={(e) => handleEditChange('documentNumber', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={editForm.status} onChange={(e) => handleEditChange('status', e.target.value as CompanyStatus)}>
                  <option value="trial">Teste</option>
                  <option value="active">Ativa</option>
                  <option value="suspended">Suspensa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editForm.phone} onChange={(e) => handleEditChange('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={editForm.email} onChange={(e) => handleEditChange('email', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Endereco</Label>
                <Input value={editForm.addressLine} onChange={(e) => handleEditChange('addressLine', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={editForm.city} onChange={(e) => handleEditChange('city', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input value={editForm.stateCode} onChange={(e) => handleEditChange('stateCode', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input value={editForm.zipCode} onChange={(e) => handleEditChange('zipCode', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Garantia padrao</Label>
                <Input type="number" value={editForm.defaultWarrantyDays} onChange={(e) => handleEditChange('defaultWarrantyDays', Number(e.target.value || 0))} />
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Input value={editForm.planName} onChange={(e) => handleEditChange('planName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Inicio do teste</Label>
                <Input type="date" value={editForm.trialStartsAt} onChange={(e) => handleEditChange('trialStartsAt', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fim do teste</Label>
                <Input type="date" value={editForm.trialEndsAt} onChange={(e) => handleEditChange('trialEndsAt', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Observacoes internas</Label>
                <Textarea value={editForm.internalNotes} onChange={(e) => handleEditChange('internalNotes', e.target.value)} rows={5} />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditingCompany(null); setEditForm(null); }}>Cancelar</Button>
            <Button onClick={() => void handleSaveEdit()} disabled={isSavingEdit}>
              {isSavingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteracao de status</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget
                ? `Confirme a alteracao de ${statusTarget.company.tradeName} para ${COMPANY_STATUS_LABEL[statusTarget.status].toLowerCase()}.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleStatusChange()}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

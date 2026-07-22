'use client';

import * as React from 'react';
import { RefreshCcw, Users2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModuleState } from '@/components/ui/module-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { listSuperAdminCompanyUsers, type SuperAdminCompanySummary } from '@/lib/storage';
import type { User } from '@/types';

interface AdminUsersPageProps {
  companies: SuperAdminCompanySummary[];
  initialCompanyId: string | null;
}

export function AdminUsersPage({ companies, initialCompanyId }: AdminUsersPageProps) {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(initialCompanyId || companies[0]?.companyId || '');
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const selectedCompany = companies.find((company) => company.companyId === selectedCompanyId) || null;

  const loadUsers = React.useCallback(async () => {
    if (!selectedCompanyId) {
      setUsers([]);
      return;
    }

    try {
      setIsLoading(true);
      setUsers(await listSuperAdminCompanyUsers(selectedCompanyId));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar usuarios',
        description: error?.message || 'Nao foi possivel carregar os usuarios da empresa selecionada.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, toast]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Gestao de usuarios"
        title="Usuarios por empresa"
        description="Primeira versao da visao administrativa de usuarios. Esta tela ja permite inspecionar rapidamente quem esta ativo em cada tenant."
        actions={
          <Button variant="outline" onClick={() => void loadUsers()} disabled={isLoading || !selectedCompanyId}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        }
      />

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Selecionar empresa</CardTitle>
          <CardDescription>Use o filtro abaixo para carregar os usuarios do tenant desejado.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground lg:min-w-80"
            value={selectedCompanyId}
            onChange={(event) => setSelectedCompanyId(event.target.value)}
          >
            {companies.map((company) => (
              <option key={company.companyId} value={company.companyId}>
                {company.tradeName} ({company.slug})
              </option>
            ))}
          </select>
          {selectedCompany ? (
            <div className="text-sm text-muted-foreground">
              Empresa ativa na tela: <strong>{selectedCompany.tradeName}</strong>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Usuarios vinculados</CardTitle>
          <CardDescription>Listagem administrativa para validacao de acesso, owners e status de membership.</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedCompanyId ? (
            <ModuleState
              title="Nenhuma empresa selecionada"
              description="Escolha um tenant para listar os usuarios vinculados."
            />
          ) : users.length === 0 && !isLoading ? (
            <ModuleState
              title="Nenhum usuario encontrado"
              description="Ainda nao existem usuarios ativos retornados para a empresa selecionada."
              icon={Users2}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email || user.id}</div>
                    </TableCell>
                    <TableCell>{user.login}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.isOwner ? 'Sim' : 'Nao'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

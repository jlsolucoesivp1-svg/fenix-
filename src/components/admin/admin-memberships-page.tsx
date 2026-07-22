'use client';

import * as React from 'react';
import { BadgeCheck, RefreshCcw } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { listSuperAdminMemberships, type SuperAdminCompanySummary, type SuperAdminMembershipSummary } from '@/lib/storage';

interface AdminMembershipsPageProps {
  companies: SuperAdminCompanySummary[];
  initialCompanyId: string | null;
}

export function AdminMembershipsPage({ companies, initialCompanyId }: AdminMembershipsPageProps) {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(initialCompanyId || '');
  const [memberships, setMemberships] = React.useState<SuperAdminMembershipSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadMemberships = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setMemberships(await listSuperAdminMemberships(selectedCompanyId || undefined));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar memberships',
        description: error?.message || 'Nao foi possivel carregar os vinculos administrativos.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, toast]);

  React.useEffect(() => {
    void loadMemberships();
  }, [loadMemberships]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Acesso"
        title="Acessos e memberships"
        description="Inspecao centralizada dos vinculos usuario x empresa para validar owners, defaults e memberships ativas ou revogadas."
        actions={
          <Button variant="outline" onClick={() => void loadMemberships()} disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        }
      />

      <Card className="border-sky-500/10 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Filtro por empresa</CardTitle>
          <CardDescription>Deixe em branco para inspecionar memberships de toda a plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm lg:min-w-80"
            value={selectedCompanyId}
            onChange={(event) => setSelectedCompanyId(event.target.value)}
          >
            <option value="">Todas as empresas</option>
            {companies.map((company) => (
              <option key={company.companyId} value={company.companyId}>
                {company.tradeName} ({company.slug})
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <BadgeCheck className="h-4 w-4 text-sky-700" />
            {memberships.length.toLocaleString('pt-BR')} membership(s) carregadas
          </div>
        </CardContent>
      </Card>

      <Card className="border-sky-500/10 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Memberships</CardTitle>
          <CardDescription>Visao administrativa de ownership, default tenant e status do vinculo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Empresa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((membership) => (
                <TableRow key={membership.membershipId}>
                  <TableCell>
                    <div className="font-medium text-slate-950">{membership.fullName || membership.loginName || membership.userId}</div>
                    <div className="text-xs text-slate-500">{membership.userId}</div>
                  </TableCell>
                  <TableCell>{membership.email || 'Nao informado'}</TableCell>
                  <TableCell>
                    <Badge variant={membership.status === 'active' ? 'default' : 'secondary'}>{membership.status}</Badge>
                  </TableCell>
                  <TableCell>{membership.isOwner ? 'Sim' : 'Nao'}</TableCell>
                  <TableCell>{membership.isDefault ? 'Sim' : 'Nao'}</TableCell>
                  <TableCell className="font-mono text-xs">{membership.companyId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

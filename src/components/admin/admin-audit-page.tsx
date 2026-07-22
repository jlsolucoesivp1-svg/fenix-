'use client';

import * as React from 'react';
import { RefreshCcw } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { listSuperAdminAuditLogs, type SuperAdminAuditLogSummary, type SuperAdminCompanySummary } from '@/lib/storage';

interface AdminAuditPageProps {
  companies: SuperAdminCompanySummary[];
  initialLogs: SuperAdminAuditLogSummary[];
  initialCompanyId: string | null;
}

export function AdminAuditPage({ companies, initialLogs, initialCompanyId }: AdminAuditPageProps) {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(initialCompanyId || '');
  const [logs, setLogs] = React.useState(initialLogs);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadLogs = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setLogs(await listSuperAdminAuditLogs({ companyId: selectedCompanyId || undefined, limit: 100 }));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar auditoria',
        description: error?.message || 'Nao foi possivel carregar o trilho administrativo.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, toast]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Audit Trail"
        title="Auditoria administrativa"
        description="Rastreamento das acoes criticas do control plane, incluindo criacao de empresas, alteracoes de status, acessos negados e eventos operacionais."
        actions={
          <Button variant="outline" onClick={() => void loadLogs()} disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        }
      />

      <Card className="border-sky-500/10 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Filtro por empresa</CardTitle>
          <CardDescription>Filtre o trilho por empresa afetada ou veja tudo em nivel de plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm lg:min-w-80"
            value={selectedCompanyId}
            onChange={(event) => setSelectedCompanyId(event.target.value)}
          >
            <option value="">Toda a plataforma</option>
            {companies.map((company) => (
              <option key={company.companyId} value={company.companyId}>
                {company.tradeName} ({company.slug})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="border-sky-500/10 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Eventos recentes</CardTitle>
          <CardDescription>Sem senhas ou segredos. Apenas metadados operacionais relevantes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/hora</TableHead>
                <TableHead>Acao</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.createdAt).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-950">{log.action}</div>
                    <div className="text-xs text-slate-500">{log.requestId || 'sem request_id'}</div>
                  </TableCell>
                  <TableCell>{log.entity}</TableCell>
                  <TableCell className="font-mono text-xs">{log.companyId || 'plataforma'}</TableCell>
                  <TableCell>
                    <Badge variant={log.success ? 'default' : 'destructive'}>
                      {log.success ? 'Sucesso' : 'Falha'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

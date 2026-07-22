'use client';

import * as React from 'react';
import { Activity, Ban, Building2, Clock3, ShieldAlert, Users2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import type { SuperAdminDashboardSummary } from '@/lib/storage';

const metrics = [
  {
    key: 'totalCompanies',
    label: 'Total de empresas',
    icon: Building2,
  },
  {
    key: 'activeCompanies',
    label: 'Empresas ativas',
    icon: Activity,
  },
  {
    key: 'trialCompanies',
    label: 'Empresas em teste',
    icon: Clock3,
  },
  {
    key: 'suspendedCompanies',
    label: 'Empresas suspensas',
    icon: ShieldAlert,
  },
  {
    key: 'blockedCompanies',
    label: 'Acesso bloqueado',
    icon: Ban,
  },
  {
    key: 'totalUsers',
    label: 'Total de usuarios',
    icon: Users2,
  },
] as const;

interface AdminDashboardPageProps {
  summary: SuperAdminDashboardSummary;
}

export function AdminDashboardPage({ summary }: AdminDashboardPageProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Control Plane"
        title="Dashboard Administrativo"
        description="Visao consolidada da operacao multiempresa do Fenix SaaS, com foco em provisionamento, bloqueios e atividade recente."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.key} className="border-sky-500/10 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{metric.label}</CardDescription>
                <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-700">
                  <metric.icon className="h-4 w-4" />
                </div>
              </div>
              <CardTitle className="text-3xl text-slate-950">
                {summary[metric.key].toLocaleString('pt-BR')}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-sky-500/10 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Ultimos cadastros</CardTitle>
            <CardDescription>Empresas provisionadas mais recentemente no control plane.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsavel</TableHead>
                  <TableHead>Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.latestCompanies.map((company) => (
                  <TableRow key={company.companyId}>
                    <TableCell>
                      <div className="font-medium text-slate-950">{company.tradeName}</div>
                      <div className="text-xs text-slate-500">{company.slug}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                        {company.status === 'trial'
                          ? 'Teste'
                          : company.status === 'active'
                            ? 'Ativa'
                            : company.status === 'suspended'
                              ? 'Suspensa'
                              : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.responsibleName || company.responsibleEmail || 'Nao definido'}</TableCell>
                    <TableCell>{new Date(company.createdAt).toLocaleString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-sky-500/10 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Ultimas acoes administrativas</CardTitle>
            <CardDescription>Eventos mais recentes registrados no audit trail administrativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.latestActions.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-950">{entry.action}</div>
                  <Badge variant={entry.success ? 'default' : 'destructive'}>
                    {entry.success ? 'Sucesso' : 'Falha'}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  <div>Entidade: {entry.entity}</div>
                  <div>Empresa: {entry.companyId || 'plataforma'}</div>
                  <div>{new Date(entry.createdAt).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

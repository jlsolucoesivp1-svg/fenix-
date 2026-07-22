import { Shield, ShieldCheck, TerminalSquare } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminConfigPageProps {
  operatorLabel: string;
  operatorEmail: string | null;
}

export function AdminConfigPage({ operatorLabel, operatorEmail }: AdminConfigPageProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Seguranca"
        title="Configuracoes administrativas"
        description="Resumo da postura de seguranca do control plane da JL e do modelo de acesso adotado nesta fase da migracao."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-sky-500/10 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-sky-700" /> Operador autenticado</CardTitle>
            <CardDescription>Identidade validada no backend administrativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <div><strong>Nome:</strong> {operatorLabel}</div>
            <div><strong>E-mail:</strong> {operatorEmail || 'Nao informado'}</div>
            <div><strong>Fonte:</strong> `platform_admins` + sessao autenticada</div>
          </CardContent>
        </Card>

        <Card className="border-sky-500/10 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-sky-700" /> Segredos</CardTitle>
            <CardDescription>Nenhum segredo operacional e digitado no painel comum.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <div>`SUPABASE_SERVICE_ROLE_KEY` fica no backend.</div>
            <div>`SAAS_BOOTSTRAP_SECRET` nao e enviado ao navegador.</div>
            <div>As rotas usam validacao server-side antes de qualquer operacao.</div>
          </CardContent>
        </Card>

        <Card className="border-sky-500/10 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TerminalSquare className="h-5 w-5 text-sky-700" /> Seed inicial</CardTitle>
            <CardDescription>Procedimento controlado para liberar o primeiro operador da JL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <div>Inserir o operador em `public.platform_admins`.</div>
            <div>Nao versionar segredos nem seeds sensiveis de producao no Git.</div>
            <div>As tentativas negadas ao painel sao registradas em `audit_logs`.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

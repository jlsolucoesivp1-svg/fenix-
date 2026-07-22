'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { getModuleLabelForPath } from '@/lib/permissions';

const getTenantAccessMessage = (status: NonNullable<ReturnType<typeof useCurrentAppSession>['tenantAccess']>['status']) => {
  switch (status) {
    case 'no_active_company':
      return 'A sessao Supabase existe, mas ainda nao ha empresa ativa selecionada no contexto do tenant.';
    case 'membership_not_found':
      return 'A sessao Supabase existe, mas nao foi encontrada membership para a empresa ativa informada no token.';
    case 'membership_inactive':
      return 'A membership da empresa ativa existe, mas esta inativa, convidada ou revogada.';
    case 'company_not_found':
      return 'A empresa ativa informada no token nao foi localizada no schema SaaS.';
    case 'company_inactive':
      return 'A empresa ativa existe, mas esta inativa ou suspensa no schema SaaS.';
    default:
      return null;
  }
};

export function TenantAccessBanner() {
  const { authSource, tenantAccess, effectivePermissions, isLoading } = useCurrentAppSession();
  const [deniedModule, setDeniedModule] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedModule = window.sessionStorage.getItem('fenix:last-denied-module');
    if (!storedModule) {
      return;
    }

    setDeniedModule(getModuleLabelForPath(storedModule) || storedModule);
    window.sessionStorage.removeItem('fenix:last-denied-module');
  }, []);

  if (isLoading || authSource === 'none' || authSource === 'legacy' || !tenantAccess) {
    return null;
  }

  const grantedPermissionsCount = Object.values(effectivePermissions || {}).filter(Boolean).length;

  if (tenantAccess.status === 'ready') {
    return (
      <Alert className="mb-4 border-emerald-500/40 bg-emerald-500/5">
        <AlertTitle className="flex flex-wrap items-center gap-2">
          <span>Tenant SaaS reconhecido</span>
          <Badge variant="secondary" className="bg-emerald-600/10 text-emerald-700">
            {authSource === 'legacy+supabase' ? 'Legado + SaaS' : 'SaaS ativo'}
          </Badge>
        </AlertTitle>
        <AlertDescription>
          <div className="flex flex-col gap-2">
            <p>
              Contexto ativo validado para a empresa{' '}
              <strong>{tenantAccess.company?.tradeName || tenantAccess.activeCompanyId}</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Empresa ativa: {tenantAccess.company?.slug || tenantAccess.activeCompanyId}</span>
              <span>Permissoes liberadas: {grantedPermissionsCount}</span>
              <span>
                Membership: {tenantAccess.membership?.isOwner ? 'owner' : tenantAccess.membership?.status || 'n/d'}
              </span>
            </div>
            {deniedModule ? (
              <p className="text-amber-700">
                Acesso ao modulo <strong>{deniedModule}</strong> foi bloqueado para esta role. O shell redirecionou voce para um modulo permitido.
              </p>
            ) : null}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const message = getTenantAccessMessage(tenantAccess.status);
  if (!message) {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-500/40 bg-amber-500/5">
      <AlertTitle>Contexto SaaS ainda bloqueado</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <p>{message}</p>
          <p className="text-xs text-muted-foreground">
            Enquanto esse estado nao for resolvido, o shell SaaS continua limitado para evitar gravacoes fora do tenant correto.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

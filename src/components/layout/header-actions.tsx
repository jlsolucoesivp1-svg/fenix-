'use client';

import * as React from 'react';
import Link from 'next/link';
import { CircleUser, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { hasUserPermission } from '@/lib/permissions';
import { signOut } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function HeaderActions() {
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const { user } = useCurrentUser();
  const session = useCurrentAppSession();

  const accountLabel =
    user?.name || session.supabaseUser?.loginName || session.supabaseUser?.email || 'Minha Conta';
  const runtimeLabel =
    session.authSource === 'supabase-only'
      ? 'SaaS'
      : session.authSource === 'legacy+supabase'
        ? 'Legado + SaaS'
        : 'Legado';
  const companyLabel =
    session.tenantAccess?.company?.tradeName || session.tenantAccess?.activeCompanyId || null;
  const showSettingsLink =
    session.authSource === 'supabase-only'
      ? hasUserPermission(session.effectivePermissions, 'accessSettings')
      : true;

  const handleLogout = async () => {
    await signOut();
    toast({ title: 'Logout bem-sucedido!', description: 'Voce foi desconectado.' });
    router.replace('/');
    setTimeout(() => window.location.reload(), 300);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="ghost" className="w-full justify-start gap-2" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        <span>{theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <CircleUser className="h-5 w-5" />
            <div className="flex min-w-0 flex-col items-start">
              <span className="text-sm font-medium">{accountLabel}</span>
              <span className="truncate text-xs text-muted-foreground">
                {companyLabel ? `${runtimeLabel} - ${companyLabel}` : runtimeLabel}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="mb-2 w-56">
          <DropdownMenuLabel className="space-y-2">
            <div>{accountLabel}</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{runtimeLabel}</Badge>
              {companyLabel ? <Badge variant="secondary">{companyLabel}</Badge> : null}
            </div>
          </DropdownMenuLabel>
          {showSettingsLink ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/configuracoes">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuracoes</span>
                </Link>
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Archive,
  Calendar,
  CircleDollarSign,
  FileLock2,
  FileSignature,
  FileText,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Users,
  Wrench,
} from 'lucide-react';
import type { UserPermissions } from '@/types';
import { hasUserPermission } from '@/lib/permissions';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useCurrentUser } from '@/hooks/use-current-user';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: keyof UserPermissions;
}

const allNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'accessDashboard' },
  { href: '/agenda', label: 'Agenda', icon: Calendar, permission: 'accessAgenda' },
  { href: '/clientes', label: 'Clientes', icon: Users, permission: 'accessClients' },
  { href: '/ordens-de-servico', label: 'Ordens de Servico', icon: Wrench, permission: 'accessServiceOrders' },
  { href: '/produtos', label: 'Produtos', icon: Archive, permission: 'accessInventory' },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart, permission: 'accessSales' },
  { href: '/orcamentos', label: 'Orcamentos', icon: FileText, permission: 'accessQuotes' },
  { href: '/laudos', label: 'Laudos Tecnicos', icon: FileSignature, permission: 'accessLaudos' },
  { href: '/financeiro', label: 'Financeiro', icon: CircleDollarSign, permission: 'accessFinancials' },
  { href: '/usuarios', label: 'Usuarios', icon: Users, permission: 'canManageUsers' },
  { href: '/configuracoes', label: 'Configuracoes', icon: Settings, permission: 'accessSettings' },
];

export function MainNav() {
  const pathname = usePathname();
  const { user: currentUser, isLoading } = useCurrentUser();
  const session = useCurrentAppSession();

  const navItems = React.useMemo(() => {
    if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant) {
      return allNavItems.filter((item) => hasUserPermission(session.effectivePermissions, item.permission));
    }

    if (!currentUser?.permissions) {
      return [];
    }

    return allNavItems.filter((item) => currentUser.permissions[item.permission]);
  }, [currentUser, session.authSource, session.effectivePermissions, session.tenantAccess?.canAccessTenant]);

  if (isLoading || session.isLoading) {
    return (
      <div className="flex flex-col gap-2 px-4 py-4">
        <p className="p-4 text-center text-xs text-muted-foreground">Carregando usuario...</p>
      </div>
    );
  }

  if (!currentUser && session.authSource !== 'supabase-only') {
    return (
      <div className="flex flex-col gap-2 px-4 py-4">
        <p className="p-4 text-center text-xs text-muted-foreground">Faca login para ver o menu.</p>
      </div>
    );
  }

  if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant && navItems.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar/40 p-4 text-sm group-data-[collapsible=icon]:hidden">
        <div className="mb-2 flex items-center gap-2 font-medium">
          <FileLock2 className="h-4 w-4" />
          Nenhum modulo liberado
        </div>
        <p className="text-xs text-sidebar-foreground/70">
          Sua role no tenant atual foi autenticada, mas ainda nao possui permissoes para navegar nos modulos.
        </p>
      </div>
    );
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive =
          pathname.startsWith(item.href) &&
          (item.href !== '/produtos' || pathname === '/produtos' || pathname.startsWith('/produtos/kits'));

        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href}>
              <SidebarMenuButton isActive={isActive} tooltip={item.label}>
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

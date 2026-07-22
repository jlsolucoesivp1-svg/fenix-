'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BadgeCheck,
  Building2,
  LayoutDashboard,
  Settings2,
  Shield,
  Users2,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/empresas', label: 'Empresas', icon: Building2 },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users2 },
  { href: '/admin/acessos', label: 'Acessos e memberships', icon: BadgeCheck },
  { href: '/admin/auditoria', label: 'Auditoria', icon: Activity },
  { href: '/admin/configuracoes', label: 'Configuracoes ADM', icon: Settings2 },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={item.label}
                className="data-[active=true]:bg-sky-500/15 data-[active=true]:text-sky-100 hover:bg-sky-500/10 hover:text-sky-50"
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
      <SidebarMenuItem>
        <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-3 text-xs text-sky-100/80 group-data-[collapsible=icon]:hidden">
          <div className="mb-2 flex items-center gap-2 font-medium text-sky-50">
            <Shield className="h-4 w-4" />
            Control Plane JL
          </div>
          <p>Acesso isolado da operacao comum dos tenants.</p>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

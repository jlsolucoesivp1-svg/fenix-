'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminUserMenu } from '@/components/admin/admin-user-menu';

interface AdminShellProps {
  children: React.ReactNode;
  operatorLabel: string;
  operatorEmail: string | null;
}

export function AdminShell({ children, operatorLabel, operatorEmail }: AdminShellProps) {
  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sky-500/10">
        <SidebarHeader className="border-b border-sky-500/10 bg-[#07162d]">
          <div className="flex items-center gap-3 text-sky-50">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-[#07162d] text-sky-50">
          <AdminNav />
        </SidebarContent>
        <SidebarFooter className="border-t border-sky-500/10 bg-[#07162d]">
          <AdminUserMenu operatorLabel={operatorLabel} operatorEmail={operatorEmail} />
        </SidebarFooter>
      </Sidebar>
      <div className="flex min-h-screen flex-1 flex-col bg-background">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 text-foreground backdrop-blur md:hidden">
          <SidebarTrigger />
          <div className="text-sm font-semibold">Painel Administrativo Fenix</div>
        </header>
        <SidebarInset className="bg-transparent p-4 md:p-6">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}

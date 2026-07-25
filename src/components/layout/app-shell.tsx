'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { BrowserSessionGuard } from '@/components/layout/browser-session-guard';
import { HeaderActions } from '@/components/layout/header-actions';
import { SupabaseModuleGuard } from '@/components/layout/supabase-module-guard';
import { Logo } from '@/components/logo';
import { MainNav } from '@/components/main-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrowserSessionGuard />
      <SupabaseModuleGuard />
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
          <SidebarFooter>
            <HeaderActions />
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger />
            <div className="flex-1 text-center">
              <Logo />
            </div>
          </header>
          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
}

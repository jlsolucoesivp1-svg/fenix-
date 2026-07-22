'use client';

import { LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signOut } from '@/lib/storage';

interface AdminUserMenuProps {
  operatorLabel: string;
  operatorEmail: string | null;
}

export function AdminUserMenu({ operatorLabel, operatorEmail }: AdminUserMenuProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({ title: 'Sessao encerrada', description: 'O acesso administrativo foi finalizado.' });
    router.replace('/');
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-3 text-sky-50">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        <Badge variant="outline" className="border-sky-300/30 bg-transparent text-sky-100">
          Superadmin JL
        </Badge>
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">{operatorLabel}</div>
        <div className="text-xs text-sky-100/70">{operatorEmail || 'Operador autenticado'}</div>
      </div>
      <Button
        variant="ghost"
        className="mt-3 w-full justify-start text-sky-50 hover:bg-sky-500/10 hover:text-white"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Encerrar sessao
      </Button>
    </div>
  );
}

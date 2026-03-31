
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CircleUser,
  LogOut,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut } from '@/lib/storage';
import { useCurrentUser } from '@/hooks/use-current-user';

export function HeaderActions() {
    const router = useRouter();
    const { toast } = useToast();
    const { setTheme, theme } = useTheme();
    const { user } = useCurrentUser();

    const handleLogout = async () => {
        await signOut();
        toast({ title: 'Logout bem-sucedido!', description: 'Você foi desconectado.' });
        router.replace('/'); 
        // A recarga da janela ajuda a limpar completamente o estado do aplicativo
        setTimeout(() => window.location.reload(), 300); 
    };
    
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }

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
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{user?.name || 'Minha Conta'}</span>
                    </div>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mb-2">
                <DropdownMenuLabel>{user?.name || 'Minha Conta'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/configuracoes">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                    </Link>
                </DropdownMenuItem>
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

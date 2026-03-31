
'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAppointments, saveAppointments } from '@/lib/storage';
import type { Appointment } from '@/types';
import { format, isToday, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


export function TodayAppointments() {
  const { toast } = useToast();
  const [todaysAppointments, setTodaysAppointments] = React.useState<Appointment[]>([]);

  const loadAppointments = async () => {
    const allAppointments = await getAppointments();
    const today = new Date();
    const filtered = allAppointments
      .filter(appt => isToday(parseISO(appt.start)) && appt.extendedProps.status === 'agendado')
      .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
    setTodaysAppointments(filtered);
  };

  React.useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (appointmentId: string, newStatus: 'concluido' | 'cancelado') => {
    const allAppointments = await getAppointments();
    const updatedAppointments = allAppointments.map(appt => 
      appt.id === appointmentId ? { ...appt, extendedProps: { ...appt.extendedProps, status: newStatus } } : appt
    );
    await saveAppointments(updatedAppointments);
    
    // Refresh the list on the dashboard
    loadAppointments();

    toast({
      title: 'Status Atualizado!',
      description: `O agendamento foi marcado como ${newStatus === 'concluido' ? 'concluído' : 'cancelado'}.`,
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Agendamentos de Hoje</CardTitle>
        <CardDescription>
          Você tem {todaysAppointments.length} agendamento(s) pendente(s) para hoje.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        {todaysAppointments.length > 0 ? (
          <div className="space-y-1">
            {todaysAppointments.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between gap-4 px-6 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarFallback>{appt.extendedProps.customerName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{appt.extendedProps.customerName}</p>
                        <p className="text-sm text-muted-foreground">{appt.extendedProps.serviceType}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="font-medium">{format(parseISO(appt.start), 'HH:mm')}</p>
                        <p className="text-xs text-muted-foreground">{appt.extendedProps.address}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleUpdateStatus(appt.id, 'concluido')}>
                          Marcar como Concluído
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleUpdateStatus(appt.id, 'cancelado')}>
                          Cancelar Agendamento
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/agenda">Ver na Agenda</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <p className="text-muted-foreground">Nenhum agendamento para hoje.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

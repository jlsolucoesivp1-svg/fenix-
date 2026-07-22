'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, isToday, parseISO } from 'date-fns';
import { CalendarClock, MoreHorizontal } from 'lucide-react';
import type { Appointment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getAppointments, saveAppointments } from '@/lib/storage';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TodayAppointmentsProps = {
  appointments?: Appointment[];
  isLoading?: boolean;
  onUpdateStatus?: (appointmentId: string, newStatus: 'concluido' | 'cancelado') => Promise<void>;
};

export function TodayAppointments({
  appointments: externalAppointments,
  isLoading = false,
  onUpdateStatus,
}: TodayAppointmentsProps) {
  const { toast } = useToast();
  const [todaysAppointments, setTodaysAppointments] = React.useState<Appointment[]>([]);

  const loadAppointments = React.useCallback(async () => {
    if (externalAppointments) {
      setTodaysAppointments(externalAppointments);
      return;
    }

    const allAppointments = await getAppointments();
    const filtered = allAppointments
      .filter(
        (appointment) =>
          isToday(parseISO(appointment.start)) &&
          appointment.extendedProps.status === 'agendado'
      )
      .sort((left, right) => parseISO(left.start).getTime() - parseISO(right.start).getTime());

    setTodaysAppointments(filtered);
  }, [externalAppointments]);

  React.useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: 'concluido' | 'cancelado'
  ) => {
    if (onUpdateStatus) {
      await onUpdateStatus(appointmentId, newStatus);
      const updatedAppointments = todaysAppointments.filter(
        (appointment) => appointment.id !== appointmentId
      );
      setTodaysAppointments(updatedAppointments);
      return;
    }

    const allAppointments = await getAppointments();
    const updatedAppointments = allAppointments.map((appointment) =>
      appointment.id === appointmentId
        ? {
            ...appointment,
            extendedProps: {
              ...appointment.extendedProps,
              status: newStatus,
            },
          }
        : appointment
    );

    await saveAppointments(updatedAppointments);
    await loadAppointments();

    toast({
      title: 'Status atualizado!',
      description: `O agendamento foi marcado como ${
        newStatus === 'concluido' ? 'concluido' : 'cancelado'
      }.`,
    });
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Agendamentos de Hoje</CardTitle>
        <CardDescription>
          {isLoading
            ? 'Carregando compromissos do tenant atual.'
            : `Voce tem ${todaysAppointments.length} agendamento(s) pendente(s) para hoje.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="text-muted-foreground">Carregando agendamentos...</p>
          </div>
        ) : todaysAppointments.length > 0 ? (
          <div className="space-y-1">
            {todaysAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between gap-4 border-b px-6 py-3 transition-colors hover:bg-muted/50 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {appointment.extendedProps.customerName?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{appointment.extendedProps.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.extendedProps.serviceType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{format(parseISO(appointment.start), 'HH:mm')}</p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.extendedProps.address}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acoes</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => void handleUpdateStatus(appointment.id, 'concluido')}
                      >
                        Marcar como concluido
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => void handleUpdateStatus(appointment.id, 'cancelado')}
                      >
                        Cancelar agendamento
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/agenda">Ver na agenda</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <CalendarClock className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Nenhum agendamento para hoje.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sua fila de compromissos do dia esta vazia no momento.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/agenda">Abrir agenda completa</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

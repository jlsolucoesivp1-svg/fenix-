
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAppointments, saveAppointments, getCustomers } from '@/lib/storage';
import type { Appointment, Customer } from '@/types';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { Skeleton } from '../ui/skeleton';

type StatusFilter = 'agendado' | 'concluido' | 'cancelado' | 'todos';

const getEventColor = (status: Appointment['extendedProps']['status']) => {
    switch (status) {
      case 'agendado':
        return '#3b82f6'; // blue-500
      case 'concluido':
        return '#22c55e'; // green-500
      case 'cancelado':
        return '#64748b'; // slate-500
      default:
        return '#3b82f6';
    }
};

export default function CalendarView() {
  const { toast } = useToast();
  const [allAppointments, setAllAppointments] = React.useState<Appointment[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Partial<Appointment> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('agendado');

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [appointmentsData, customersData] = await Promise.all([
        getAppointments(),
        getCustomers(),
      ]);
      setAllAppointments(appointmentsData);
      setCustomers(customersData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const calendarEvents = React.useMemo(() => {
    const filtered = statusFilter === 'todos'
        ? allAppointments
        : allAppointments.filter(appt => appt.extendedProps.status === statusFilter);

    return filtered.map(appt => ({
        ...appt,
        color: getEventColor(appt.extendedProps.status),
        borderColor: getEventColor(appt.extendedProps.status),
    }));
  }, [allAppointments, statusFilter]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      extendedProps: { status: 'agendado' }
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
      extendedProps: {
        customerId: event.extendedProps.customerId,
        customerName: event.extendedProps.customerName,
        address: event.extendedProps.address,
        serviceType: event.extendedProps.serviceType,
        notes: event.extendedProps.notes,
        status: event.extendedProps.status,
      },
    });
    setIsDialogOpen(true);
  };
  
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    const updatedAppointment: Appointment = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
      extendedProps: event.extendedProps as Appointment['extendedProps'],
    };
    const updatedAppointments = allAppointments.map(appt => appt.id === updatedAppointment.id ? updatedAppointment : appt);
    setAllAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
    toast({ title: 'Compromisso reagendado!', description: `O compromisso foi movido para a nova data.` });
  }
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveAppointment = async () => {
    if (!selectedEvent || !selectedEvent.extendedProps) return;

    const { customerId, serviceType, status } = selectedEvent.extendedProps;
    const customer = customers.find(c => c.id === customerId);

    if (!customer || !serviceType) {
      toast({ variant: 'destructive', title: 'Dados incompletos', description: 'Por favor, selecione um cliente e o tipo de serviço.' });
      return;
    }

    const newOrUpdatedAppointment: Appointment = {
      id: selectedEvent.id || `APT-${Date.now()}`,
      title: `${customer.name} - ${serviceType}`,
      start: selectedEvent.start!,
      end: selectedEvent.end!,
      allDay: selectedEvent.allDay!,
      extendedProps: {
        ...selectedEvent.extendedProps,
        status: status || 'agendado',
        customerName: customer.name,
        address: selectedEvent.extendedProps.address || customer.address
      },
    };

    let updatedAppointments;
    if (selectedEvent.id) {
      updatedAppointments = allAppointments.map(appt => appt.id === newOrUpdatedAppointment.id ? newOrUpdatedAppointment : appt);
    } else {
      updatedAppointments = [...allAppointments, newOrUpdatedAppointment];
    }
    
    setAllAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
    
    toast({ title: 'Compromisso salvo!', description: 'O agendamento foi salvo com sucesso.' });
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };
  
  if (isLoading) {
    return (
       <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2 mb-4">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
        <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar status..." />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="agendado">Agendados</SelectItem>
            <SelectItem value="concluido">Concluídos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
        </SelectContent>
        </Select>
        <Button size="sm" onClick={() => handleDateSelect({ startStr: new Date().toISOString(), endStr: '', allDay: true, view: {} as any })}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Novo Agendamento
        </Button>
      </div>

      <div className="min-h-[600px] text-sm">
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView="dayGridMonth"
            locale="pt-br"
            buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            }}
            events={calendarEvents}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            editable={true}
            droppable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.id ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
            <DialogDescription>Preencha os detalhes do compromisso.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid gap-4 py-4 px-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Cliente</Label>
                  <Select
                    value={selectedEvent?.extendedProps?.customerId}
                    onValueChange={(value) => setSelectedEvent(prev => ({...prev, extendedProps: {...prev?.extendedProps, customerId: value}}))}
                  >
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={selectedEvent?.extendedProps?.status || 'agendado'}
                    onValueChange={(value: 'agendado' | 'concluido' | 'cancelado') => setSelectedEvent(prev => ({...prev, extendedProps: {...prev?.extendedProps, status: value}}))}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de Serviço</Label>
                <Input
                  id="serviceType"
                  placeholder="Ex: Manutenção de impressora"
                  value={selectedEvent?.extendedProps?.serviceType || ''}
                  onChange={(e) => setSelectedEvent(prev => ({...prev, extendedProps: {...prev?.extendedProps, serviceType: e.target.value}}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço do Atendimento</Label>
                <Input
                  id="address"
                  placeholder="Preenchido automaticamente pelo cliente ou informe um novo."
                  value={selectedEvent?.extendedProps?.address || customers.find(c=>c.id === selectedEvent?.extendedProps?.customerId)?.address || ''}
                  onChange={(e) => setSelectedEvent(prev => ({...prev, extendedProps: {...prev?.extendedProps, address: e.target.value}}))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input type="datetime-local" value={selectedEvent?.start?.slice(0,16) || ''} onChange={e => setSelectedEvent(p => ({ ...p, start: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                      <Label>Data de Fim</Label>
                      <Input type="datetime-local" value={selectedEvent?.end?.slice(0,16) || ''} onChange={e => setSelectedEvent(p => ({ ...p, end: e.target.value }))} />
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Anotações Adicionais</Label>
                <Textarea
                  id="notes"
                  placeholder="Detalhes importantes, pontos de referência, etc."
                  value={selectedEvent?.extendedProps?.notes || ''}
                  onChange={(e) => setSelectedEvent(prev => ({...prev, extendedProps: {...prev?.extendedProps, notes: e.target.value}}))}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 pb-4 pt-2">
            <Button variant="ghost" onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSaveAppointment}>Salvar Agendamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

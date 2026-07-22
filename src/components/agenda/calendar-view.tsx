'use client';

import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core';
import { isToday, parseISO } from 'date-fns';
import { AlertCircle, CalendarClock, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { CustomerAutocomplete } from '@/components/customers/customer-autocomplete';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ModuleState } from '@/components/ui/module-state';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useToast } from '@/hooks/use-toast';
import type { Appointment, Customer } from '@/types';
import {
  createTenantAppointment,
  deleteTenantAppointment,
  getAppointments,
  getCustomers,
  listTenantAppointments,
  listTenantCustomers,
  saveAppointments,
  searchTenantCustomers,
  updateTenantAppointment,
} from '@/lib/storage';

type StatusFilter = 'agendado' | 'concluido' | 'cancelado' | 'todos';
type AppointmentDraft = Partial<Omit<Appointment, 'extendedProps'>> & {
  extendedProps: Partial<Appointment['extendedProps']>;
};

const getEventColor = (status: Appointment['extendedProps']['status']) => {
  switch (status) {
    case 'agendado':
      return '#3b82f6';
    case 'concluido':
      return '#22c55e';
    case 'cancelado':
      return '#64748b';
    default:
      return '#3b82f6';
  }
};

const buildAppointmentFromDraft = (
  selectedEvent: AppointmentDraft,
  customers: Customer[]
): Appointment | null => {
  const customerId = selectedEvent.extendedProps.customerId;
  const serviceType = selectedEvent.extendedProps.serviceType?.trim();
  const status = selectedEvent.extendedProps.status;

  if (!customerId || !serviceType || !status || !selectedEvent.start || !selectedEvent.end) {
    return null;
  }

  const customer = customers.find((entry) => entry.id === customerId);
  if (!customer) {
    return null;
  }

  return {
    id: selectedEvent.id || `APT-${Date.now()}`,
    title: `${customer.name} - ${serviceType}`,
    start: selectedEvent.start,
    end: selectedEvent.end,
    allDay: selectedEvent.allDay ?? false,
    extendedProps: {
      customerId,
      customerName: customer.name,
      address: selectedEvent.extendedProps.address || customer.address,
      serviceType,
      notes: selectedEvent.extendedProps.notes?.trim() || undefined,
      status,
    },
  };
};

export default function CalendarView() {
  const { toast } = useToast();
  const session = useCurrentAppSession();

  const [allAppointments, setAllAppointments] = React.useState<Appointment[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<AppointmentDraft | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('agendado');
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const useSaasAgenda =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      if (useSaasAgenda) {
        const [appointmentsData, customersData] = await Promise.all([
          listTenantAppointments(),
          listTenantCustomers(),
        ]);
        setAllAppointments(appointmentsData);
        setCustomers(customersData);
        return;
      }

      const [appointmentsData, customersData] = await Promise.all([getAppointments(), getCustomers()]);
      setAllAppointments(appointmentsData);
      setCustomers(customersData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar a agenda.';
      setLoadError(message);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar agenda',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, useSaasAgenda]);

  React.useEffect(() => {
    if (session.isLoading) {
      return;
    }

    void loadData();
  }, [loadData, session.isLoading]);

  const calendarEvents = React.useMemo(() => {
    const filtered =
      statusFilter === 'todos'
        ? allAppointments
        : allAppointments.filter((appt) => appt.extendedProps.status === statusFilter);

    return filtered.map((appt) => ({
      ...appt,
      color: getEventColor(appt.extendedProps.status),
      borderColor: getEventColor(appt.extendedProps.status),
    }));
  }, [allAppointments, statusFilter]);

  const pendingAppointmentsCount = React.useMemo(
    () => allAppointments.filter((appt) => appt.extendedProps.status === 'agendado').length,
    [allAppointments]
  );
  const todaysAppointmentsCount = React.useMemo(
    () => allAppointments.filter((appt) => isToday(parseISO(appt.start))).length,
    [allAppointments]
  );

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      extendedProps: { status: 'agendado' },
    });
    setIsDialogOpen(true);
  };

  const handleCreateAppointment = () => {
    const now = new Date();
    const start = new Date(now.getTime() - now.getSeconds() * 1000 - now.getMilliseconds());
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setSelectedEvent({
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      extendedProps: { status: 'agendado' },
    });
    setIsDialogOpen(true);
  };

  const updateSelectedEvent = (updater: (prev: AppointmentDraft) => AppointmentDraft) => {
    setSelectedEvent((prev) => (prev ? updater(prev) : prev));
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

  const handlePersistAppointmentsLegacy = async (updatedAppointments: Appointment[]) => {
    setAllAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
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

    try {
      if (useSaasAgenda) {
        const savedAppointment = await updateTenantAppointment(updatedAppointment);
        setAllAppointments((current) =>
          current.map((appt) => (appt.id === savedAppointment.id ? savedAppointment : appt))
        );
      } else {
        const updatedAppointments = allAppointments.map((appt) =>
          appt.id === updatedAppointment.id ? updatedAppointment : appt
        );
        await handlePersistAppointmentsLegacy(updatedAppointments);
      }

      toast({
        title: 'Compromisso reagendado!',
        description: 'O compromisso foi movido para a nova data.',
      });
    } catch (error) {
      dropInfo.revert();
      toast({
        variant: 'destructive',
        title: 'Erro ao reagendar',
        description: error instanceof Error ? error.message : 'Nao foi possivel reagendar o compromisso.',
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveAppointment = async () => {
    if (!selectedEvent) return;

    const appointment = buildAppointmentFromDraft(selectedEvent, customers);
    if (!appointment) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Por favor, selecione um cliente, informe o tipo de servico e as datas.',
      });
      return;
    }

    try {
      setIsSaving(true);

      if (useSaasAgenda) {
        const savedAppointment = selectedEvent.id
          ? await updateTenantAppointment(appointment)
          : await createTenantAppointment(appointment);

        setAllAppointments((current) =>
          selectedEvent.id
            ? current.map((appt) => (appt.id === savedAppointment.id ? savedAppointment : appt))
            : [...current, savedAppointment]
        );
      } else {
        let updatedAppointments: Appointment[];
        if (selectedEvent.id) {
          updatedAppointments = allAppointments.map((appt) =>
            appt.id === appointment.id ? appointment : appt
          );
        } else {
          updatedAppointments = [...allAppointments, appointment];
        }

        await handlePersistAppointmentsLegacy(updatedAppointments);
      }

      toast({ title: 'Compromisso salvo!', description: 'O agendamento foi salvo com sucesso.' });
      handleCloseDialog();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar agendamento',
        description: error instanceof Error ? error.message : 'Nao foi possivel salvar o agendamento.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedEvent?.id) {
      return;
    }

    try {
      setIsSaving(true);

      if (useSaasAgenda) {
        await deleteTenantAppointment(selectedEvent.id);
      } else {
        const updatedAppointments = allAppointments.filter((appt) => appt.id !== selectedEvent.id);
        await handlePersistAppointmentsLegacy(updatedAppointments);
      }

      if (useSaasAgenda) {
        setAllAppointments((current) => current.filter((appt) => appt.id !== selectedEvent.id));
      }

      toast({ title: 'Agendamento excluido!', description: 'O compromisso foi removido.' });
      handleCloseDialog();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir agendamento',
        description: error instanceof Error ? error.message : 'Nao foi possivel excluir o agendamento.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (session.isLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <ModuleState
        title="Nao foi possivel carregar a agenda"
        description={loadError}
        icon={AlertCircle}
        tone="destructive"
        actionLabel="Tentar novamente"
        onAction={() => void loadData()}
      />
    );
  }

  return (
    <>
      <div className="mb-4 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Hoje</p>
              <p className="text-2xl font-semibold">{todaysAppointmentsCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-semibold">{pendingAppointmentsCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Clientes carregados</p>
              <p className="text-2xl font-semibold">{customers.length}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => void loadData()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agendado">Agendados</SelectItem>
                <SelectItem value="concluido">Concluidos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleCreateAppointment}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>
        </div>
      </div>

      {calendarEvents.length === 0 ? (
        <div className="mb-4">
          <ModuleState
            title="Nenhum compromisso neste filtro"
            description={
              allAppointments.length === 0
                ? 'Ainda nao existem agendamentos cadastrados para o contexto atual.'
                : 'Nao ha compromissos visiveis com o filtro selecionado.'
            }
            icon={CalendarClock}
            compact
            actionLabel={allAppointments.length === 0 ? 'Criar primeiro agendamento' : 'Mostrar todos'}
            onAction={allAppointments.length === 0 ? handleCreateAppointment : () => setStatusFilter('todos')}
          />
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-end gap-2">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="agendado">Agendados</SelectItem>
            <SelectItem value="concluido">Concluidos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-[600px] text-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          locale="pt-br"
          buttonText={{
            today: 'Hoje',
            month: 'Mes',
            week: 'Semana',
            day: 'Dia',
          }}
          events={calendarEvents}
          selectable
          selectMirror
          dayMaxEvents
          editable
          droppable
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
            <div className="grid gap-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Cliente</Label>
                  <CustomerAutocomplete
                    id="customer"
                    selectedCustomer={customers.find((c) => c.id === selectedEvent?.extendedProps?.customerId) ?? null}
                    onSelect={(customer) =>
                      updateSelectedEvent((prev) => ({
                        ...prev,
                        extendedProps: {
                          ...prev.extendedProps,
                          customerId: customer?.id,
                          address: customer
                            ? customers.find((item) => item.id === customer.id)?.address || prev.extendedProps.address
                            : prev.extendedProps.address,
                        },
                      }))
                    }
                    searchFunction={useSaasAgenda ? searchTenantCustomers : undefined}
                    placeholder="Buscar cliente para o agendamento..."
                    emptyMessage="Nenhum cliente encontrado."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={selectedEvent?.extendedProps?.status || 'agendado'}
                    onValueChange={(value: 'agendado' | 'concluido' | 'cancelado') =>
                      updateSelectedEvent((prev) => ({
                        ...prev,
                        extendedProps: { ...prev.extendedProps, status: value },
                      }))
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="concluido">Concluido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de Servico</Label>
                <Input
                  id="serviceType"
                  placeholder="Ex: Manutencao de impressora"
                  value={selectedEvent?.extendedProps?.serviceType || ''}
                  onChange={(e) =>
                    updateSelectedEvent((prev) => ({
                      ...prev,
                      extendedProps: { ...prev.extendedProps, serviceType: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereco do Atendimento</Label>
                <Input
                  id="address"
                  placeholder="Preenchido automaticamente pelo cliente ou informe um novo."
                  value={
                    selectedEvent?.extendedProps?.address ||
                    customers.find((c) => c.id === selectedEvent?.extendedProps?.customerId)?.address ||
                    ''
                  }
                  onChange={(e) =>
                    updateSelectedEvent((prev) => ({
                      ...prev,
                      extendedProps: { ...prev.extendedProps, address: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Inicio</Label>
                  <Input
                    type="datetime-local"
                    value={selectedEvent?.start?.slice(0, 16) || ''}
                    onChange={(e) => updateSelectedEvent((prev) => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Fim</Label>
                  <Input
                    type="datetime-local"
                    value={selectedEvent?.end?.slice(0, 16) || ''}
                    onChange={(e) => updateSelectedEvent((prev) => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Anotacoes Adicionais</Label>
                <Textarea
                  id="notes"
                  placeholder="Detalhes importantes, pontos de referencia, etc."
                  value={selectedEvent?.extendedProps?.notes || ''}
                  onChange={(e) =>
                    updateSelectedEvent((prev) => ({
                      ...prev,
                      extendedProps: { ...prev.extendedProps, notes: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 pb-4 pt-2">
            {selectedEvent?.id ? (
              <Button
                variant="destructive"
                onClick={handleDeleteAppointment}
                disabled={isSaving}
                className="mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            ) : null}
            <Button variant="ghost" onClick={handleCloseDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAppointment} disabled={isSaving}>
              Salvar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

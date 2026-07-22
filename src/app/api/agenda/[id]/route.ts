import { NextResponse } from 'next/server';
import type { Appointment } from '@/types';
import { deleteSaasAppointment, updateSaasAppointment } from '@/lib/server/saas-appointments';
import { requireSaasPermission } from '@/lib/server/saas-authz';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const validateAppointmentPayload = (payload: unknown, id: string): Appointment => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de agendamento invalido.');
  }

  const appointment = payload as Partial<Appointment>;
  const extendedProps = appointment.extendedProps;

  if (!appointment.start || !appointment.end) {
    throw new Error('Data inicial e final sao obrigatorias.');
  }

  if (!extendedProps?.status) {
    throw new Error('Status do agendamento obrigatorio.');
  }

  return {
    id,
    title: appointment.title?.trim() || '',
    start: appointment.start,
    end: appointment.end,
    allDay: appointment.allDay === true,
    extendedProps: {
      customerId: extendedProps.customerId?.trim() || undefined,
      customerName: extendedProps.customerName?.trim() || undefined,
      address: extendedProps.address?.trim() || undefined,
      serviceType: extendedProps.serviceType?.trim() || undefined,
      notes: extendedProps.notes?.trim() || undefined,
      status: extendedProps.status,
    },
  };
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const saasContext = await requireSaasPermission(
      'accessAgenda',
      'Modulo de agenda SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar a agenda.'
    );
    if (saasContext instanceof NextResponse) {
      return saasContext;
    }

    const { id } = await context.params;
    const appointment = validateAppointmentPayload(await request.json(), id);
    const updatedAppointment = await updateSaasAppointment({
      accessToken: saasContext.accessToken,
      companyId: saasContext.companyId,
      appointment,
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Erro ao atualizar agendamento SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao atualizar agendamento SaaS.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const saasContext = await requireSaasPermission(
      'accessAgenda',
      'Modulo de agenda SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para excluir agendamentos.'
    );
    if (saasContext instanceof NextResponse) {
      return saasContext;
    }

    const { id } = await context.params;
    await deleteSaasAppointment({
      accessToken: saasContext.accessToken,
      companyId: saasContext.companyId,
      appointmentId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir agendamento SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao excluir agendamento SaaS.' },
      { status: 500 }
    );
  }
}

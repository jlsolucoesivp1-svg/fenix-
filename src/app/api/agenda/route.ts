import { NextResponse } from 'next/server';
import type { Appointment } from '@/types';
import { createSaasAppointment, listSaasAppointments } from '@/lib/server/saas-appointments';
import { requireSaasPermission } from '@/lib/server/saas-authz';

const validateAppointmentPayload = (payload: unknown): Appointment => {
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
    id: appointment.id?.trim() || '',
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

export async function GET() {
  try {
    const context = await requireSaasPermission(
      'accessAgenda',
      'Modulo de agenda SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para acessar a agenda.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const appointments = await listSaasAppointments(context.accessToken);
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Erro ao listar agenda SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar agenda SaaS.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessAgenda',
      'Modulo de agenda SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar a agenda.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const appointment = validateAppointmentPayload(await request.json());
    const createdAppointment = await createSaasAppointment({
      accessToken: context.accessToken,
      companyId: context.companyId,
      appointment,
    });

    return NextResponse.json(createdAppointment);
  } catch (error) {
    console.error('Erro ao criar agendamento SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao criar agendamento SaaS.' },
      { status: 500 }
    );
  }
}

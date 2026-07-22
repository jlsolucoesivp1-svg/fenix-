import type { Appointment } from '@/types';
import type { AppointmentRecord } from '@/types/saas';
import { getSupabaseUserConfig } from './supabase-user';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const APPOINTMENTS_SELECT_FIELDS =
  'id,company_id,title,start_at,end_at,all_day,customer_id,customer_name,address,service_type,notes,status';

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildAppointmentsUrl = (params: Record<string, string>) => {
  const { url } = getSupabaseUserConfig();
  const searchParams = new URLSearchParams(params);
  return `${url}/rest/v1/appointments?${searchParams.toString()}`;
};

const buildHeaders = (accessToken: string, preferRepresentation = false) => {
  const { anonKey } = getSupabaseUserConfig();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(preferRepresentation ? { Prefer: 'return=representation' } : {}),
  };
};

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as SupabaseErrorPayload;
    return payload.message || payload.error || `Falha na operacao (${response.status}).`;
  } catch {
    return `Falha na operacao (${response.status}).`;
  }
};

const toIsoString = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Data invalida para agendamento.');
  }

  return date.toISOString();
};

const mapAppointmentRecord = (record: AppointmentRecord): Appointment => ({
  id: record.id,
  title: record.title,
  start: record.start_at,
  end: record.end_at,
  allDay: record.all_day,
  extendedProps: {
    customerId: record.customer_id || undefined,
    customerName: record.customer_name || undefined,
    address: record.address || undefined,
    serviceType: record.service_type || undefined,
    notes: record.notes || undefined,
    status: record.status,
  },
});

const mapAppointmentInput = (params: {
  id: string;
  companyId: string;
  appointment: Appointment;
}) => ({
  id: params.id,
  company_id: params.companyId,
  title: params.appointment.title.trim(),
  start_at: toIsoString(params.appointment.start),
  end_at: toIsoString(params.appointment.end),
  all_day: params.appointment.allDay,
  customer_id: normalizeOptionalText(params.appointment.extendedProps.customerId),
  customer_name: normalizeOptionalText(params.appointment.extendedProps.customerName),
  address: normalizeOptionalText(params.appointment.extendedProps.address),
  service_type: normalizeOptionalText(params.appointment.extendedProps.serviceType),
  notes: normalizeOptionalText(params.appointment.extendedProps.notes),
  status: params.appointment.extendedProps.status,
});

export const generateAppointmentId = () =>
  `APT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const listSaasAppointments = async (accessToken: string): Promise<Appointment[]> => {
  const response = await fetch(
    buildAppointmentsUrl({
      select: APPOINTMENTS_SELECT_FIELDS,
      order: 'start_at.asc',
    }),
    {
      method: 'GET',
      headers: buildHeaders(accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as AppointmentRecord[];
  return rows.map(mapAppointmentRecord);
};

export const createSaasAppointment = async (params: {
  accessToken: string;
  companyId: string;
  appointment: Appointment;
  id?: string;
}): Promise<Appointment> => {
  const id = params.id?.trim() || generateAppointmentId();
  const payload = mapAppointmentInput({
    id,
    companyId: params.companyId,
    appointment: { ...params.appointment, id },
  });

  const response = await fetch(
    buildAppointmentsUrl({ select: APPOINTMENTS_SELECT_FIELDS }),
    {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(payload),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as AppointmentRecord[];
  const record = rows[0];
  if (!record) {
    throw new Error('Agendamento criado sem retorno da API.');
  }

  return mapAppointmentRecord(record);
};

export const updateSaasAppointment = async (params: {
  accessToken: string;
  companyId: string;
  appointment: Appointment;
}): Promise<Appointment> => {
  const response = await fetch(
    buildAppointmentsUrl({
      select: APPOINTMENTS_SELECT_FIELDS,
      id: `eq.${params.appointment.id}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(
        mapAppointmentInput({
          id: params.appointment.id,
          companyId: params.companyId,
          appointment: params.appointment,
        })
      ),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as AppointmentRecord[];
  const record = rows[0];
  if (!record) {
    throw new Error('Agendamento nao encontrado para atualizacao.');
  }

  return mapAppointmentRecord(record);
};

export const deleteSaasAppointment = async (params: {
  accessToken: string;
  companyId: string;
  appointmentId: string;
}): Promise<void> => {
  const response = await fetch(
    buildAppointmentsUrl({
      id: `eq.${params.appointmentId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'DELETE',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};

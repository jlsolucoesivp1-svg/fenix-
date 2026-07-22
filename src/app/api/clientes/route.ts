import { NextResponse } from 'next/server';
import type { Customer } from '@/types';
import { createSaasCustomer, listSaasCustomers } from '@/lib/server/saas-customers';
import { requireSaasPermission } from '@/lib/server/saas-authz';

const validateCustomerPayload = (payload: unknown): Omit<Customer, 'id'> => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de cliente invalido.');
  }

  const customer = payload as Partial<Customer>;
  if (!customer.name?.trim()) {
    throw new Error('Nome do cliente obrigatorio.');
  }

  return {
    name: customer.name.trim(),
    phone: customer.phone?.trim() || '',
    email: customer.email?.trim() || '',
    address: customer.address?.trim() || '',
    document: customer.document?.trim() || '',
    cep: customer.cep?.trim() || '',
  };
};

export async function GET() {
  try {
    const context = await requireSaasPermission(
      'accessClients',
      'Modulo de clientes SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para acessar clientes.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const customers = await listSaasCustomers(context.accessToken);
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Erro ao listar clientes SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar clientes SaaS.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessClients',
      'Modulo de clientes SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar clientes.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const payload = validateCustomerPayload(await request.json());
    const customer = await createSaasCustomer({
      accessToken: context.accessToken,
      companyId: context.companyId,
      customer: payload,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erro ao criar cliente SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao criar cliente SaaS.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import type { Customer } from '@/types';
import { deleteSaasCustomer, updateSaasCustomer } from '@/lib/server/saas-customers';
import { requireSaasPermission } from '@/lib/server/saas-authz';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PUT(request: Request, context: RouteContext) {
  try {
    const saasContext = await requireSaasPermission(
      'accessClients',
      'Modulo de clientes SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar clientes.'
    );
    if (saasContext instanceof NextResponse) {
      return saasContext;
    }

    const { id } = await context.params;
    const payload = validateCustomerPayload(await request.json());
    const customer = await updateSaasCustomer({
      accessToken: saasContext.accessToken,
      companyId: saasContext.companyId,
      customerId: id,
      customer: payload,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erro ao atualizar cliente SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao atualizar cliente SaaS.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const saasContext = await requireSaasPermission(
      'accessClients',
      'Modulo de clientes SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para excluir clientes.'
    );
    if (saasContext instanceof NextResponse) {
      return saasContext;
    }

    const { id } = await context.params;
    await deleteSaasCustomer({
      accessToken: saasContext.accessToken,
      companyId: saasContext.companyId,
      customerId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir cliente SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao excluir cliente SaaS.' },
      { status: 500 }
    );
  }
}

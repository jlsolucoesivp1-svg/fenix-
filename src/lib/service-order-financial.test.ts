import { describe, expect, it, vi } from 'vitest';
import {
  buildServiceOrderFinalization,
  resolveServiceOrderStatusFromBalance,
  resolveServiceOrderStatusFromPaymentStatus,
  upsertServiceOrderFinalizationTransaction,
} from './service-order-financial';
import type { FinancialTransaction, ServiceOrder } from '@/types';

const baseOrder = {
  id: '12',
  customerName: 'Cliente Teste',
  equipment: 'Notebook Dell',
  reportedProblem: 'Nao liga',
  status: 'Aprovado',
  date: '2026-07-11',
  attendant: 'Atendente',
  totalValue: 150,
} as ServiceOrder;

describe('service-order-financial', () => {
  it('derives status from payment state and balance', () => {
    expect(resolveServiceOrderStatusFromPaymentStatus('pago')).toBe('Finalizado');
    expect(resolveServiceOrderStatusFromPaymentStatus('pendente')).toBe('Aguardando Pagamento');
    expect(resolveServiceOrderStatusFromBalance(0)).toBe('Finalizado');
    expect(resolveServiceOrderStatusFromBalance(10)).toBe('Aguardando Pagamento');
  });

  it('builds a paid finalization with payment record and service transaction', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);

    const result = buildServiceOrderFinalization({
      serviceOrder: baseOrder,
      amount: 150,
      paymentMethod: 'PIX',
      paymentStatus: 'pago',
      observation: 'Pago no balcão',
      transactionDate: '2026-07-11',
    });

    expect(result.orderId).toBe('12');
    expect(result.nextStatus).toBe('Finalizado');
    expect(result.deliveredDate).toBe('2026-07-11');
    expect(result.paymentsToAdd).toHaveLength(1);
    expect(result.transaction.category).toBe('Venda de Serviço');
    expect(result.transaction.relatedServiceOrderId).toBe('12');
    expect(result.transaction.description).toContain('OS #12');
    expect(result.transaction.description).toContain('Forma de pagamento: PIX');
  });

  it('builds a pending finalization without immediate payment record', () => {
    const result = buildServiceOrderFinalization({
      serviceOrder: baseOrder,
      amount: 80,
      paymentMethod: 'Boleto',
      paymentStatus: 'pendente',
      transactionDate: '2026-07-12',
    });

    expect(result.nextStatus).toBe('Aguardando Pagamento');
    expect(result.paymentsToAdd).toEqual([]);
    expect(result.transaction.category).toBe('Contas a Receber');
    expect(result.transaction.status).toBe('pendente');
  });

  it('replaces previous service-order finalization transactions for the same order', () => {
    const currentTransactions = [
      {
        id: 'FIN-1',
        type: 'receita',
        description: 'Servico antigo',
        amount: 100,
        date: '2026-07-10',
        category: 'Venda de Serviço',
        paymentMethod: 'PIX',
        relatedServiceOrderId: '12',
        status: 'pago',
        origin: 'service-order-finalization',
      },
      {
        id: 'FIN-2',
        type: 'receita',
        description: 'Outra venda',
        amount: 50,
        date: '2026-07-10',
        category: 'Venda de Produto',
        paymentMethod: 'Cartão',
        relatedSaleId: 'SALE-1',
        status: 'pago',
        origin: 'sale',
      },
    ] as FinancialTransaction[];

    const nextTransaction = {
      id: 'FIN-3',
      type: 'receita',
      description: 'Servico novo',
      amount: 120,
      date: '2026-07-11',
      category: 'Venda de Serviço',
      paymentMethod: 'PIX',
      relatedServiceOrderId: '12',
      status: 'pago',
      origin: 'service-order-finalization',
    } as FinancialTransaction;

    expect(upsertServiceOrderFinalizationTransaction(currentTransactions, nextTransaction)).toEqual([
      nextTransaction,
      currentTransactions[1],
    ]);
  });
});

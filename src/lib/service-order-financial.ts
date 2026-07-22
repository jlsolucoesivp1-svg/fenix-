import type { FinancialTransaction, OSPayment, ServiceOrder } from '@/types';
import { formatServiceOrderNumber } from './service-order-id';

export type ServiceOrderPaymentStatus = 'pago' | 'pendente';

export type ServiceOrderFinalizationInput = {
  serviceOrder: ServiceOrder;
  amount: number;
  paymentMethod: string;
  paymentStatus: ServiceOrderPaymentStatus;
  observation?: string;
  transactionDate?: string;
};

export type ServiceOrderFinalizationResult = {
  orderId: string;
  nextStatus: ServiceOrder['status'];
  deliveredDate: string;
  paymentsToAdd: OSPayment[];
  transaction: FinancialTransaction;
};

const buildServiceOrderDescription = ({
  serviceOrder,
  amount,
  paymentMethod,
  paymentStatus,
  observation,
}: ServiceOrderFinalizationInput) => {
  const base = [
    `Cliente: ${serviceOrder.customerName}`,
    `OS #${formatServiceOrderNumber(serviceOrder.id)}`,
    `Status: ${paymentStatus === 'pago' ? 'Pago' : 'Pendente'}`,
    `Forma de pagamento: ${paymentMethod}`,
    `Valor: R$ ${amount.toFixed(2)}`,
  ];

  if (observation?.trim()) {
    base.push(`Observação: ${observation.trim()}`);
  }

  return base.join(' | ');
};

export const resolveServiceOrderStatusFromPaymentStatus = (
  paymentStatus: ServiceOrderPaymentStatus
): ServiceOrder['status'] => (paymentStatus === 'pago' ? 'Finalizado' : 'Aguardando Pagamento');

export const resolveServiceOrderStatusFromBalance = (balanceDue: number): ServiceOrder['status'] =>
  balanceDue <= 0 ? 'Finalizado' : 'Aguardando Pagamento';

export const buildServiceOrderFinalization = ({
  serviceOrder,
  amount,
  paymentMethod,
  paymentStatus,
  observation,
  transactionDate = new Date().toISOString().split('T')[0],
}: ServiceOrderFinalizationInput): ServiceOrderFinalizationResult => {
  const nextStatus = resolveServiceOrderStatusFromPaymentStatus(paymentStatus);

  const transaction: FinancialTransaction = {
    id: `FIN-OS-${serviceOrder.id}-${Date.now()}`,
    type: 'receita',
    description: buildServiceOrderDescription({ serviceOrder, amount, paymentMethod, paymentStatus, observation }),
    amount,
    date: transactionDate,
    category: paymentStatus === 'pago' ? 'Venda de Serviço' : 'Contas a Receber',
    paymentMethod,
    relatedServiceOrderId: serviceOrder.id,
    status: paymentStatus,
    origin: 'service-order-finalization',
  };

  const paymentsToAdd: OSPayment[] =
    paymentStatus === 'pago'
      ? [
          {
            id: `PAY-OS-${serviceOrder.id}-${Date.now()}`,
            amount,
            date: transactionDate,
            method: paymentMethod,
          },
        ]
      : [];

  return {
    orderId: serviceOrder.id,
    nextStatus,
    deliveredDate: transactionDate,
    paymentsToAdd,
    transaction,
  };
};

export const upsertServiceOrderFinalizationTransaction = (
  transactions: FinancialTransaction[],
  nextTransaction: FinancialTransaction
) => {
  const filteredTransactions = transactions.filter(
    (transaction) =>
      !(
        transaction.relatedServiceOrderId === nextTransaction.relatedServiceOrderId &&
        transaction.origin === 'service-order-finalization'
      )
  );

  return [nextTransaction, ...filteredTransactions];
};

import { describe, expect, it, vi } from 'vitest';
import {
  applySaleToStock,
  buildSaleFinancialTransactions,
  buildSaleRecord,
  calculateSaleSubtotal,
  sanitizeSaleItems,
} from './sales';
import type { SaleItem, StockItem } from '@/types';

describe('sales', () => {
  it('sanitizes items and removes invalid entries', () => {
    const items = [
      { id: 'PROD-1', name: 'Tela', quantity: '2', price: '10.5' },
      { id: 'PROD-2', name: 'Bateria', quantity: 0, price: 15 },
      { id: 'MAN-1', name: '', quantity: 1, price: 5 },
    ] as unknown as SaleItem[];

    expect(sanitizeSaleItems(items)).toEqual([
      { id: 'PROD-1', name: 'Tela', quantity: 2, price: 10.5 },
      { id: 'MAN-1', name: '', quantity: 1, price: 5 },
    ]);
  });

  it('calculates subtotal and builds sale record', () => {
    const now = new Date('2026-07-11T13:30:00');
    const items = [
      { id: 'PROD-1', name: 'Tela', quantity: 2, price: 50 },
      { id: 'MAN-1', name: 'Servico', quantity: 1, price: 30 },
    ] satisfies SaleItem[];

    expect(calculateSaleSubtotal(items)).toBe(130);

    const sale = buildSaleRecord({
      saleId: 'SALE-1',
      items,
      discount: 10,
      paymentMethod: 'pix',
      observations: 'Teste',
      customerId: 'CUST-1',
      customerName: 'Cliente',
      userName: 'Atendente',
      now,
    });

    expect(sale.subtotal).toBe(130);
    expect(sale.total).toBe(120);
    expect(sale.paymentMethod).toBe('PIX');
    expect(sale.date).toBe('2026-07-11');
    expect(sale.customerName).toBe('Cliente');
  });

  it('applies stock changes only to product items', () => {
    const stock = [
      { id: 'PROD-1', name: 'Tela', quantity: 5 },
      { id: 'PROD-2', name: 'Bateria', quantity: 3 },
    ] as StockItem[];
    const items = [
      { id: 'PROD-1', name: 'Tela', quantity: 2, price: 50 },
      { id: 'MAN-1', name: 'Servico', quantity: 1, price: 30 },
    ] satisfies SaleItem[];

    expect(applySaleToStock(stock, items)).toEqual([
      { id: 'PROD-1', name: 'Tela', quantity: 3 },
      { id: 'PROD-2', name: 'Bateria', quantity: 3 },
    ]);
  });

  it('builds a single paid transaction for non-installment sales', () => {
    const sale = buildSaleRecord({
      saleId: 'SALE-1',
      items: [{ id: 'PROD-1', name: 'Tela', quantity: 1, price: 100 }],
      discount: 0,
      paymentMethod: 'pix',
      customerName: 'Cliente',
      userName: 'Atendente',
      now: new Date('2026-07-11T13:30:00'),
    });

    const transactions = buildSaleFinancialTransactions({
      sale,
      paymentMethod: 'pix',
      now: new Date('2026-07-11T13:30:00'),
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0].status).toBe('pago');
    expect(transactions[0].relatedSaleId).toBe('SALE-1');
  });

  it('builds installment transactions with due dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T13:30:00'));

    const sale = buildSaleRecord({
      saleId: 'SALE-2',
      items: [{ id: 'PROD-1', name: 'Tela', quantity: 1, price: 120 }],
      discount: 0,
      paymentMethod: 'boleto',
      customerName: 'Cliente',
      userName: 'Atendente',
    });

    const transactions = buildSaleFinancialTransactions({
      sale,
      paymentMethod: 'boleto',
      installments: {
        enabled: true,
        count: 3,
        firstDueDate: '2026-08-10',
      },
      now: new Date('2026-07-11T13:30:00'),
    });

    expect(transactions).toHaveLength(3);
    expect(transactions[0].amount).toBe(40);
    expect(transactions[0].status).toBe('pendente');
    expect(transactions[0].dueDate).toBe('2026-08-10');
    expect(transactions[2].dueDate).toBe('2026-10-10');

    vi.useRealTimers();
  });
});

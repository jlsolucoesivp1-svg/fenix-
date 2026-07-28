import { describe, expect, it } from 'vitest';
import { buildA4SaleReceipt } from './a4-sale-receipt';
import type { CompanyInfo, Sale } from '@/types';

const company: CompanyInfo = {
  name: 'Fenix Testes',
  address: 'Rua Exemplo, 123',
  phone: '(11) 99999-9999',
  emailOrSite: 'contato@fenix.test',
  document: '12.345.678/0001-90',
  logoUrl: '',
  pixKey: '',
};

const sale: Sale = {
  id: 'SALE-123456',
  date: '2026-07-28',
  time: '14:30:00',
  user: 'Atendente',
  items: [{ id: 'PROD-1', name: 'Produto de teste', quantity: 2, price: 25 }],
  subtotal: 50,
  discount: 5,
  total: 45,
  paymentMethod: 'PIX',
  observations: 'Retirar no balcão',
};

describe('buildA4SaleReceipt', () => {
  it('renders a complete A4 receipt and automatically invokes the browser print dialog', () => {
    const receipt = buildA4SaleReceipt({ sale, company, customer: null });

    expect(receipt).toContain('@page { size: A4 portrait; margin: 14mm; }');
    expect(receipt).toContain('Fenix Testes');
    expect(receipt).toContain('Consumidor Final');
    expect(receipt).toContain('Produto de teste');
    expect(receipt).toContain('45,00');
    expect(receipt).toContain('window.print()');
    expect(receipt).toContain('afterprint');
  });

  it('keeps the selected customer on the receipt', () => {
    const receipt = buildA4SaleReceipt({
      sale: { ...sale, customerId: 'CUST-1', customerName: 'Cliente cadastrado' },
      company,
      customer: null,
    });

    expect(receipt).toContain('Cliente cadastrado');
    expect(receipt).not.toContain('Consumidor Final');
  });
});

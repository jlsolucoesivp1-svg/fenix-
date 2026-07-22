import { describe, expect, it } from 'vitest';
import {
  findStockItemForServiceOrderItem,
  getAvailableStockForDraftItem,
  syncServiceOrderStock,
} from './service-order-stock';
import type { ServiceOrderItem, StockItem } from '@/types';

const stock = [
  {
    id: 'PROD-1',
    name: 'Placa Mãe',
    description: '',
    category: 'Peças',
    quantity: 5,
    price: 200,
    costPrice: 100,
    minStock: 1,
    barcode: '',
    unitOfMeasure: 'un',
  },
  {
    id: 'PROD-2',
    name: 'SSD 240GB',
    description: '',
    category: 'Peças',
    quantity: 3,
    price: 180,
    costPrice: 90,
    minStock: 1,
    barcode: '',
    unitOfMeasure: 'un',
  },
] as StockItem[];

const makePart = (overrides: Partial<ServiceOrderItem> = {}): ServiceOrderItem => ({
  id: 1,
  description: 'Placa Mae',
  quantity: 1,
  unitPrice: 200,
  type: 'part',
  ...overrides,
});

describe('service-order-stock', () => {
  it('finds stock items by explicit id or normalized description', () => {
    expect(findStockItemForServiceOrderItem(stock, { stockItemId: 'PROD-2', description: '' })?.name).toBe('SSD 240GB');
    expect(findStockItemForServiceOrderItem(stock, { description: 'placa mãe' })?.id).toBe('PROD-1');
  });

  it('computes available stock considering original and draft allocations', () => {
    const originalItems = [makePart({ stockItemId: 'PROD-1', quantity: 2 })];
    const draftItems = [makePart({ stockItemId: 'PROD-1', quantity: 3 })];

    expect(
      getAvailableStockForDraftItem(stock, originalItems, draftItems, {
        stockItemId: 'PROD-1',
        description: 'Placa Mae',
      })
    ).toBe(4);
  });

  it('updates stock quantities when parts change in a service order', () => {
    const result = syncServiceOrderStock({
      currentStock: stock,
      previousItems: [makePart({ stockItemId: 'PROD-1', quantity: 1 })],
      nextItems: [makePart({ stockItemId: 'PROD-1', quantity: 3 })],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.updatedStock.find((item) => item.id === 'PROD-1')?.quantity).toBe(3);
    }
  });

  it('blocks stock synchronization when the requested quantity exceeds availability', () => {
    const result = syncServiceOrderStock({
      currentStock: stock,
      previousItems: [],
      nextItems: [makePart({ stockItemId: 'PROD-2', description: 'SSD 240GB', quantity: 10, unitPrice: 180 })],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Estoque insuficiente');
    }
  });
});

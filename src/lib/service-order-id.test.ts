import { describe, expect, it } from 'vitest';
import {
  formatServiceOrderNumber,
  getNextSequentialServiceOrderId,
  isSequentialServiceOrderId,
} from './service-order-id';
import type { ServiceOrder } from '@/types';

describe('service-order-id', () => {
  it('recognizes numeric sequential ids', () => {
    expect(isSequentialServiceOrderId('123')).toBe(true);
    expect(isSequentialServiceOrderId(' 456 ')).toBe(true);
    expect(isSequentialServiceOrderId('OS-123')).toBe(false);
  });

  it('formats sequential ids without truncating them', () => {
    expect(formatServiceOrderNumber('123')).toBe('123');
  });

  it('formats non-sequential ids using the last 4 characters', () => {
    expect(formatServiceOrderNumber('SALE-123456')).toBe('3456');
    expect(formatServiceOrderNumber(undefined)).toBe('----');
  });

  it('generates the next sequential id from mixed order ids', () => {
    const orders = [
      { id: '9' },
      { id: '15' },
      { id: 'OS-legacy' },
      { id: ' 21 ' },
    ] as ServiceOrder[];

    expect(getNextSequentialServiceOrderId(orders)).toBe('22');
  });
});

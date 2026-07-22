import type { ServiceOrder } from '@/types';

const NUMERIC_SERVICE_ORDER_ID_PATTERN = /^\d+$/;

export const isSequentialServiceOrderId = (value?: string | null) =>
  typeof value === 'string' && NUMERIC_SERVICE_ORDER_ID_PATTERN.test(value.trim());

export const formatServiceOrderNumber = (value?: string | null) => {
  if (!value) {
    return '----';
  }

  const trimmedValue = value.trim();
  if (isSequentialServiceOrderId(trimmedValue)) {
    return trimmedValue;
  }

  return trimmedValue.slice(-4);
};

export const getNextSequentialServiceOrderId = (orders: ServiceOrder[]) => {
  const highestNumericId = orders.reduce((highest, order) => {
    const currentId = order.id?.trim();
    if (!isSequentialServiceOrderId(currentId)) {
      return highest;
    }

    return Math.max(highest, Number(currentId));
  }, 0);

  return String(highestNumericId + 1);
};

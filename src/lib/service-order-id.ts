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

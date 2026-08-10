export const SERVICE_ORDER_PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'Boleto',
  'Cartão de Crédito',
  'Cartão de Débito',
] as const;

export const FINANCIAL_PAYMENT_METHODS = [
  ...SERVICE_ORDER_PAYMENT_METHODS,
  'Transferência',
] as const;

export const POS_PAYMENT_METHOD_OPTIONS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'parcelado', label: 'Parcelado' },
] as const;

export const getPosPaymentMethodLabel = (value: string) =>
  POS_PAYMENT_METHOD_OPTIONS.find((option) => option.value === value)?.label || value;

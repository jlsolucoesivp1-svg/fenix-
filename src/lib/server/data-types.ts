export const COLLECTION_DATA_TYPES = [
  'users',
  'customers',
  'serviceOrders',
  'stock',
  'sales',
  'financialTransactions',
  'appointments',
  'quotes',
  'kits',
  'serviceOrderViews',
] as const;

export const SINGLETON_DATA_TYPES = [
  'companyInfo',
  'settings',
  'systemActivation',
] as const;

export type CollectionDataType = (typeof COLLECTION_DATA_TYPES)[number];
export type SingletonDataType = (typeof SINGLETON_DATA_TYPES)[number];
export type DataType = CollectionDataType | SingletonDataType;

export const isCollectionDataType = (value: string): value is CollectionDataType =>
  COLLECTION_DATA_TYPES.includes(value as CollectionDataType);

export const isSingletonDataType = (value: string): value is SingletonDataType =>
  SINGLETON_DATA_TYPES.includes(value as SingletonDataType);

export const getRecordId = (dataType: CollectionDataType, record: Record<string, unknown>): string => {
  if (dataType === 'serviceOrderViews') {
    const serviceOrderId = record.serviceOrderId;
    if (typeof serviceOrderId !== 'string' || serviceOrderId.length === 0) {
      throw new Error('Registro de visualizacao de OS sem serviceOrderId.');
    }
    return serviceOrderId;
  }

  const id = record.id;
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(`Registro em ${dataType} sem id valido.`);
  }
  return id;
};

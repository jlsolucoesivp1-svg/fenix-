import type { ServiceOrderItem, StockItem } from '@/types';

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const getServiceOrderPartKey = (
  item: Pick<ServiceOrderItem, 'stockItemId' | 'description'>
) => item.stockItemId || normalizeText(item.description);

export const findStockItemForServiceOrderItem = (
  stock: StockItem[],
  item: Pick<ServiceOrderItem, 'stockItemId' | 'description'>
) => {
  if (item.stockItemId) {
    const byId = stock.find((stockItem) => stockItem.id === item.stockItemId);

    if (byId) {
      return byId;
    }
  }

  const normalizedDescription = normalizeText(item.description);

  return stock.find(
    (stockItem) => normalizeText(stockItem.name) === normalizedDescription
  );
};

const sumPartsByKey = (items: ServiceOrderItem[] = []) => {
  const totals = new Map<string, number>();

  items
    .filter((item) => item.type === 'part')
    .forEach((item) => {
      const key = getServiceOrderPartKey(item);
      totals.set(key, (totals.get(key) || 0) + (item.quantity || 0));
    });

  return totals;
};

const canonicalizeItems = (stock: StockItem[], items: ServiceOrderItem[] = []) =>
  items.map((item) => {
    if (item.type !== 'part') {
      return item;
    }

    const stockItem = findStockItemForServiceOrderItem(stock, item);

    if (!stockItem) {
      return item;
    }

    return {
      ...item,
      stockItemId: stockItem.id,
      description: stockItem.name,
    };
  });

export const getAvailableStockForDraftItem = (
  stock: StockItem[],
  originalItems: ServiceOrderItem[] = [],
  draftItems: ServiceOrderItem[] = [],
  item: Pick<ServiceOrderItem, 'stockItemId' | 'description'>
) => {
  const stockItem = findStockItemForServiceOrderItem(stock, item);

  if (!stockItem) {
    return null;
  }

  const key = stockItem.id;
  const originalTotals = sumPartsByKey(canonicalizeItems(stock, originalItems));
  const draftTotals = sumPartsByKey(canonicalizeItems(stock, draftItems));

  return (
    stockItem.quantity +
    (originalTotals.get(key) || 0) -
    (draftTotals.get(key) || 0)
  );
};

export const syncServiceOrderStock = ({
  currentStock,
  previousItems = [],
  nextItems = [],
}: {
  currentStock: StockItem[];
  previousItems?: ServiceOrderItem[];
  nextItems?: ServiceOrderItem[];
}) => {
  const updatedStock = [...currentStock];

  const canonicalPreviousItems = canonicalizeItems(
    updatedStock,
    previousItems
  );

  const canonicalNextItems = canonicalizeItems(
    updatedStock,
    nextItems
  );

  const previousTotals = sumPartsByKey(canonicalPreviousItems);
  const nextTotals = sumPartsByKey(canonicalNextItems);

  const allKeys = new Set([
    ...previousTotals.keys(),
    ...nextTotals.keys(),
  ]);

  for (const key of allKeys) {
    const previousQuantity = previousTotals.get(key) || 0;
    const nextQuantity = nextTotals.get(key) || 0;
    const difference = nextQuantity - previousQuantity;

    if (difference === 0) {
      continue;
    }

    const referenceItem =
      canonicalNextItems.find(
        (item) =>
          item.type === 'part' &&
          getServiceOrderPartKey(item) === key
      ) ||
      canonicalPreviousItems.find(
        (item) =>
          item.type === 'part' &&
          getServiceOrderPartKey(item) === key
      );

    if (!referenceItem) {
      continue;
    }

    const stockItemIndex = updatedStock.findIndex((stockItem) => {
      if (referenceItem.stockItemId) {
        return stockItem.id === referenceItem.stockItemId;
      }

      return (
        normalizeText(stockItem.name) ===
        normalizeText(referenceItem.description)
      );
    });

    if (stockItemIndex === -1) {
      return {
        ok: false as const,
        error: `A peça "${referenceItem.description}" não foi encontrada no estoque.`,
      };
    }

    const stockItem = updatedStock[stockItemIndex];

    if (difference > 0 && stockItem.quantity < difference) {
      return {
        ok: false as const,
        error: `Estoque insuficiente para a peça "${stockItem.name}". Disponível: ${stockItem.quantity}.`,
      };
    }

    updatedStock[stockItemIndex] = {
      ...stockItem,
      quantity: stockItem.quantity - difference,
    };
  }

  return {
    ok: true as const,
    updatedStock,
  };
};

'use client';

import * as React from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { StockItem } from '@/types';
import { cn } from '@/lib/utils';

type ProductAutocompleteProps = {
  onSelect: (product: StockItem) => void;
  searchFunction: (query: string, limit: number) => Promise<StockItem[]>;
};

export function ProductAutocomplete({ onSelect, searchFunction }: ProductAutocompleteProps) {
  const [query, setQuery] = React.useState('');
  const [products, setProducts] = React.useState<StockItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const sequence = React.useRef(0);

  React.useEffect(() => {
    const term = query.trim();
    if (!term) {
      sequence.current += 1;
      setProducts([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const current = ++sequence.current;
      setLoading(true);
      try {
        const result = await searchFunction(term, 10);
        if (current === sequence.current) setProducts(result);
      } finally {
        if (current === sequence.current) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, searchFunction]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto..." className="pl-9" autoComplete="off" />
      {loading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
      {query.trim() ? (
        <div className="mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover py-1">
          {products.length === 0 && !loading ? <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum produto encontrado.</p> : null}
          {products.map((product) => (
            <button key={product.id} type="button" onClick={() => onSelect(product)} className={cn('block w-full px-3 py-2 text-left text-sm hover:bg-muted')}>
              <span className="block font-medium">{product.name}</span>
              <span className="block text-xs text-muted-foreground">{product.category || 'Sem categoria'}{product.barcode ? ` · ${product.barcode}` : ''}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

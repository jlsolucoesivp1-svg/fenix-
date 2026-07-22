'use client';

import * as React from 'react';
import { Loader2, Phone, Search, UserRound, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchCustomers } from '@/lib/storage';
import { cn } from '@/lib/utils';
import type { CustomerSearchResult } from '@/types';

type CustomerAutocompleteProps = {
  selectedCustomer: CustomerSearchResult | null;
  onSelect: (customer: CustomerSearchResult | null) => void;
  searchFunction?: (name: string, limit: number) => Promise<CustomerSearchResult[]>;
  placeholder?: string;
  emptyMessage?: string;
  limit?: number;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
};

const DEBOUNCE_MS = 300;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightText = (value: string, query: string) => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return value;
  }

  const matcher = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig');
  const parts = value.split(matcher);

  return parts.map((part, index) => {
    if (part.toLowerCase() === trimmedQuery.toLowerCase()) {
      return (
        <mark key={`${part}-${index}`} className="rounded bg-primary/15 px-0.5 text-foreground">
          {part}
        </mark>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

export function CustomerAutocomplete({
  selectedCustomer,
  onSelect,
  searchFunction = searchCustomers,
  placeholder = 'Buscar cliente por nome...',
  emptyMessage = 'Nenhum cliente encontrado.',
  limit = 10,
  disabled = false,
  className,
  inputClassName,
  id,
}: CustomerAutocompleteProps) {
  const [query, setQuery] = React.useState(selectedCustomer?.name ?? '');
  const [results, setResults] = React.useState<CustomerSearchResult[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const cacheRef = React.useRef(new Map<string, CustomerSearchResult[]>());

  React.useEffect(() => {
    setQuery(selectedCustomer?.name ?? '');
  }, [selectedCustomer?.id, selectedCustomer?.name]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  React.useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setIsLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    const timer = window.setTimeout(async () => {
      const cacheKey = `${trimmedQuery.toLowerCase()}::${limit}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setResults(cached);
        setHighlightedIndex(cached.length > 0 ? 0 : -1);
        return;
      }

      setIsLoading(true);
      try {
        const nextResults = await searchFunction(trimmedQuery, limit);
        cacheRef.current.set(cacheKey, nextResults);
        setResults(nextResults);
        setHighlightedIndex(nextResults.length > 0 ? 0 : -1);
      } catch (error) {
        console.error('Erro ao pesquisar clientes:', error);
        setResults([]);
        setHighlightedIndex(-1);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [limit, query, searchFunction]);

  const handleSelect = React.useCallback(
    (customer: CustomerSearchResult) => {
      onSelect(customer);
      setQuery(customer.name);
      setResults([]);
      setHighlightedIndex(-1);
      setIsOpen(false);
    },
    [onSelect]
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setIsOpen(true);

    if (selectedCustomer && nextQuery !== selectedCustomer.name) {
      onSelect(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => {
        if (results.length === 0) {
          return -1;
        }
        return current < results.length - 1 ? current + 1 : 0;
      });
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => {
        if (results.length === 0) {
          return -1;
        }
        return current > 0 ? current - 1 : results.length - 1;
      });
    }

    if (event.key === 'Enter' && isOpen && highlightedIndex >= 0 && results[highlightedIndex]) {
      event.preventDefault();
      handleSelect(results[highlightedIndex]);
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        className={cn('pl-9 pr-10', inputClassName)}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setResults([]);
            setHighlightedIndex(-1);
            onSelect(null);
          }}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      {showDropdown ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando clientes...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((customer, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(customer)}
                      className={cn(
                        'flex w-full items-start gap-3 px-3 py-2 text-left transition',
                        isHighlighted ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60'
                      )}
                    >
                      <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {highlightText(customer.name, query)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone || 'Telefone nao informado'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

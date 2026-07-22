'use client';

import * as React from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type LocalAutocompleteOption<T> = {
  item: T;
  value: string;
  keywords?: string[];
};

type LocalAutocompleteProps<T> = {
  items: T[];
  selectedItem: T | null;
  onSelect: (item: T | null) => void;
  getOption: (item: T) => LocalAutocompleteOption<T>;
  renderItem?: (item: T, query: string) => React.ReactNode;
  placeholder?: string;
  emptyMessage?: string;
  debounceMs?: number;
  limit?: number;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const highlightMatch = (value: string, query: string) => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return value;
  }

  const matcher = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig');
  const parts = value.split(matcher);

  return parts.map((part, index) =>
    part.toLowerCase() === trimmedQuery.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-primary/15 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  );
};

export function LocalAutocomplete<T>({
  items,
  selectedItem,
  onSelect,
  getOption,
  renderItem,
  placeholder = 'Buscar...',
  emptyMessage = 'Nenhum resultado encontrado.',
  debounceMs = 300,
  limit = 10,
  disabled = false,
  className,
  inputClassName,
}: LocalAutocompleteProps<T>) {
  const [query, setQuery] = React.useState(selectedItem ? getOption(selectedItem).value : '');
  const [results, setResults] = React.useState<T[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setQuery(selectedItem ? getOption(selectedItem).value : '');
  }, [getOption, selectedItem]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  React.useEffect(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      setResults([]);
      setHighlightedIndex(-1);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = window.setTimeout(() => {
      const nextResults = items
        .map((item) => {
          const option = getOption(item);
          const haystacks = [option.value, ...(option.keywords || [])].map((entry) => entry.toLowerCase());
          const startIndex = haystacks[0].indexOf(trimmedQuery);
          const matchedIndex = haystacks.findIndex((entry) => entry.includes(trimmedQuery));

          if (matchedIndex === -1) {
            return null;
          }

          return {
            item,
            startsWith: haystacks[0].startsWith(trimmedQuery) ? 0 : 1,
            position: startIndex === -1 ? Number.MAX_SAFE_INTEGER : startIndex,
            length: option.value.length,
            label: option.value.toLowerCase(),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((a, b) => {
          if (a.startsWith !== b.startsWith) return a.startsWith - b.startsWith;
          if (a.position !== b.position) return a.position - b.position;
          if (a.length !== b.length) return a.length - b.length;
          return a.label.localeCompare(b.label);
        })
        .slice(0, limit)
        .map((entry) => entry.item);

      setResults(nextResults);
      setHighlightedIndex(nextResults.length > 0 ? 0 : -1);
      setIsLoading(false);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, getOption, items, limit, query]);

  const handleSelect = React.useCallback(
    (item: T) => {
      onSelect(item);
      setQuery(getOption(item).value);
      setResults([]);
      setHighlightedIndex(-1);
      setIsOpen(false);
    },
    [getOption, onSelect]
  );

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setIsOpen(true);

          if (selectedItem && nextQuery !== getOption(selectedItem).value) {
            onSelect(null);
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((current) => (results.length === 0 ? -1 : current < results.length - 1 ? current + 1 : 0));
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((current) => (results.length === 0 ? -1 : current > 0 ? current - 1 : results.length - 1));
          }

          if (event.key === 'Enter' && isOpen && highlightedIndex >= 0 && results[highlightedIndex]) {
            event.preventDefault();
            handleSelect(results[highlightedIndex]);
          }

          if (event.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
        }}
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
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((item, index) => {
                const option = getOption(item);
                const isSelected = selectedItem ? getOption(selectedItem).value === option.value : false;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left transition',
                        isHighlighted ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60'
                      )}
                    >
                      <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {renderItem ? renderItem(item, query) : highlightMatch(option.value, query)}
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

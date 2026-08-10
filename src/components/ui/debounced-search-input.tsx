'use client';

import * as React from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DebouncedSearchInputProps = {
  defaultValue?: string;
  onDebouncedChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  inputClassName?: string;
};

export function DebouncedSearchInput({
  defaultValue = '',
  onDebouncedChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
  className,
  inputClassName,
}: DebouncedSearchInputProps) {
  const [value, setValue] = React.useState(defaultValue);
  const [isWaiting, setIsWaiting] = React.useState(false);

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  React.useEffect(() => {
    setIsWaiting(true);

    const timer = window.setTimeout(() => {
      onDebouncedChange(value);
      setIsWaiting(false);
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [debounceMs, onDebouncedChange, value]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={cn('pl-9 pr-10', inputClassName)}
      />

      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue('');
            setIsWaiting(false);
            onDebouncedChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          aria-label="Limpar busca"
        >
          {isWaiting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      ) : isWaiting ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

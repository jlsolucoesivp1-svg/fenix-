'use client';

import * as React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ModuleStateTone = 'default' | 'warning' | 'destructive';

const toneClasses: Record<ModuleStateTone, string> = {
  default: 'border-border bg-card text-card-foreground',
  warning: 'border-amber-500/30 bg-amber-500/5 text-amber-900',
  destructive: 'border-destructive/30 bg-destructive/5 text-destructive',
};

interface ModuleStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  tone?: ModuleStateTone;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

export function ModuleState({
  title,
  description,
  icon,
  tone = 'default',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}: ModuleStateProps) {
  const Icon = icon ?? (tone === 'destructive' ? AlertCircle : Inbox);

  return (
    <div
      className={cn(
        'rounded-2xl border text-center shadow-sm',
        compact ? 'p-5' : 'p-8',
        toneClasses[tone]
      )}
    >
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3">
        <div className="rounded-full border border-current/10 bg-background/60 p-3">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actionLabel && onAction ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={onAction}>{actionLabel}</Button>
            {secondaryActionLabel && onSecondaryAction ? (
              <Button variant="outline" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ModuleLoadingState({
  title = 'Carregando dados',
  description = 'Aguarde enquanto o modulo sincroniza as informacoes.',
}: {
  title?: string;
  description?: string;
}) {
  return <ModuleState title={title} description={description} icon={Loader2} />;
}

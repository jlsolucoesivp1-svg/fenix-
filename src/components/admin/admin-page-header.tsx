import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</div> : null}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

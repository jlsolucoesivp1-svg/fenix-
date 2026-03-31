
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CalendarView = dynamic(
  () => import('@/components/agenda/calendar-view'),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }
);

export default function AgendaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda Técnica</CardTitle>
        <CardDescription>
          Gerencie seus compromissos e chamados externos. Clique em uma data para adicionar um evento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarView />
      </CardContent>
    </Card>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Archive, Calendar, CheckCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCustomers, getServiceOrders } from '@/lib/storage';

type DashboardStats = {
  activeOrders: number;
  completedOrders: number;
  totalCustomers: number;
  lowStockItems: number;
};

type StatsCardsProps = {
  stats?: DashboardStats;
  isLoading?: boolean;
};

export function StatsCards({ stats: externalStats, isLoading = false }: StatsCardsProps) {
  const [stats, setStats] = React.useState<DashboardStats>({
    activeOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    lowStockItems: 0,
  });

  React.useEffect(() => {
    if (externalStats) {
      setStats(externalStats);
      return;
    }

    const fetchStats = async () => {
      const [serviceOrders, customers] = await Promise.all([getServiceOrders(), getCustomers()]);

      setStats({
        activeOrders: serviceOrders.filter(
          (order) => !['Finalizado', 'Entregue', 'Cancelada'].includes(order.status)
        ).length,
        completedOrders: serviceOrders.filter((order) =>
          ['Finalizado', 'Entregue'].includes(order.status)
        ).length,
        totalCustomers: customers.length,
        lowStockItems: 0,
      });
    };

    void fetchStats();
  }, [externalStats]);

  const renderValue = (value: number) => (isLoading ? '--' : value);

  return (
    <>
      <Link href="/agenda" className="cursor-pointer">
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agenda</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoje</div>
            <p className="text-xs text-muted-foreground">Gerenciar seus compromissos</p>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{renderValue(stats.totalCustomers)}</div>
          <p className="text-xs text-muted-foreground">Total de clientes cadastrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OS Ativas</CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{renderValue(stats.activeOrders)}</div>
          <p className="text-xs text-muted-foreground">Servicos em andamento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OS Concluidas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{renderValue(stats.completedOrders)}</div>
          <p className="text-xs text-muted-foreground">Servicos finalizados no total</p>
        </CardContent>
      </Card>
    </>
  );
}

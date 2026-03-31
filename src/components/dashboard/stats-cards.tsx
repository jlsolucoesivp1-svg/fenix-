
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, CheckCircle, Archive } from 'lucide-react';
import { getCustomers, getServiceOrders } from '@/lib/storage';

export function StatsCards() {
  const [stats, setStats] = React.useState({
    activeOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    lowStockItems: 0,
  });
  
  React.useEffect(() => {
    const fetchStats = async () => {
      const [serviceOrders, customers] = await Promise.all([
        getServiceOrders(),
        getCustomers(),
      ]);

      const activeOrders = serviceOrders.filter(
        (order) => !['Finalizado', 'Entregue', 'Cancelada'].includes(order.status)
      ).length;

      const completedOrders = serviceOrders.filter(
        (order) => ['Finalizado', 'Entregue'].includes(order.status)
      ).length;
      
      const totalCustomers = customers.length;
      
      setStats({
        activeOrders,
        completedOrders,
        totalCustomers,
        lowStockItems: 0, // Estoque removido
      });
    };

    fetchStats();
  }, []);

  return (
    <>
      <Link href="/agenda" className="cursor-pointer">
        <Card className="hover:bg-muted/50 transition-colors">
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
          <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          <p className="text-xs text-muted-foreground">Total de clientes cadastrados</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OS Ativas</CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeOrders}</div>
          <p className="text-xs text-muted-foreground">Serviços em andamento</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">OS Concluídas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedOrders}</div>
          <p className="text-xs text-muted-foreground">Serviços finalizados no total</p>
        </CardContent>
      </Card>
    </>
  );
}

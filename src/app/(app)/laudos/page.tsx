'use client';

import * as React from 'react';
import { HardDrive, Printer, Save, User as UserIcon } from 'lucide-react';
import type { Customer, ServiceOrder, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ModuleLoadingState, ModuleState } from '@/components/ui/module-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { generateLaudoPdf } from '@/lib/pdf-generators/laudo-pdf-generator';
import { formatServiceOrderNumber } from '@/lib/service-order-id';
import {
  getCustomers,
  getServiceOrders,
  listTenantCustomers,
  listTenantServiceOrders,
  salvarOrdemServicoComEstoque,
  saveServiceOrders,
} from '@/lib/storage';

export default function LaudosPage() {
  const { toast } = useToast();
  const session = useCurrentAppSession();
  const { user: currentUser } = useCurrentUser();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [serviceOrders, setServiceOrders] = React.useState<ServiceOrder[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [laudoText, setLaudoText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const useSaasLaudos =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;

  React.useEffect(() => {
    if (session.isLoading) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const [customersData, ordersData] = await Promise.all(
          useSaasLaudos
            ? [listTenantCustomers(), listTenantServiceOrders()]
            : [getCustomers(), getServiceOrders()]
        );

        if (cancelled) {
          return;
        }

        setCustomers(customersData);
        setServiceOrders(ordersData);
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'Nao foi possivel carregar clientes e OS.';
          setLoadError(message);
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar laudos',
            description: message,
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [session.isLoading, toast, useSaasLaudos]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedOrderId(null);
    setLaudoText('');
  };

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = serviceOrders.find((entry) => entry.id === orderId);
    setLaudoText(order?.technicalReport || '');
  };

  const filteredOrders = React.useMemo(() => {
    if (!selectedCustomerId) return [];
    const customer = customers.find((entry) => entry.id === selectedCustomerId);
    if (!customer) return [];

    return serviceOrders.filter((order) =>
      order.customerId ? order.customerId === customer.id : order.customerName === customer.name
    );
  }, [selectedCustomerId, customers, serviceOrders]);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const selectedOrder = serviceOrders.find((order) => order.id === selectedOrderId);

  if (session.isLoading || isLoading) {
    return (
      <ModuleLoadingState
        title="Carregando laudos"
        description="Sincronizando clientes e ordens de servico para emissao tecnica."
      />
    );
  }

  if (loadError) {
    return (
      <ModuleState
        title="Nao foi possivel carregar laudos"
        description={loadError}
        tone="destructive"
      />
    );
  }

  const handleSaveLaudo = async () => {
    if (!selectedOrder || !laudoText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Selecione uma OS e preencha o laudo para salvar.',
      });
      return;
    }

    try {
      setIsSaving(true);
      const updatedOrder: ServiceOrder = {
        ...selectedOrder,
        technicalReport: laudoText.trim(),
      };

      if (useSaasLaudos) {
        const result = await salvarOrdemServicoComEstoque({ serviceOrder: updatedOrder });
        setServiceOrders((current) =>
          current.map((order) => (order.id === result.order.id ? result.order : order))
        );
      } else {
        const updatedOrders = serviceOrders.map((order) =>
          order.id === selectedOrder.id ? updatedOrder : order
        );
        await saveServiceOrders(updatedOrders);
        setServiceOrders(updatedOrders);
      }

      toast({
        title: 'Laudo salvo!',
        description: 'O laudo tecnico foi salvo na Ordem de Servico.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar laudo',
        description: error instanceof Error ? error.message : 'Nao foi possivel salvar o laudo.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generatePdf = async () => {
    const printableUser =
      currentUser ||
      ({
        id: session.supabaseUser?.id || 'saas-user',
        name:
          session.supabaseUser?.loginName ||
          session.supabaseUser?.email ||
          'Tecnico Responsavel',
        login: session.supabaseUser?.loginName || session.supabaseUser?.email || 'saas-user',
        email: session.supabaseUser?.email || undefined,
        permissions: {
          accessDashboard: true,
          accessClients: true,
          accessServiceOrders: true,
          accessInventory: true,
          accessSales: true,
          accessFinancials: true,
          accessSettings: true,
          accessDangerZone: false,
          accessAgenda: true,
          accessQuotes: true,
          accessLaudos: true,
          canEdit: true,
          canDelete: true,
          canViewPasswords: false,
          canManageUsers: false,
        },
      } satisfies User);

    if (!selectedCustomer || !selectedOrder) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Selecione um cliente e uma OS para gerar o PDF.',
      });
      return;
    }

    await generateLaudoPdf(
      {
        ...selectedOrder,
        technicalReport: laudoText.trim(),
      },
      selectedCustomer,
      printableUser
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerador de Laudos Tecnicos</CardTitle>
        <CardDescription>
          Selecione o cliente e a ordem de servico para gerar ou editar um laudo tecnico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer-select">1. Selecione o Cliente</Label>
            <Select onValueChange={handleCustomerChange} value={selectedCustomerId || ''}>
              <SelectTrigger id="customer-select" disabled={isLoading}>
                <SelectValue placeholder={isLoading ? 'Carregando...' : 'Selecione...'} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-select">2. Selecione a Ordem de Servico</Label>
            <Select
              onValueChange={handleOrderChange}
              value={selectedOrderId || ''}
              disabled={!selectedCustomerId || filteredOrders.length === 0}
            >
              <SelectTrigger id="order-select">
                <SelectValue
                  placeholder={
                    !selectedCustomerId
                      ? 'Aguardando cliente...'
                      : filteredOrders.length === 0
                        ? 'Nenhuma OS encontrada'
                        : 'Selecione a OS...'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    OS #{formatServiceOrderNumber(order.id)} -{' '}
                    {typeof order.equipment === 'string' ? order.equipment : order.equipment.type} -{' '}
                    {new Date(order.date).toLocaleDateString('pt-BR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {customers.length === 0 ? (
          <ModuleState
            title="Nenhum cliente disponivel"
            description="Cadastre clientes antes de emitir laudos tecnicos neste contexto."
            compact
          />
        ) : null}

        {selectedCustomerId && filteredOrders.length === 0 ? (
          <ModuleState
            title="Nenhuma OS para este cliente"
            description="O cliente selecionado ainda nao possui ordens de servico vinculadas."
            compact
          />
        ) : null}

        {selectedCustomer && selectedOrder ? (
          <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <UserIcon className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCustomer.document || 'Documento nao informado'}
                </p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <HardDrive className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">
                  {typeof selectedOrder.equipment === 'string'
                    ? selectedOrder.equipment
                    : `${selectedOrder.equipment.type} ${selectedOrder.equipment.brand}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  OS #{formatServiceOrderNumber(selectedOrder.id)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Entrada: {new Date(selectedOrder.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="laudo-text">3. Conteudo do Laudo Tecnico</Label>
          <Textarea
            id="laudo-text"
            rows={15}
            placeholder="Digite aqui a analise tecnica, os procedimentos realizados, as pecas trocadas e a conclusao do laudo..."
            value={laudoText}
            onChange={(event) => setLaudoText(event.target.value)}
            disabled={!selectedOrderId}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => void handleSaveLaudo()}
            disabled={!laudoText.trim() || isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Laudo na OS'}
          </Button>
          <Button onClick={() => void generatePdf()} disabled={!laudoText.trim()}>
            <Printer className="mr-2 h-4 w-4" />
            Gerar e Visualizar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

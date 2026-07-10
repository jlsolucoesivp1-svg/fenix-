'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MoreHorizontal,
  Undo2,
  MessageSquare,
  Printer,
  MessageCircle,
  Trash2,
  FileSignature,
  Pencil,
  GitBranchPlus,
  ReceiptText,
  ClipboardList,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  atualizarStatusOrdemServico,
  excluirOrdemServico,
  finalizarOrdemServico,
  getCustomers,
  getServiceOrderViewMetadata,
  getServiceOrders,
  getStock,
  getFinancialTransactions,
  markServiceOrderAsViewed,
  salvarOrdemServicoComEstoque,
  saveFinancialTransactions,
  saveServiceOrders,
  saveStock,
} from '@/lib/storage';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { Customer, FinancialTransaction, InternalNote, OSPayment, ServiceOrder } from '@/types';
import { NewOrderSheet } from '@/components/service-orders/new-order-sheet';
import { AddPaymentDialog } from '@/components/service-orders/add-payment-dialog';
import { ViewCommentsDialog } from '@/components/service-orders/view-comments-dialog';
import { cn } from '@/lib/utils';
import { syncServiceOrderStock } from '@/lib/service-order-stock';
import { upsertServiceOrderFinalizationTransaction } from '@/lib/service-order-financial';
import { formatServiceOrderNumber } from '@/lib/service-order-id';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { generateOsPdf, type OsPdfDocumentType } from '@/lib/pdf-generators/os-pdf-generator';
import { DebouncedSearchInput } from '@/components/ui/debounced-search-input';

const formatDate = (dateString: string | undefined) => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return 'Data inválida';
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const allStatuses: ServiceOrder['status'][] = [
  'Aberta',
  'Em an\u00e1lise',
  'Aguardando pe\u00e7a',
  'Aprovado',
  'Em conserto',
  'Aguardando Pagamento',
  'Finalizado',
  'Entregue',
  'Cancelada',
];

const printActions: Array<{
  documentType: OsPdfDocumentType;
  label: string;
  icon: typeof ClipboardList;
}> = [
  { documentType: 'service-order', label: 'Imprimir Ordem de Serviço', icon: ClipboardList },
  { documentType: 'quote', label: 'Imprimir Orcamento', icon: FileSignature },
  { documentType: 'delivery-receipt', label: 'Imprimir Recibo de Entrega', icon: ReceiptText },
  { documentType: 'invoice', label: 'Imprimir Fatura', icon: ReceiptText },
];

const compareOrdersForList = (a: ServiceOrder, b: ServiceOrder) => {
  if (a.status === 'Aberta' && b.status !== 'Aberta') {
    return -1;
  }

  if (a.status !== 'Aberta' && b.status === 'Aberta') {
    return 1;
  }

  return new Date(b.date).getTime() - new Date(a.date).getTime();
};

function ServiceOrdersComponent() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();

  const [orders, setOrders] = React.useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [editingOrder, setEditingOrder] = React.useState<ServiceOrder | null>(null);
  const [commentsOrder, setCommentsOrder] = React.useState<ServiceOrder | null>(null);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = React.useState(false);
  const [customerForNewOS, setCustomerForNewOS] = React.useState<Customer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [finalizingOrder, setFinalizingOrder] = React.useState<ServiceOrder | null>(null);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('ativas');
  const [searchFilter, setSearchFilter] = React.useState('');
  const [unreadCounts, setUnreadCounts] = React.useState<Record<string, number>>({});

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Aberta':
        return 'border-transparent bg-blue-500/20 text-blue-400';
      case 'Aguardando Pagamento':
        return 'border-transparent bg-red-500/20 text-red-400';
      case 'Aguardando peça':
        return 'border-transparent bg-yellow-500/20 text-yellow-400';
      case 'Em análise':
        return 'border-transparent bg-cyan-500/20 text-cyan-400';
      case 'Aprovado':
        return 'border-transparent bg-green-500/20 text-green-400';
      case 'Em conserto':
        return 'border-transparent bg-indigo-500/20 text-indigo-400';
      case 'Finalizado':
        return 'border-transparent bg-gray-500/20 text-gray-400';
      case 'Entregue':
        return 'border-transparent bg-purple-500/20 text-purple-400';
      case 'Aguardando':
        return 'border-transparent bg-orange-500/20 text-orange-400';
      default:
        return 'border-transparent bg-gray-700/50 text-gray-300';
    }
  };

  const calculateUnreadCounts = React.useCallback(async (ordersToCheck: ServiceOrder[]) => {
    if (typeof window === 'undefined') {
      return;
    }

    const counts: Record<string, number> = {};
    const viewMetadata = await getServiceOrderViewMetadata();
    const viewMap = new Map(viewMetadata.map((entry) => [entry.serviceOrderId, entry.lastViewedAt]));

    for (const order of ordersToCheck) {
      const notes = Array.isArray(order.internalNotes) ? order.internalNotes : [];
      if (notes.length === 0) {
        continue;
      }

      const lastViewedTimestamp = viewMap.get(order.id);
      const lastViewedDate = lastViewedTimestamp ? new Date(lastViewedTimestamp) : new Date(0);
      const unread = notes.filter((note) => new Date(note.date) > lastViewedDate).length;

      if (unread > 0) {
        counts[order.id] = unread;
      }
    }

    setUnreadCounts(counts);
  }, []);

  const handleNewOrderClick = React.useCallback((customer?: Customer | null) => {
    setCustomerForNewOS(customer ?? null);
    setEditingOrder(null);
    setIsSheetOpen(true);
  }, []);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const [loadedOrders, loadedCustomers] = await Promise.all([getServiceOrders(), getCustomers()]);
      const sortedOrders = loadedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setOrders(sortedOrders);
      setCustomers(loadedCustomers);
      await calculateUnreadCounts(sortedOrders);

      if (customerId && loadedCustomers.length > 0) {
        const customer = loadedCustomers.find((entry) => entry.id === customerId);
        if (customer) {
          handleNewOrderClick(customer);
        }
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível buscar os dados. Verifique o console para mais detalhes.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [calculateUnreadCounts, customerId, handleNewOrderClick, toast]);

  React.useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      void loadData();
    };

    window.addEventListener('storage-change-serviceOrders', handleStorageChange);
    window.addEventListener('storage-change-customers', handleStorageChange);

    return () => {
      window.removeEventListener('storage-change-serviceOrders', handleStorageChange);
      window.removeEventListener('storage-change-customers', handleStorageChange);
    };
  }, [loadData]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'o' || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
        return;
      }

      event.preventDefault();
      handleNewOrderClick();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleNewOrderClick]);

  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsSheetOpen(isOpen);

    if (!isOpen) {
      setCustomerForNewOS(null);
      setEditingOrder(null);
    }
  };

  const handleEditClick = (order: ServiceOrder) => {
    setEditingOrder(order);
    setCustomerForNewOS(null);
    setIsSheetOpen(true);
  };

  const handleViewCommentsClick = async (order: ServiceOrder) => {
    const currentOrder = orders.find((entry) => entry.id === order.id);
    setCommentsOrder(currentOrder || order);

    await markServiceOrderAsViewed(order.id);
    await calculateUnreadCounts(orders);
    setIsCommentsDialogOpen(true);
  };

  const handleCommentAdded = async (orderId: string, commentText: string) => {
    if (!currentUser) {
      return;
    }

    const commentToAdd: InternalNote = {
      user: currentUser.name,
      date: new Date().toISOString(),
      comment: commentText,
    };

    let updatedOrders = orders.map((order) => {
      if (order.id !== orderId) {
        return order;
      }

      const existingNotes = Array.isArray(order.internalNotes) ? order.internalNotes : [];
      return { ...order, internalNotes: [...existingNotes, commentToAdd] };
    });

    updatedOrders = updatedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await saveServiceOrders(updatedOrders);
    setOrders(updatedOrders);
    await markServiceOrderAsViewed(orderId);
    await calculateUnreadCounts(updatedOrders);
    window.dispatchEvent(new Event('storage'));

    const freshOrderData = updatedOrders.find((order) => order.id === orderId);
    if (freshOrderData) {
      setCommentsOrder(freshOrderData);
    }

    toast({
      title: 'Comentário Adicionado!',
      description: 'A anotação foi salva na OS.',
    });
  };

  const handleSaveOrder = async (savedOrder: ServiceOrder) => {
    const orderExistsInState = orders.some((order) => order.id === savedOrder.id);

    try {
      const result = await salvarOrdemServicoComEstoque({ serviceOrder: savedOrder });
      const nextOrders = orderExistsInState
        ? orders.map((order) => (order.id === result.order.id ? result.order : order))
        : [result.order, ...orders];
      const sortedOrders = [...nextOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setOrders(sortedOrders);
      handleSheetOpenChange(false);

      toast({
        title: orderExistsInState ? 'Ordem de ServiÃ§o Atualizada!' : 'Ordem de ServiÃ§o Salva!',
        description: orderExistsInState
          ? 'Os dados da OS foram salvos com sucesso.'
          : 'A nova ordem de serviÃ§o foi registrada com sucesso.',
      });
      return;
    } catch (error) {
      const canFallback =
        error instanceof Error &&
        (
          error.message.includes('Falha na requisicao: 404') ||
          error.message.includes('Falha na requisicao: 405') ||
          error.message.includes('Failed to fetch')
        );

      if (!canFallback) {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar OS',
          description: error instanceof Error ? error.message : 'Nao foi possivel salvar a ordem de servico.',
        });
        return;
      }
    }

    const orderExists = orders.some((order) => order.id === savedOrder.id);
    const previousOrder = orders.find((order) => order.id === savedOrder.id);
    const finalOrder = { ...savedOrder };

    if (finalOrder.status === 'Entregue' && !finalOrder.deliveredDate) {
      finalOrder.deliveredDate = new Date().toISOString().split('T')[0];
    } else if (finalOrder.status !== 'Entregue') {
      delete finalOrder.deliveredDate;
    }

    const currentStock = await getStock();
    const stockSyncResult = syncServiceOrderStock({
      currentStock,
      previousItems: previousOrder?.items || [],
      nextItems: finalOrder.items || [],
    });

    if (!stockSyncResult.ok) {
      toast({
        variant: 'destructive',
        title: 'Erro ao sincronizar estoque',
        description: stockSyncResult.error,
      });
      return;
    }

    const updatedOrders = orderExists
      ? orders.map((order) => (order.id === finalOrder.id ? finalOrder : order))
      : [finalOrder, ...orders];

    const sortedOrders = updatedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await saveStock(stockSyncResult.updatedStock);
    await saveServiceOrders(sortedOrders);
    setOrders(sortedOrders);
    window.dispatchEvent(new Event('storage-change-serviceOrders'));
    window.dispatchEvent(new Event('storage-change-stock'));
    handleSheetOpenChange(false);

    toast({
      title: orderExists ? 'Ordem de Serviço Atualizada!' : 'Ordem de Serviço Salva!',
      description: orderExists
        ? 'Os dados da OS foram salvos com sucesso.'
        : 'A nova ordem de serviço foi registrada com sucesso.',
    });
  };

  const handleReopenOrder = async (orderId: string) => {
    const result = await atualizarStatusOrdemServico({ orderId, status: 'Aberta' });
    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === result.order.id ? result.order : order))
    );

    toast({
      title: 'Ordem de Serviço Reaberta!',
      description: `A OS #${formatServiceOrderNumber(orderId)} foi movida para o status "Aberta".`,
    });
  };

  const handleQuickStatusChange = async (orderId: string, newStatus: ServiceOrder['status']) => {
    const result = await atualizarStatusOrdemServico({ orderId, status: newStatus });
    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === result.order.id ? result.order : order))
    );

    toast({
      title: 'Status Alterado!',
      description: `A OS #${formatServiceOrderNumber(orderId)} foi atualizada para "${newStatus}".`,
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await excluirOrdemServico({ orderId });
      const updatedOrders = orders.filter((order) => order.id !== orderId);
      setOrders(updatedOrders);

      toast({
        title: 'OS ExcluÃ­da com Sucesso!',
        description: `A OS #${formatServiceOrderNumber(orderId)} foi removida, o estoque e as finanÃ§as foram ajustados.`,
      });
      return;
    } catch (error) {
      const canFallback =
        error instanceof Error &&
        (
          error.message.includes('Falha na requisicao: 404') ||
          error.message.includes('Falha na requisicao: 405') ||
          error.message.includes('Failed to fetch')
        );

      if (!canFallback) {
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir OS',
          description: error instanceof Error ? error.message : 'Nao foi possivel excluir a ordem de servico.',
        });
        return;
      }
    }

    const orderToDelete = orders.find((order) => order.id === orderId);
    if (!orderToDelete) {
      return;
    }

    if (orderToDelete.items && orderToDelete.items.length > 0) {
      const currentStock = await getStock();
      const stockSyncResult = syncServiceOrderStock({
        currentStock,
        previousItems: orderToDelete.items,
        nextItems: [],
      });

      if (!stockSyncResult.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro ao devolver estoque',
          description: stockSyncResult.error,
        });
        return;
      }

      await saveStock(stockSyncResult.updatedStock);
    }

    const currentTransactions = await getFinancialTransactions();
    const updatedTransactions = currentTransactions.filter((transaction) => transaction.relatedServiceOrderId !== orderId);
    await saveFinancialTransactions(updatedTransactions);

    const updatedOrders = orders.filter((order) => order.id !== orderId);
    await saveServiceOrders(updatedOrders);
    setOrders(updatedOrders);

    window.dispatchEvent(new Event('storage-change-serviceOrders'));
    window.dispatchEvent(new Event('storage-change-stock'));
    window.dispatchEvent(new Event('storage-change-financialTransactions'));

    toast({
      title: 'OS Excluída com Sucesso!',
      description: `A OS #${formatServiceOrderNumber(orderId)} foi removida, o estoque e as finanças foram ajustados.`,
    });
  };

  const handlePrint = async (documentType: OsPdfDocumentType, order: ServiceOrder) => {
    const customer = customers.find((entry) => entry.id === order.customerId);
    if (!customer) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Cliente da OS não encontrado.' });
      return;
    }

    if (!order.id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'A OS selecionada n�f£o possui identificador v�f¡lido para impress�f£o.' });
      return;
    }

    console.info('[print] Solicitando gera�f§�f£o de documento da OS', {
      documentType,
      orderId: order.id,
      customerId: order.customerId,
    });

    try {
      await generateOsPdf(documentType, order, customer);
    } catch (error) {
      console.error('[print] Falha ao gerar documento da OS', {
        documentType,
        orderId: order.id,
        error,
      });
      toast({
        variant: 'destructive',
        title: 'Erro ao imprimir',
        description: 'N�f£o foi poss�f­vel gerar o documento selecionado. Verifique os dados da OS e tente novamente.',
      });
    }
  };

  const handleOpenFinalizeDialog = (order: ServiceOrder) => {
    setFinalizingOrder(order);
    setIsFinalizeDialogOpen(true);
  };

  const handleCloseFinalizeDialog = () => {
    setIsFinalizeDialogOpen(false);
    setFinalizingOrder(null);
  };

  const shouldUseLegacyFinalizeOrderFallback = (error: unknown) => {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.message.includes('Falha na requisicao: 404') ||
      error.message.includes('Falha na requisicao: 405') ||
      error.message.includes('Failed to fetch')
    );
  };

  const handleFinalizeSaveLegacy = async ({
    orderId,
    newPayments,
    newTransactions,
    nextStatus,
    deliveredDate,
  }: {
    orderId: string;
    newPayments: OSPayment[];
    newTransactions: FinancialTransaction[];
    nextStatus?: ServiceOrder['status'];
    deliveredDate?: string;
  }) => {
    const currentTransactions = await getFinancialTransactions();
    const mergedTransactions = newTransactions.reduce(
      (transactions, transaction) =>
        transaction.origin === 'service-order-finalization'
          ? upsertServiceOrderFinalizationTransaction(transactions, transaction)
          : [transaction, ...transactions],
      currentTransactions
    );
    await saveFinancialTransactions(mergedTransactions);

    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status: nextStatus || 'Finalizado',
            deliveredDate: deliveredDate || new Date().toISOString().split('T')[0],
            payments: [...(order.payments || []), ...newPayments],
          }
        : order
    );

    await saveServiceOrders(updatedOrders);
    setOrders(updatedOrders);

    window.dispatchEvent(new Event('storage-change-serviceOrders'));
    window.dispatchEvent(new Event('storage-change-financialTransactions'));

    toast({
      title: nextStatus === 'Aguardando Pagamento' ? 'OS aguardando pagamento!' : 'Ordem Finalizada!',
      description:
        nextStatus === 'Aguardando Pagamento'
          ? `A OS #${formatServiceOrderNumber(orderId)} foi concluída com lançamento pendente no financeiro.`
          : `A OS #${formatServiceOrderNumber(orderId)} foi finalizada e o financeiro atualizado.`,
    });

    handleCloseFinalizeDialog();
  };

  const handleFinalizeSave = async ({
    orderId,
    newPayments,
    newTransactions,
    nextStatus,
    deliveredDate,
  }: {
    orderId: string;
    newPayments: OSPayment[];
    newTransactions: FinancialTransaction[];
    nextStatus?: ServiceOrder['status'];
    deliveredDate?: string;
  }) => {
    try {
      const result = await finalizarOrdemServico({
        orderId,
        newPayments,
        newTransactions,
        nextStatus,
        deliveredDate,
      });

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === result.order.id ? result.order : order))
      );

      toast({
        title: nextStatus === 'Aguardando Pagamento' ? 'OS aguardando pagamento!' : 'Ordem Finalizada!',
        description:
          nextStatus === 'Aguardando Pagamento'
            ? `A OS #${formatServiceOrderNumber(orderId)} foi concluÃ­da com lanÃ§amento pendente no financeiro.`
            : `A OS #${formatServiceOrderNumber(orderId)} foi finalizada e o financeiro atualizado.`,
      });

      handleCloseFinalizeDialog();
    } catch (error) {
      if (shouldUseLegacyFinalizeOrderFallback(error)) {
        await handleFinalizeSaveLegacy({
          orderId,
          newPayments,
          newTransactions,
          nextStatus,
          deliveredDate,
        });
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao finalizar OS',
        description: error instanceof Error ? error.message : 'Nao foi possivel finalizar a ordem de servico.',
      });
    }
  };

  const handleNotifyCustomer = React.useCallback(() => {
    toast({
      title: 'Em breve!',
      description: 'A notificacao para clientes via WhatsApp sera implementada em futuras versoes.',
    });
  }, [toast]);

  const filteredOrders = React.useMemo(() => {
    let result = [...orders];

    if (statusFilter === 'ativas') {
      result = result.filter((order) => order.status !== 'Finalizado' && order.status !== 'Entregue' && order.status !== 'Cancelada');
    } else if (statusFilter === 'finalizadas') {
      result = result.filter((order) => order.status === 'Finalizado' || order.status === 'Entregue');
    } else if (statusFilter !== 'todas') {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (searchFilter) {
      const lowerCaseFilter = searchFilter.toLowerCase();
      result = result.filter((order) => {
        const equipmentName =
          typeof order.equipment === 'string'
            ? order.equipment.toLowerCase()
            : `${order.equipment?.type || ''} ${order.equipment?.brand || ''} ${order.equipment?.model || ''}`.trim().toLowerCase();

        return (
          order.customerName?.toLowerCase().includes(lowerCaseFilter) ||
          equipmentName.includes(lowerCaseFilter) ||
          order.id?.toLowerCase().includes(lowerCaseFilter)
        );
      });
    }

    return result.sort(compareOrdersForList);
  }, [orders, searchFilter, statusFilter]);

  if (isLoading) {
    return <div>Carregando ordens de serviço...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Ordens de Serviço</CardTitle>
              <CardDescription>Gerencie as ordens de serviço.</CardDescription>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filtrar por Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Visualizações Gerais</SelectLabel>
                    <SelectItem value="ativas">Status: Ativas</SelectItem>
                    <SelectItem value="finalizadas">Status: Finalizadas</SelectItem>
                    <SelectItem value="todas">Status: Todas</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Status Específicos</SelectLabel>
                    {allStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <NewOrderSheet
                onNewOrderClick={handleNewOrderClick}
                customer={customerForNewOS}
                serviceOrder={editingOrder}
                isOpen={isSheetOpen}
                onOpenChange={handleSheetOpenChange}
                onSave={handleSaveOrder}
                onFinalizeRequest={handleOpenFinalizeDialog}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <DebouncedSearchInput
              defaultValue={searchFilter}
              onDebouncedChange={setSearchFilter}
              placeholder="Filtrar por cliente, equipamento ou n� OS..."
              className="max-w-sm"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead className="hidden md:table-cell">Data de Entrada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const equipmentName =
                    typeof order.equipment === 'string'
                      ? order.equipment
                      : `${order.equipment.type || ''} ${order.equipment.brand || ''} ${order.equipment.model || ''}`.trim();
                  const canReopenOrder = order.status === 'Finalizado';

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Link
                          href="#"
                          className="font-medium text-primary hover:underline"
                          onClick={(event) => {
                            event.preventDefault();
                            handleEditClick(order);
                          }}
                        >
                          #{formatServiceOrderNumber(order.id)}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell>{equipmentName}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(order.date)}</TableCell>
                      <TableCell>
                        <div className="relative inline-flex items-center">
                          <Badge className={cn('font-semibold', getStatusVariant(order.status))} variant="outline">
                            {order.status}
                          </Badge>
                          {unreadCounts[order.id] > 0 && (
                            <div className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                              {unreadCounts[order.id]}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel>Acoes da OS</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleEditClick(order)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar Ordem de Servico
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <GitBranchPlus className="mr-2 h-4 w-4" />
                                Mudar Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuRadioGroup
                                    value={order.status}
                                    onValueChange={(value) => handleQuickStatusChange(order.id, value as ServiceOrder['status'])}
                                  >
                                    {allStatuses.map((statusOption) => (
                                      <DropdownMenuRadioItem key={statusOption} value={statusOption}>
                                        {statusOption}
                                      </DropdownMenuRadioItem>
                                    ))}
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  {printActions.map((action) => {
                                    const Icon = action.icon;

                                    return (
                                      <DropdownMenuItem key={action.documentType} onSelect={() => handlePrint(action.documentType, order)}>
                                        <Icon className="mr-2 h-4 w-4" />
                                        {action.label}
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleViewCommentsClick(order)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Exibir Comentarios
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleNotifyCustomer}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Notificar Cliente
                            </DropdownMenuItem>
                            {canReopenOrder && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleReopenOrder(order.id)}>
                                  <Undo2 className="mr-2 h-4 w-4" />
                                  Reabrir OS
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status !== 'Finalizado' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-emerald-600 focus:bg-emerald-50"
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    handleOpenFinalizeDialog(order);
                                  }}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Finalizar Ordem de Servico
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(event) => event.preventDefault()}
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir OS
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação é irreversível. A OS será excluída, as peças retornarão ao estoque e os lançamentos
                                    financeiros serão estornados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteOrder(order.id)} className="bg-destructive hover:bg-destructive/90">
                                    Sim, Excluir OS
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma ordem de serviço encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ViewCommentsDialog
        isOpen={isCommentsDialogOpen}
        onOpenChange={setIsCommentsDialogOpen}
        serviceOrder={commentsOrder}
        onCommentAdd={handleCommentAdded}
      />
      <AddPaymentDialog
        isOpen={isFinalizeDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseFinalizeDialog();
          }
          setIsFinalizeDialogOpen(open);
        }}
        serviceOrder={finalizingOrder}
        mode="finalize"
        onSave={handleFinalizeSave}
      />
    </>
  );
}

export default function ServiceOrdersPage() {
  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <ServiceOrdersComponent />
    </React.Suspense>
  );
}


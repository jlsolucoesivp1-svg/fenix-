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
  Search,
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
import { Input } from '@/components/ui/input';
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
  getCustomers,
  getServiceOrderViewMetadata,
  getServiceOrders,
  getStock,
  getFinancialTransactions,
  markServiceOrderAsViewed,
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
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { generateOsPdf } from '@/lib/pdf-generators/os-pdf-generator';

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
  'Em análise',
  'Aguardando peça',
  'Aprovado',
  'Em conserto',
  'Aguardando Pagamento',
  'Finalizado',
  'Entregue',
  'Cancelada',
];

const printActions: Array<{
  documentType: 'invoice' | 'quote' | 'delivery';
  label: string;
  icon: typeof ClipboardList;
}> = [
  { documentType: 'invoice', label: 'Imprimir Ordem de Servico', icon: ClipboardList },
  { documentType: 'quote', label: 'Imprimir Orcamento', icon: FileSignature },
  { documentType: 'delivery', label: 'Imprimir Recibo de Entrega', icon: ReceiptText },
];

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
    const orderExists = orders.some((order) => order.id === savedOrder.id);
    const finalOrder = { ...savedOrder };

    if (finalOrder.status === 'Entregue' && !finalOrder.deliveredDate) {
      finalOrder.deliveredDate = new Date().toISOString().split('T')[0];
    } else if (finalOrder.status !== 'Entregue') {
      delete finalOrder.deliveredDate;
    }

    const updatedOrders = orderExists
      ? orders.map((order) => (order.id === finalOrder.id ? finalOrder : order))
      : [finalOrder, ...orders];

    const sortedOrders = updatedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await saveServiceOrders(sortedOrders);
    setOrders(sortedOrders);
    window.dispatchEvent(new Event('storage-change-serviceOrders'));
    handleSheetOpenChange(false);

    toast({
      title: orderExists ? 'Ordem de Serviço Atualizada!' : 'Ordem de Serviço Salva!',
      description: orderExists
        ? 'Os dados da OS foram salvos com sucesso.'
        : 'A nova ordem de serviço foi registrada com sucesso.',
    });
  };

  const handleReopenOrder = async (orderId: string) => {
    const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: 'Aberta' as const } : order));

    await saveServiceOrders(updatedOrders);
    setOrders(updatedOrders);
    window.dispatchEvent(new Event('storage-change-serviceOrders'));

    toast({
      title: 'Ordem de Serviço Reaberta!',
      description: `A OS #${orderId.slice(-4)} foi movida para o status "Aberta".`,
    });
  };

  const handleQuickStatusChange = async (orderId: string, newStatus: ServiceOrder['status']) => {
    let updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order));

    if (newStatus === 'Entregue') {
      updatedOrders = updatedOrders.map((order) =>
        order.id === orderId && !order.deliveredDate ? { ...order, deliveredDate: new Date().toISOString().split('T')[0] } : order
      );
    }

    await saveServiceOrders(updatedOrders);
    setOrders(updatedOrders);
    window.dispatchEvent(new Event('storage-change-serviceOrders'));

    toast({
      title: 'Status Alterado!',
      description: `A OS #${orderId.slice(-4)} foi atualizada para "${newStatus}".`,
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    const orderToDelete = orders.find((order) => order.id === orderId);
    if (!orderToDelete) {
      return;
    }

    if (orderToDelete.items && orderToDelete.items.length > 0) {
      const partsToReturn = orderToDelete.items.filter((item) => item.type === 'part');

      if (partsToReturn.length > 0) {
        const currentStock = await getStock();
        const updatedStock = [...currentStock];

        partsToReturn.forEach((part) => {
          const stockItemIndex = updatedStock.findIndex((stockItem) => stockItem.name.toLowerCase() === part.description.toLowerCase());
          if (stockItemIndex !== -1) {
            updatedStock[stockItemIndex].quantity += part.quantity;
          }
        });

        await saveStock(updatedStock);
      }
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
      description: `A OS #${orderId.slice(-4)} foi removida, o estoque e as finanças foram ajustados.`,
    });
  };

  const handlePrint = async (documentType: 'entry' | 'quote' | 'delivery' | 'invoice', order: ServiceOrder) => {
    const customer = customers.find((entry) => entry.id === order.customerId);
    if (!customer) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Cliente da OS não encontrado.' });
      return;
    }

    await generateOsPdf(documentType, order, customer);
  };

  const handleOpenFinalizeDialog = (order: ServiceOrder) => {
    setFinalizingOrder(order);
    setIsFinalizeDialogOpen(true);
  };

  const handleCloseFinalizeDialog = () => {
    setIsFinalizeDialogOpen(false);
    setFinalizingOrder(null);
  };

  const handleFinalizeSave = async (orderId: string, newPayments: OSPayment[], newTransactions: FinancialTransaction[]) => {
    const currentTransactions = await getFinancialTransactions();
    await saveFinancialTransactions([...newTransactions, ...currentTransactions]);

    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status: 'Finalizado' as const,
            deliveredDate: new Date().toISOString().split('T')[0],
            payments: [...(order.payments || []), ...newPayments],
          }
        : order
    );

    await saveServiceOrders(updatedOrders);
    setOrders(updatedOrders);

    window.dispatchEvent(new Event('storage-change-serviceOrders'));
    window.dispatchEvent(new Event('storage-change-financialTransactions'));

    toast({
      title: 'Ordem Finalizada!',
      description: `A OS #${orderId.slice(-4)} foi finalizada e o financeiro atualizado.`,
    });

    handleCloseFinalizeDialog();
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

    return result;
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
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por cliente, equipamento ou nº OS..."
                className="max-w-sm pl-8"
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
              />
            </div>
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
                          #{order.id.slice(-4)}
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

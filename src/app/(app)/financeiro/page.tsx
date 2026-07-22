
'use client';

import * as React from 'react';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Printer,
  X,
  FileText,
  WalletCards,
  CheckCircle,
  AlertTriangle,
  FileSignature,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { ModuleLoadingState, ModuleState } from '@/components/ui/module-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import {
  deleteTenantFinancialTransaction,
  estornarVenda,
  getFinancialTransactions,
  getTenantFinancialOverview,
  marcarTransacaoComoPaga,
  saveFinancialTransactions,
  getSales,
  saveSales,
  getStock,
  saveStock,
  getServiceOrders,
  saveServiceOrders,
} from '@/lib/storage';
import type { FinancialTransaction, Sale, StockItem, ServiceOrder } from '@/types';
import { cn } from '@/lib/utils';
import { formatServiceOrderNumber } from '@/lib/service-order-id';
import { useToast } from '@/hooks/use-toast';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { PrintReceiptDialog } from '@/components/financials/print-receipt-dialog';
import { SaleInvoiceDialog } from '@/components/sales/sale-invoice-dialog';
import Link from 'next/link';
import { generateFinancialReportPdf } from '@/lib/pdf-generators/financial-pdf-generator';

const formatDateForDisplay = (dateString: string | undefined) => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return 'Data inválida';
  }
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};


export default function FinanceiroPage() {
  const { toast } = useToast();
  const session = useCurrentAppSession();
  const [allTransactions, setAllTransactions] = React.useState<FinancialTransaction[]>([]);
  const [allSales, setAllSales] = React.useState<Sale[]>([]);
  const [allServiceOrders, setAllServiceOrders] = React.useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [descriptionFilter, setDescriptionFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return { from: start, to: end };
  });
  const [transactionToPrint, setTransactionToPrint] = React.useState<FinancialTransaction | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  const [saleForDetails, setSaleForDetails] = React.useState<Sale | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isReversalDialogOpen, setIsReversalDialogOpen] = React.useState(false);
  const [transactionToReverse, setTransactionToReverse] = React.useState<FinancialTransaction | null>(null);
  const [reversalReason, setReversalReason] = React.useState('');
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const useSaasFinancial =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;


  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      setLoadError(null);
      if (useSaasFinancial) {
        const overview = await getTenantFinancialOverview();
        const loadedTransactions = [...overview.transactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setAllTransactions(loadedTransactions);
        setAllSales(overview.sales);
        setAllServiceOrders([]);
      } else {
        const [loadedTransactions, loadedSales, loadedOrders] = await Promise.all([
            getFinancialTransactions(),
            getSales(),
            getServiceOrders(),
        ]);
        loadedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setAllTransactions(loadedTransactions);
        setAllSales(loadedSales);
        setAllServiceOrders(loadedOrders);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel carregar os dados financeiros.';
      setLoadError(message);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar financeiro',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, useSaasFinancial]);

  React.useEffect(() => {
    if (session.isLoading) {
      return;
    }

    const handleStorageChange = () => loadData();

    void loadData();
    
    window.addEventListener('storage-change-financialTransactions', handleStorageChange);
    window.addEventListener('storage-change-serviceOrders', handleStorageChange);
    window.addEventListener('storage-change-sales', handleStorageChange);

    return () => {
      window.removeEventListener('storage-change-financialTransactions', handleStorageChange);
      window.removeEventListener('storage-change-serviceOrders', handleStorageChange);
      window.removeEventListener('storage-change-sales', handleStorageChange);
    };
  }, [loadData, session.isLoading]);

  const handleDeleteTransaction = async (transactionId: string) => {
    if (useSaasFinancial) {
      await deleteTenantFinancialTransaction(transactionId);
      const updatedTransactions = allTransactions.filter(t => t.id !== transactionId);
      setAllTransactions(updatedTransactions);
      toast({
        title: 'Lancamento Excluido!',
        description: 'A transacao foi removida do seu historico financeiro.',
      });
      return;
    }
    const updatedTransactions = allTransactions.filter(t => t.id !== transactionId);
    setAllTransactions(updatedTransactions);
    await saveFinancialTransactions(updatedTransactions);
    toast({
      title: 'Lançamento Excluído!',
      description: 'A transação foi removida do seu histórico financeiro.',
    });
  };

  const handleOpenReversalDialog = (transaction: FinancialTransaction) => {
    setTransactionToReverse(transaction);
    setReversalReason('');
    setIsReversalDialogOpen(true);
  };

  const shouldUseLegacyReverseSaleFallback = (error: unknown) => {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.message.includes('Falha na requisicao: 404') ||
      error.message.includes('Falha na requisicao: 405') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Modulo de vendas SaaS indisponivel')
    );
  };

  const handleReverseSaleLegacy = async () => {
    if (!transactionToReverse?.relatedSaleId || !reversalReason.trim()) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'O motivo do estorno é obrigatório.',
        });
        return;
    }
    const saleToReverse = allSales.find(s => s.id === transactionToReverse.relatedSaleId);
    if (!saleToReverse) return;

    // 1. Return items to stock
    const stock = await getStock();
    const updatedStock = [...stock];
    saleToReverse.items.forEach(saleItem => {
      if (saleItem.id && saleItem.id.startsWith('PROD-')) {
        const stockIndex = updatedStock.findIndex(stockItem => stockItem.id === saleItem.id);
        if (stockIndex !== -1) {
          updatedStock[stockIndex].quantity += saleItem.quantity;
        }
      }
    });
    await saveStock(updatedStock);
    window.dispatchEvent(new Event('storage-change-stock'));

    // 2. Update sale status to 'Estornada' and add reason
    const updatedSales = allSales.map(s => 
      s.id === transactionToReverse.relatedSaleId ? { ...s, status: 'Estornada' as const, reversalReason: reversalReason.trim() } : s
    );
    setAllSales(updatedSales);
    await saveSales(updatedSales);
    window.dispatchEvent(new Event('storage-change-sales'));
    
    // 3. Update associated financial transactions status to 'Estornado'
    const updatedTransactions = allTransactions.map(t =>
      t.relatedSaleId === transactionToReverse.relatedSaleId
        ? { ...t, status: 'Estornado' as const, category: 'Venda Estornada' as const, description: `[ESTORNADO] ${t.description} | Motivo: ${reversalReason.trim()}` }
        : t
    );
    setAllTransactions(updatedTransactions);
    await saveFinancialTransactions(updatedTransactions);
    window.dispatchEvent(new Event('storage-change-financialTransactions'));

    toast({
      title: 'Venda Estornada!',
      description: 'A venda foi estornada e os itens retornaram ao estoque.',
    });

    setIsReversalDialogOpen(false);
    setTransactionToReverse(null);
  };

  const handleReverseSale = async () => {
    if (!transactionToReverse?.relatedSaleId || !reversalReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'O motivo do estorno e obrigatorio.',
      });
      return;
    }

    try {
      const result = await estornarVenda({
        saleId: transactionToReverse.relatedSaleId,
        reason: reversalReason.trim(),
      });

      setAllSales((currentSales) =>
        currentSales.map((sale) => (sale.id === result.sale.id ? result.sale : sale))
      );
      setAllTransactions((currentTransactions) =>
        currentTransactions.map((transaction) => {
          const reversedTransaction = result.transactions.find((item) => item.id === transaction.id);
          return reversedTransaction || transaction;
        })
      );

      toast({
        title: 'Venda Estornada!',
        description: 'A venda foi estornada e os itens retornaram ao estoque.',
      });

      setIsReversalDialogOpen(false);
      setTransactionToReverse(null);
    } catch (error) {
      if (!useSaasFinancial && shouldUseLegacyReverseSaleFallback(error)) {
        await handleReverseSaleLegacy();
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao estornar venda',
        description: error instanceof Error ? error.message : 'Nao foi possivel concluir o estorno.',
      });
    }
  };


  const shouldUseLegacyMarkAsPaidFallback = (error: unknown) => {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.message.includes('Falha na requisicao: 404') ||
      error.message.includes('Falha na requisicao: 405') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Modulo financeiro SaaS indisponivel')
    );
  };

  const handleMarkAsPaidLegacy = async (txId: string) => {
    let transactionToPay: FinancialTransaction | undefined;
    const updatedTransactions = allTransactions.map(tx => {
        if (tx.id === txId) {
            transactionToPay = { ...tx, status: 'pago' as const, date: new Date().toISOString().split('T')[0] };
            return transactionToPay;
        }
        return tx;
    });
    setAllTransactions(updatedTransactions);
    await saveFinancialTransactions(updatedTransactions);

    // If it's related to an OS, check if it was the last pending payment
    if (transactionToPay?.relatedServiceOrderId) {
        const osId = transactionToPay.relatedServiceOrderId;
        const remainingPending = updatedTransactions.some(tx => 
            tx.relatedServiceOrderId === osId && tx.status === 'pendente'
        );

        if (!remainingPending) {
            const currentOrders = await getServiceOrders();
            const updatedOrders = currentOrders.map(order => {
                if (order.id === osId) {
                    const hasRecordedPayment = (order.payments || []).some(payment =>
                        payment.date === transactionToPay?.date &&
                        payment.amount === transactionToPay?.amount &&
                        payment.method === transactionToPay?.paymentMethod
                    );

                    return {
                        ...order,
                        status: 'Finalizado' as const,
                        payments: hasRecordedPayment
                            ? order.payments
                            : [
                                ...(order.payments || []),
                                {
                                    id: `PAY-FIN-${transactionToPay?.id}`,
                                    amount: transactionToPay?.amount || 0,
                                    date: transactionToPay?.date || new Date().toISOString().split('T')[0],
                                    method: transactionToPay?.paymentMethod || 'Não informado',
                                },
                              ],
                    };
                }
                return order;
            });
            await saveServiceOrders(updatedOrders);
            setAllServiceOrders(updatedOrders);
            window.dispatchEvent(new Event('storage-change-serviceOrders')); // Notify other components
            toast({ title: 'Ordem de Serviço Finalizada!', description: `A OS #${formatServiceOrderNumber(osId)} foi concluída pois todos os pagamentos foram quitados.` });
        } else {
             toast({ title: 'Sucesso!', description: 'Parcela marcada como paga.'});
        }
    } else {
         toast({ title: 'Sucesso!', description: 'Transação marcada como paga.'});
    }
  };

  const handleMarkAsPaid = async (txId: string) => {
    try {
      const result = await marcarTransacaoComoPaga({ transactionId: txId });

      setAllTransactions((currentTransactions) =>
        currentTransactions.map((transaction) =>
          transaction.id === result.transaction.id ? result.transaction : transaction
        )
      );

      if (result.order) {
        setAllServiceOrders((currentOrders) =>
          currentOrders.map((order) => (order.id === result.order?.id ? result.order : order))
        );
        toast({
          title: 'Ordem de Servico Finalizada!',
          description: `A OS #${formatServiceOrderNumber(result.order.id)} foi concluida pois todos os pagamentos foram quitados.`,
        });
      } else {
        toast({ title: 'Sucesso!', description: 'Transacao marcada como paga.' });
      }
    } catch (error) {
      if (!useSaasFinancial && shouldUseLegacyMarkAsPaidFallback(error)) {
        await handleMarkAsPaidLegacy(txId);
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao marcar como pago',
        description: error instanceof Error ? error.message : 'Nao foi possivel atualizar a transacao.',
      });
    }
  };

  const combinedReceivables = React.useMemo(() => {
      const pendingTransactions = allTransactions.filter(t => t.status === 'pendente' && t.type === 'receita');
      return [...pendingTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allTransactions]);


  const filteredTransactions = React.useMemo(() => {
    if (categoryFilter === 'Venda Estornada') {
        return allTransactions.filter(t => t.status === 'Estornado');
    }
    
    if (typeFilter === 'contas_a_receber') {
        return combinedReceivables.filter(t => t.description.toLowerCase().includes(descriptionFilter.toLowerCase()));
    }

    return allTransactions.filter(t => {
      const transactionDate = t.date ? parseISO(`${t.date}T00:00:00Z`) : null;
      const matchesDescription = t.description.toLowerCase().includes(descriptionFilter.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesDate = !dateRange || !dateRange.from || (transactionDate && transactionDate >= dateRange.from && (!dateRange.to || transactionDate <= dateRange.to));

      return matchesDescription && matchesType && matchesDate && matchesCategory && t.status !== 'Estornado';
    });
  }, [allTransactions, descriptionFilter, typeFilter, categoryFilter, dateRange, combinedReceivables]);


  const totalReceitas = filteredTransactions
    .filter(t => t.type === 'receita' && t.status !== 'Estornado')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalDespesas = filteredTransactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;
  
  const monthlySummary = React.useMemo(() => {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);

    let receitas = 0;
    let despesas = 0;

    allTransactions.forEach(t => {
        if (!t.date || isNaN(new Date(t.date).getTime()) || t.status === 'Estornado') return;
        const transactionDate = parseISO(t.date);
        if (isWithinInterval(transactionDate, { start: startOfCurrentMonth, end: endOfCurrentMonth })) {
            if (t.type === 'receita') {
                receitas += t.amount;
            } else {
                despesas += t.amount;
            }
        }
    });

    return {
        receitas: receitas,
        despesas: despesas,
        saldo: receitas - despesas,
    };
}, [allTransactions]);
  
  const handlePrintClick = (transaction: FinancialTransaction) => {
    setTransactionToPrint(transaction);
    setIsPrintDialogOpen(true);
  };

  const handleDetailsClick = (transaction: FinancialTransaction) => {
    if (!transaction.relatedSaleId) return;
    const sale = allSales.find(s => s.id === transaction.relatedSaleId);
    if (sale) {
        setSaleForDetails(sale);
        setIsDetailsOpen(true);
    } else {
        toast({ variant: "destructive", title: "Erro", description: "Detalhes da venda não encontrados." });
    }
  }


  const generatePdf = async () => {
    await generateFinancialReportPdf(filteredTransactions, dateRange, {
      receitas: totalReceitas,
      despesas: totalDespesas,
      saldo: saldoPeriodo,
    });
  }

  const clearFilters = () => {
    setDescriptionFilter('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  };
  
  const renderReceivablesHeader = () => {
    if (typeFilter !== 'contas_a_receber') return null;

    if (combinedReceivables.length > 0) {
      const totalReceivable = combinedReceivables.reduce((sum, item) => sum + item.amount, 0);
      return (
        <div className="mb-4 p-4 border-l-4 border-destructive bg-destructive/10 rounded-r-lg text-destructive">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-bold">Contas a Receber</h3>
              <p className="text-sm font-semibold">
                Total pendente: R$ ${totalReceivable.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4 p-4 border-l-4 border-green-500 bg-green-500/10 rounded-r-lg text-green-700">
         <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-bold">Nenhum Pagamento Pendente</h3>
              <p className="text-sm">Todas as contas a receber estão em dia.</p>
            </div>
          </div>
      </div>
    );
  };

  if (session.isLoading || isLoading) {
    return (
      <div className="space-y-4">
        <ModuleLoadingState
          title="Carregando financeiro"
          description="Sincronizando receitas, despesas e contas a receber do contexto atual."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <ModuleState
        title="Nao foi possivel carregar o financeiro"
        description={loadError}
        icon={AlertCircle}
        tone="destructive"
        actionLabel="Tentar novamente"
        onAction={() => void loadData()}
      />
    );
  }

  return (
    <>
    <div className="space-y-6">
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/50 shadow-sm">
      <CardHeader className="border-b bg-card/80 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">Controle Financeiro</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              Acompanhe suas receitas e despesas. Filtre por período para gerar relatórios.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-left shadow-sm lg:min-w-[220px] lg:text-right">
            <p className="text-sm text-muted-foreground">Saldo do Mês</p>
            <p
              className={cn(
                'mt-1 text-3xl font-bold tracking-tight',
                monthlySummary.saldo >= 0 ? 'text-green-500' : 'text-destructive'
              )}
            >
              R$ ${monthlySummary.saldo.toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <details className="group">
              <summary className="inline-flex h-9 cursor-pointer list-none items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground [&::-webkit-details-marker]:hidden">
                Filtros
              </summary>
              <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 md:grid-cols-2 xl:grid-cols-4">
                <Input
                    placeholder="Filtrar por descrição..."
                    value={descriptionFilter}
                    onChange={(e) => setDescriptionFilter(e.target.value)}
                />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Lançamentos</SelectItem>
                        <SelectItem value="receita">Receitas</SelectItem>
                        <SelectItem value="despesa">Despesas</SelectItem>
                        <SelectItem value="contas_a_receber">Contas a Receber</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={typeFilter === 'contas_a_receber'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="Venda de Produto">Receita por Venda</SelectItem>
                    <SelectItem value="Venda de Serviço">Receita por OS</SelectItem>
                    <SelectItem value="Venda Estornada">Vendas Estornadas</SelectItem>
                    <SelectItem value="Outra Receita">Outras Receitas</SelectItem>
                    <SelectItem value="Compra de Peça">Compra de Peça</SelectItem>
                    <SelectItem value="Compra de Mercadoria">Compra de Mercadoria</SelectItem>
                    <SelectItem value="Salário">Salário</SelectItem>
                    <SelectItem value="Aluguel">Aluguel</SelectItem>
                    <SelectItem value="Outra Despesa">Outras Despesas</SelectItem>
                  </SelectContent>
                </Select>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={'outline'}
                      className={cn( 'justify-start text-left font-normal', !dateRange && 'text-muted-foreground' )}
                      disabled={typeFilter === 'contas_a_receber'}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? ( dateRange.to ? (
                          <> {format(dateRange.from, 'dd/MM/yyyy')} -{' '} {format(dateRange.to, 'dd/MM/yyyy')} </>
                        ) : ( format(dateRange.from, 'dd/MM/yyyy') )
                      ) : ( <span>Selecione um período</span> )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={1} locale={ptBR}/>
                  </PopoverContent>
                </Popover>
              </div>
            </details>
                <div className="flex flex-wrap items-center gap-2">
                     {dateRange && typeFilter !== 'contas_a_receber' && (
                         <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                            <X className="mr-2 h-4 w-4" />
                            Limpar Filtro de Data
                        </Button>
                     )}
                     <Button variant="outline" size="sm" onClick={generatePdf} disabled={filteredTransactions.length === 0}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Relatório
                     </Button>
                </div>
                <div className="hidden">
                    <div></div> {/* Empty cell for alignment */}
                    <div className="font-bold text-green-500">Receitas</div>
                    <div className="font-bold text-red-500">Despesas</div>
                    <div className="font-bold text-primary">Saldo</div>

                    <div className="font-medium text-muted-foreground">Período</div>
                    <div className="text-green-500">R$ ${totalReceitas.toFixed(2)}</div>
                    <div className="text-red-500">R$ ${totalDespesas.toFixed(2)}</div>
                    <div className={cn(saldoPeriodo >= 0 ? "text-primary" : "text-destructive")}>R$ ${saldoPeriodo.toFixed(2)}</div>
                    
                    <div className="font-medium text-muted-foreground">Mês</div>
                    <div className="text-green-500">R$ ${monthlySummary.receitas.toFixed(2)}</div>
                    <div className="text-red-500">R$ ${monthlySummary.despesas.toFixed(2)}</div>
                    <div className={cn(monthlySummary.saldo >= 0 ? "text-primary" : "text-destructive")}>R$ ${monthlySummary.saldo.toFixed(2)}</div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Receitas do Periodo</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-green-500">R$ ${totalReceitas.toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Mes: R$ ${monthlySummary.receitas.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Despesas do Periodo</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-red-500">R$ ${totalDespesas.toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Mes: R$ ${monthlySummary.despesas.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Saldo do Periodo</p>
            <p className={cn('mt-2 text-2xl font-bold tracking-tight', saldoPeriodo >= 0 ? "text-primary" : "text-destructive")}>
              R$ ${saldoPeriodo.toFixed(2)}
            </p>
            <p className={cn('mt-1 text-xs', monthlySummary.saldo >= 0 ? "text-primary" : "text-destructive")}>
              Mes: R$ ${monthlySummary.saldo.toFixed(2)}
            </p>
          </div>
        </div>

        {renderReceivablesHeader()}

        <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/30 px-5 py-4">
          <CardTitle className="text-lg">Lista de Lancamentos</CardTitle>
          <CardDescription>{filteredTransactions.length} registro(s) encontrado(s)</CardDescription>
        </div>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12"></TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="hidden md:table-cell">{typeFilter === 'contas_a_receber' ? 'Vencimento' : 'Data'}</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[64px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => {
              const isPending = transaction.status === 'pendente';
              const isReversed = transaction.status === 'Estornado';
              const valueColorClass = transaction.type === 'receita' && !isPending && !isReversed ? 'text-green-500' : isPending ? 'text-destructive' : isReversed ? 'text-gray-500 line-through' : 'text-red-500';
              
              return (
                <TableRow key={transaction.id} className={cn('transition-colors', isPending && 'bg-destructive/10', isReversed && 'bg-gray-500/10')}>
                  <TableCell className="py-4">
                    {transaction.type === 'receita' ? (<ArrowUpCircle className="h-5 w-5 text-green-500" />) : (<ArrowDownCircle className="h-5 w-5 text-red-500" />)}
                  </TableCell>
                  <TableCell className={cn('min-w-[260px] py-4', isPending && 'text-destructive', isReversed && 'text-gray-500')}>
                    <div className="max-w-xl font-medium leading-snug">
                      {transaction.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full border-muted-foreground/20 bg-muted/40 px-3 py-1 font-medium">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                    {formatDateForDisplay(transaction.dueDate || transaction.date)}
                  </TableCell>
                  <TableCell className={cn('whitespace-nowrap text-right text-base font-semibold', valueColorClass)}>
                    {transaction.type === 'receita' ? '+' : '-'} R$ ${transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost" disabled={isReversed}><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                         {transaction.status === 'pendente' && (
                           <DropdownMenuItem onSelect={() => handleMarkAsPaid(transaction.id)}><CheckCircle className="mr-2 h-4 w-4"/>Marcar como Pago</DropdownMenuItem>
                         )}
                         {transaction.relatedSaleId && (
                           <DropdownMenuItem onSelect={() => handleDetailsClick(transaction)}><FileText className="mr-2 h-4 w-4" />Ver Detalhes da Venda</DropdownMenuItem>
                         )}
                         {transaction.relatedServiceOrderId && (
                           <DropdownMenuItem asChild><Link href={`/ordens-de-servico?orderId=${transaction.relatedServiceOrderId}`}><FileText className="mr-2 h-4 w-4"/>Ver Ordem de Serviço</Link></DropdownMenuItem>
                         )}
                        <DropdownMenuItem onSelect={() => handlePrintClick(transaction)}><Printer className="mr-2 h-4 w-4" />Imprimir Recibo</DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {transaction.relatedSaleId && (
                           <DropdownMenuItem onSelect={() => handleOpenReversalDialog(transaction)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                             Estornar Venda
                           </DropdownMenuItem>
                        )}
                        {!transaction.relatedSaleId && !transaction.relatedServiceOrderId && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className='text-destructive focus:bg-destructive/10 focus:text-destructive'>
                                        Excluir Lançamento
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá permanentemente este lançamento financeiro. Deseja continuar?</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTransaction(transaction.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
             {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-6">
                    <ModuleState
                      title="Nenhum lancamento encontrado"
                      description={
                        allTransactions.length === 0
                          ? 'Ainda nao existem transacoes registradas para o contexto atual.'
                          : 'Os filtros aplicados nao retornaram resultados neste periodo.'
                      }
                      icon={WalletCards}
                      compact
                      actionLabel={allTransactions.length === 0 ? 'Recarregar modulo' : 'Limpar filtros'}
                      onAction={allTransactions.length === 0 ? () => void loadData() : clearFilters}
                    />
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
        </div>
      </CardContent>
    </Card>
    </div>
     <PrintReceiptDialog isOpen={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen} transaction={transactionToPrint}/>
     <SaleInvoiceDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} sale={saleForDetails}/>

     <Dialog open={isReversalDialogOpen} onOpenChange={setIsReversalDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Estornar Venda</DialogTitle>
                <DialogDescription>
                    Por favor, informe o motivo do estorno. Esta ação reverterá os lançamentos financeiros e devolverá os itens ao estoque.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="reversalReason">Motivo do Estorno</Label>
                <Textarea
                    id="reversalReason"
                    value={reversalReason}
                    onChange={(e) => setReversalReason(e.target.value)}
                    placeholder="Ex: Produto devolvido pelo cliente, erro no lançamento, etc."
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsReversalDialogOpen(false)}>Cancelar</Button>
                <Button
                    variant="destructive"
                    onClick={handleReverseSale}
                    disabled={!reversalReason.trim()}
                >
                    Confirmar Estorno
                </Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>
    </>
  );
}


'use client';

import * as React from 'react';
import { ShoppingCart, Trash2, ScanLine, FileText, Calendar as CalendarIcon, FileSignature, UserPlus } from 'lucide-react';
import { addMonths, format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';

import {
  createTenantCustomer,
  finalizarVenda,
  listTenantCustomers,
  listTenantProducts,
} from '@/lib/storage';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { Sale, SaleItem, Customer, StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChangeCalculatorDialog } from '@/components/sales/change-calculator-dialog';
import { SaleInvoiceDialog } from '@/components/sales/sale-invoice-dialog';
import { ManualAddItemDialog } from '@/components/sales/manual-add-item-dialog';
import { CustomerAutocomplete } from '@/components/customers/customer-autocomplete';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { cn } from '@/lib/utils';
import { POS_PAYMENT_METHOD_OPTIONS } from '@/lib/payment-methods';
import { searchTenantCustomers } from '@/lib/storage';
import { searchTenantProducts } from '@/lib/storage';
import { ModuleLoadingState } from '@/components/ui/module-state';

export default function VendasPage() {
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const session = useCurrentAppSession();
  const [saleItems, setSaleItems] = React.useState<SaleItem[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState('dinheiro');
  const [observations, setObservations] = React.useState('');
  
  const [isManualAddOpen, setIsManualAddOpen] = React.useState(false);
  const [isChangeCalcOpen, setIsChangeCalcOpen] = React.useState(false);
  const barcodeInputRef = React.useRef<HTMLInputElement>(null);
  
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = React.useState(false);
  const [saleToPrint, setSaleToPrint] = React.useState<Sale | null>(null);
  const [isCreditSaleDialogOpen, setIsCreditSaleDialogOpen] = React.useState(false);
  
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState<Omit<Customer, 'id'>>({ name: '', phone: '', email: '', address: '', document: '' });
  const [barcode, setBarcode] = React.useState('');
  
  // States for installments
  const [isInstallments, setIsInstallments] = React.useState(false);
  const [installmentsCount, setInstallmentsCount] = React.useState(2);
  const [firstDueDate, setFirstDueDate] = React.useState<Date | undefined>(addMonths(new Date(), 1));
  const hasSaasSalesSession =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;


  React.useEffect(() => {
    if (session.isLoading) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        if (!hasSaasSalesSession) return;
        const [stockData, customersData] = await Promise.all([listTenantProducts(), listTenantCustomers()]);
        if (cancelled) return;

        setStock(stockData);
        setCustomers(customersData);
      } catch (error) {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar dados de vendas',
            description: error instanceof Error ? error.message : 'Nao foi possivel carregar produtos e clientes.',
          });
        }
      }
    };
    void loadData();
    barcodeInputRef.current?.focus();

    return () => {
      cancelled = true;
    };
  }, [hasSaasSalesSession, session.isLoading, toast]);

  React.useEffect(() => {
    if (paymentMethod !== 'parcelado') {
      setIsInstallments(false);
    } else {
      setIsInstallments(true);
    }
  }, [paymentMethod]);
  
  const addProductToSale = (productToAdd: Omit<SaleItem, 'id'> & { id?: string }) => {
    setSaleItems(prevItems => {
        const existingItemById = productToAdd.productId ? prevItems.find(item => item.productId === productToAdd.productId) : undefined;
        
        if (existingItemById) {
            return prevItems.map(item =>
                    item.productId === productToAdd.productId
                    ? { ...item, quantity: (item.quantity || 0) + (productToAdd.quantity || 1) }
                    : item
            );
        }

        return [...prevItems, { ...productToAdd, id: productToAdd.id || `ITEM-${Date.now()}`, quantity: productToAdd.quantity || 1 } as SaleItem];
    });
  };
  
  const handleBarcodeScan = () => {
    if (!barcode.trim()) return;
    
    const product = stock.find(item => item.barcode === barcode.trim());
    
    if (product) {
        addProductToSale({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
        });
        toast({ title: "Produto Adicionado", description: `${product.name} foi adicionado ao carrinho.` });
    } else {
        toast({ variant: "destructive", title: "Produto não encontrado", description: `Nenhum produto encontrado com o código ${barcode}.` });
    }
    
    setBarcode(''); // Clear input for next scan
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        
        if (event.key === 'F4' && !isInputFocused) {
          event.preventDefault();
          handleFinishSale();
          return;
        }
        
        if (event.key === 'Escape' && !isInputFocused) {
            event.preventDefault();
            handleCancelSale();
            return;
        }

        if (isInputFocused && event.key === 'Escape') {
          (target as HTMLInputElement).blur();
          return;
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saleItems, discount, paymentMethod, observations, isInstallments, installmentsCount, firstDueDate]);


  const handleRemoveItem = (itemId: string) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
        handleRemoveItem(itemId);
        return;
    }
    setSaleItems(saleItems.map(item => 
        item.id === itemId 
        ? { ...item, quantity: quantity } 
        : item
    ));
  };
  
  const calculateTotal = () => {
    return saleItems.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);
  };

  const subtotal = calculateTotal();
  const finalTotal = subtotal - discount;

  const resetSale = () => {
    setSaleItems([]);
    setDiscount(0);
    setPaymentMethod('dinheiro');
    setObservations('');
    setSelectedCustomerId(undefined);
    setIsInstallments(false);
    setInstallmentsCount(2);
    setFirstDueDate(addMonths(new Date(), 1));
    barcodeInputRef.current?.focus();
  }
  
  const handleCancelSale = () => {
    resetSale();
    toast({ title: 'Venda Cancelada', description: 'Todos os itens foram removidos do carrinho.' });
  };

    const handleSaveNewCustomer = async () => {
        if (!newCustomer.name) {
            toast({ variant: 'destructive', title: 'Nome obrigatório' });
            return;
        }
        const customerToAdd: Customer = await createTenantCustomer(newCustomer);
        setCustomers((prev) => [...prev, customerToAdd].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedCustomerId(customerToAdd.id);
        setIsAddCustomerOpen(false);
        toast({ title: 'Cliente adicionado!', description: `${customerToAdd.name} foi salvo.` });
    };

  /* Legacy PDV persistence removed: sales now finalize only through the SaaS RPC.
  const processSaleLegacy = async (shouldPrint = false) => {
    if (saleItems.length === 0) {
        toast({ variant: 'destructive', title: 'Carrinho Vazio', description: 'Adicione produtos para finalizar a venda.' });
        return;
    }
    
    const saleId = `SALE-${Date.now()}`;
    const customer = customers.find(c => c.id === selectedCustomerId);
    const paymentMethodLabel = getPosPaymentMethodLabel(paymentMethod);
    const isPendingPayment = paymentMethod === 'boleto';

    // 1. Create Sale Record
    const newSale: Sale = {
        id: saleId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR'),
        user: currentUser?.name || 'Não identificado',
        items: saleItems,
        subtotal: subtotal,
        discount: discount,
        total: finalTotal,
        paymentMethod: paymentMethodLabel,
        observations: observations,
        customerId: selectedCustomerId,
        customerName: customer?.name,
    };
    const existingSales = await getSales();
    await saveSales([...existingSales, newSale]);
    
    // 2. Update stock
    const currentStock = await getStock();
    const updatedStock = [...currentStock];
    let stockWasUpdated = false;

    saleItems.forEach(saleItem => {
        // Only update stock for items that have a product ID (not manual items)
        if (saleItem.id && saleItem.id.startsWith('PROD-')) {
            const stockIndex = updatedStock.findIndex(stockItem => stockItem.id === saleItem.id);
            if (stockIndex !== -1) {
                updatedStock[stockIndex].quantity -= saleItem.quantity;
                stockWasUpdated = true;
            }
        }
    });

    if (stockWasUpdated) {
        await saveStock(updatedStock);
        setStock(updatedStock); // Update local state
    }


    // 3. Create Financial Transaction(s)
    const existingTransactions = await getFinancialTransactions();
    let newTransactions: FinancialTransaction[] = [];
    const productNames = saleItems.map(i => i.name).join(', ');
    const saleDate = format(new Date(newSale.date), 'dd/MM/yyyy');
    
    const baseDesc = `Cliente: ${customer?.name || 'Não identificado'} | Produto(s): ${productNames}`;

    if (isInstallments) {
        const installmentAmount = finalTotal / installmentsCount;
        for (let i = 0; i < installmentsCount; i++) {
            const dueDate = addMonths(firstDueDate || new Date(), i);
            newTransactions.push({
                id: `FIN-${Date.now()}-${i}`,
                type: 'receita',
                description: `${baseDesc} | Parcelamento: ${i + 1}/${installmentsCount} de R$ ${installmentAmount.toFixed(2)} | Pagamento: ${paymentMethodLabel} | Valor Total: R$ ${finalTotal.toFixed(2)} | Vencimento: ${format(dueDate, 'dd/MM/yyyy')} | Data: ${saleDate}`,
                amount: installmentAmount,
                date: newSale.date,
                dueDate: format(dueDate, 'yyyy-MM-dd'),
                category: 'Venda de Produto',
                paymentMethod: paymentMethodLabel,
                relatedSaleId: newSale.id,
                status: 'pendente',
            });
        }
    } else {
        newTransactions.push({
            id: `FIN-${Date.now()}`,
            type: 'receita',
            description: `${baseDesc} | Pagamento: ${paymentMethodLabel} | Valor Total: R$ ${finalTotal.toFixed(2)} | Data: ${saleDate}`,
            amount: finalTotal,
            date: new Date().toISOString().split('T')[0],
            category: 'Venda de Produto',
            paymentMethod: paymentMethodLabel,
            relatedSaleId: newSale.id,
            status: isPendingPayment ? 'pendente' : 'pago',
        });
    }

    await saveFinancialTransactions([...newTransactions, ...existingTransactions]);

    // 4. Notify and Reset
    toast({
      title: isPendingPayment ? 'Venda registrada com boleto!' : 'Venda Finalizada!',
      description: isPendingPayment
        ? `Venda registrada como pendente no financeiro via ${paymentMethodLabel}.`
        : `Venda de R$ ${finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrada com sucesso.`,
    });
    
    // 5. Conditional dialogs
    setIsChangeCalcOpen(false);
    setIsCreditSaleDialogOpen(false);
    
    if (shouldPrint) {
        setSaleToPrint(newSale);
        setIsInvoiceDialogOpen(true);
    }
    
    resetSale();
  }; */

  const processSale = async (shouldPrint = false) => {
    if (saleItems.length === 0) {
      toast({ variant: 'destructive', title: 'Carrinho Vazio', description: 'Adicione produtos para finalizar a venda.' });
      return;
    }

    const saleId = `SALE-${Date.now()}`;
    const customer = customers.find(c => c.id === selectedCustomerId);

    try {
      const result = await finalizarVenda({
        saleId,
        items: saleItems,
        discount,
        paymentMethod,
        observations,
        customerId: selectedCustomerId,
        customerName: customer?.name,
        relatedQuoteId: undefined,
        userName: currentUser?.name,
        installments: {
          enabled: isInstallments,
          count: installmentsCount,
          firstDueDate: firstDueDate ? format(firstDueDate, 'yyyy-MM-dd') : undefined,
        },
      });

      setStock(result.stock);

      const paymentMethodLabel = result.sale.paymentMethod;
      const isPendingPayment = result.transactions.some((transaction) => transaction.status === 'pendente');

      toast({
        title: isPendingPayment ? 'Venda registrada com boleto!' : 'Venda Finalizada!',
        description: isPendingPayment
          ? `Venda registrada como pendente no financeiro via ${paymentMethodLabel}.`
          : `Venda de R$ ${result.sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrada com sucesso.`,
      });

      setIsChangeCalcOpen(false);
      setIsCreditSaleDialogOpen(false);

      if (shouldPrint) {
        setSaleToPrint(result.sale);
        setIsInvoiceDialogOpen(true);
      }

      resetSale();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao finalizar venda',
        description: error instanceof Error ? error.message : 'Nao foi possivel concluir a venda.',
      });
    }
  };

  const handleFinishSale = async () => {
    if (saleItems.length === 0) {
      toast({ variant: 'destructive', title: 'Carrinho Vazio', description: 'Adicione produtos para finalizar a venda.' });
      return;
    }

    if (paymentMethod === 'dinheiro') {
        setIsChangeCalcOpen(true);
    } else if (paymentMethod === 'boleto') {
        setIsCreditSaleDialogOpen(true);
    } else {
        processSale(true);
    }
  }

  if (session.isLoading) {
    return (
      <ModuleLoadingState
        title="Carregando vendas"
        description="Preparando produtos, clientes e formas de pagamento."
      />
    );
  }

  if (!hasSaasSalesSession) {
    return <ModuleLoadingState title="Sessao SaaS necessaria" description="O PDV exige uma sessao SaaS valida com empresa ativa. Nenhum dado legado sera utilizado." />;
  }

  return (
    <>
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Ponto de Venda</h1>
              <p className="text-muted-foreground">Registre uma nova venda de produtos ou serviços avulsos.</p>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={handleCancelSale}>
                  Cancelar Venda
                  <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-destructive-foreground opacity-100">
                    ESC
                  </kbd>
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleFinishSale}>
                  Finalizar Venda
                  <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-green-900 opacity-100">
                    F4
                  </kbd>
              </Button>
          </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Carrinho de Venda</CardTitle>
              <CardDescription>Adicione produtos ou serviços manualmente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                      <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        ref={barcodeInputRef}
                        placeholder="Escanear código de barras..." 
                        className="pl-10"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
                      />
                  </div>
                  <Button variant="outline" onClick={() => setIsManualAddOpen(true)}>Adicionar Item Manual</Button>
              </div>
              
              <div className="border rounded-lg min-h-[300px] flex flex-col">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[50%]">Produto/Serviço</TableHead>
                              <TableHead className="w-[15%] text-center">Qtd.</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleItems.length > 0 ? (
                          saleItems.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-center">
                                  <Input 
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                                      className="w-16 h-8 text-center mx-auto"
                                  />
                              </TableCell>
                              <TableCell className="text-right">{item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                              <TableCell className="text-right font-semibold">{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                              <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                           <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={5} className="text-center h-full py-20 text-muted-foreground">
                                  <ShoppingCart className="mx-auto h-12 w-12 mb-2" />
                                  O carrinho está vazio.
                              </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                  </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumo e Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="customer">Cliente (Opcional)</Label>
                  <div className="flex gap-2">
                    <CustomerAutocomplete
                        id="customer"
                        selectedCustomer={customers.find((c) => c.id === selectedCustomerId) ?? null}
                        onSelect={(customer) => setSelectedCustomerId(customer?.id)}
                        searchFunction={searchTenantCustomers}
                        placeholder="Buscar cliente para a venda..."
                        emptyMessage="Nenhum cliente encontrado."
                        className="flex-1"
                      />
                    <Button variant="outline" size="icon" onClick={() => setIsAddCustomerOpen(true)}><UserPlus /></Button>
                  </div>
              </div>
              <div className="space-y-2 text-base">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-medium">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Desconto (R$)</span>
                  <CurrencyInput 
                    value={discount} 
                    onValueChange={setDiscount}
                    className="w-28 h-9" 
                  />
                </div>
                <div className="flex justify-between items-center font-bold text-xl text-primary border-t pt-2">
                  <span>Total</span>
                  <span>{finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      {POS_PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

               {isInstallments && (
                <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                  <Label>Detalhes do Parcelamento</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <Label htmlFor="installmentsCount" className="text-xs">Nº de Parcelas</Label>
                       <Input id="installmentsCount" type="number" value={installmentsCount} onChange={e => setInstallmentsCount(parseInt(e.target.value))} min={2} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="firstDueDate" className="text-xs">1º Vencimento</Label>
                       <Popover>
                          <PopoverTrigger asChild>
                            <Button id="firstDueDate" variant={'outline'} className={cn('w-full justify-start text-left font-normal', !firstDueDate && 'text-muted-foreground')}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {firstDueDate ? format(firstDueDate, 'dd/MM/yyyy') : <span>Selecione</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={firstDueDate} onSelect={setFirstDueDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                  </div>
                   <div className="text-center text-sm text-muted-foreground">
                    <p>{installmentsCount}x de <span className="font-bold">{(finalTotal / installmentsCount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea 
                    id="observations" 
                    placeholder="Notas adicionais sobre a venda..." 
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    <ManualAddItemDialog
        isOpen={isManualAddOpen}
        onAddItem={(item) => addProductToSale({ ...item })}
        onOpenChange={setIsManualAddOpen}
        searchFunction={searchTenantProducts}
        addProductImmediately
    />
    <ChangeCalculatorDialog
        isOpen={isChangeCalcOpen}
        onOpenChange={setIsChangeCalcOpen}
        total={finalTotal}
        onConfirm={() => processSale(true)}
    />
    <SaleInvoiceDialog
      isOpen={isInvoiceDialogOpen}
      onOpenChange={setIsInvoiceDialogOpen}
      sale={saleToPrint}
    />
    <AlertDialog open={isCreditSaleDialogOpen} onOpenChange={setIsCreditSaleDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar pagamento pendente</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação registrará a venda e criará uma pendência no Contas a Receber. Deseja gerar uma fatura para impressão?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => processSale(false)}>Salvar sem Fatura</AlertDialogAction>
                <AlertDialogAction onClick={() => processSale(true)}>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Salvar e Gerar Fatura
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
     {/* Add New Customer Dialog */}
    <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>
                    Preencha os dados do novo cliente abaixo.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="new-name">Nome</Label>
                    <Input id="new-name" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-phone">Telefone</Label>
                    <Input id="new-phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="new-email">Email</Label>
                    <Input id="new-email" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="new-address">Endereço</Label>
                    <Input id="new-address" value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="new-document">Documento (CPF/CNPJ)</Label>
                    <Input id="new-document" value={newCustomer.document} onChange={(e) => setNewCustomer({...newCustomer, document: e.target.value})} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddCustomerOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveNewCustomer}>Salvar Cliente</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

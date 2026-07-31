'use client';

import * as React from 'react';
import { PlusCircle, Printer, FileText, Trash2, X, ChevronsUpDown, Check, ShieldCheck, MessageSquare, DollarSign, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getCustomers,
  getFinancialTransactions,
  getSettings,
  getStock,
  getTenantSettings,
  listTenantCustomers,
  listTenantProducts,
  saveFinancialTransactions,
  searchTenantCustomers,
} from '@/lib/storage';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { Customer, ServiceOrder, StockItem, CompanyInfo, User, InternalNote, FinancialTransaction, OSPayment, ServiceOrderItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { add } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { findStockItemForServiceOrderItem, getAvailableStockForDraftItem } from '@/lib/service-order-stock';
import { resolveServiceOrderStatusFromBalance } from '@/lib/service-order-financial';
import { formatServiceOrderNumber } from '@/lib/service-order-id';
import { SERVICE_ORDER_PAYMENT_METHODS } from '@/lib/payment-methods';
import { CustomerAutocomplete } from '@/components/customers/customer-autocomplete';
import { LocalAutocomplete, highlightMatch } from '@/components/ui/local-autocomplete';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { ServiceOrderFilesPanel } from '@/components/service-orders/service-order-files-panel';

interface NewOrderSheetProps {
  onNewOrderClick: (customer?: Customer | null) => void;
  customer?: Customer | null;
  serviceOrder?: ServiceOrder | null;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onSave?: (serviceOrder: ServiceOrder) => void | Promise<void>;
  onFinalizeRequest?: (serviceOrder: ServiceOrder) => void | Promise<void>;
}
export function NewOrderSheet({ onNewOrderClick, customer, serviceOrder, isOpen, onOpenChange, onSave, onFinalizeRequest }: NewOrderSheetProps) {
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const session = useCurrentAppSession();
  
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [reportedProblem, setReportedProblem] = React.useState('');
  const [equipmentType, setEquipmentType] = React.useState('');
  const [equipment, setEquipment] = React.useState({ brand: '', model: '', serial: '' });
  const [accessories, setAccessories] = React.useState('');
  const [technicalReport, setTechnicalReport] = React.useState('');
  const [internalNotes, setInternalNotes] = React.useState<InternalNote[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [items, setItems] = React.useState<ServiceOrderItem[]>([]);
  const [payments, setPayments] = React.useState<OSPayment[]>([]);
  const [newPayment, setNewPayment] = React.useState({ amount: 0, method: 'Dinheiro' });
  const [status, setStatus] = React.useState<ServiceOrder['status']>('Aberta');
  const [warranty, setWarranty] = React.useState('');
  
  const [isManualAddDialogOpen, setIsManualAddDialogOpen] = React.useState(false);
  const [manualAddItem, setManualAddItem] = React.useState<ServiceOrderItem | null>(null);
  
  const [newItem, setNewItem] = React.useState({ description: '', quantity: 1, unitPrice: 0, type: 'service' as 'service' | 'part', stockItemId: undefined as string | undefined });
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const useSaasServiceOrders =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;

  const isEditing = !!serviceOrder;
  
  React.useEffect(() => {
    const loadData = async () => {
      if (!isOpen) {
        return;
      }

      const [customersData, stockData] = await Promise.all(
        useSaasServiceOrders
          ? [listTenantCustomers(), listTenantProducts()]
          : [getCustomers(), getStock()]
      );
      setCustomers(customersData);
      setStock(stockData);
    };
    loadData();
  }, [isOpen, useSaasServiceOrders]);

  React.useEffect(() => {
    const loadWarranty = async () => {
      const settings = useSaasServiceOrders ? await getTenantSettings() : await getSettings();
      let defaultWarrantyDays = settings.defaultWarrantyDays || 90;
      const defaultWarranty = `${defaultWarrantyDays} dias`;

      if (isOpen) { 
        if (isEditing && serviceOrder) {
            const customerIdToSet = serviceOrder.customerId || customers.find(c => c.name === serviceOrder.customerName)?.id || '';
            setSelectedCustomerId(customerIdToSet);

            if (typeof serviceOrder.equipment === 'string') {
                const [type, brand, ...modelParts] = serviceOrder.equipment.split(' ');
                const model = modelParts.join(' ');
                setEquipmentType(type || '');
                setEquipment({ brand: brand || '', model: model || '', serial: serviceOrder.serialNumber || '' });
            } else if (typeof serviceOrder.equipment === 'object' && serviceOrder.equipment !== null) {
                const eq = serviceOrder.equipment as any;
                setEquipmentType(eq.type || '');
                setEquipment({ brand: eq.brand || '', model: eq.model || '', serial: eq.serialNumber || serviceOrder.serialNumber || '' });
            }

            setAccessories(serviceOrder.accessories || ''); 
            setReportedProblem(serviceOrder.reportedProblem || '');
            setTechnicalReport(serviceOrder.technicalReport || ''); 
            setItems(serviceOrder.items || []); 
            setPayments(serviceOrder.payments || []);
            setStatus(serviceOrder.status);
            if (typeof serviceOrder.internalNotes === 'string') {
                setInternalNotes([{ user: 'Sistema', date: new Date().toISOString(), comment: serviceOrder.internalNotes as string }]);
            } else {
                setInternalNotes(serviceOrder.internalNotes || []);
            }
            setNewComment('');
            setWarranty(serviceOrder.warranty || defaultWarranty);
        } else {
            const customerIdToSet = customer ? customer.id : '';
            setSelectedCustomerId(customerIdToSet);
            setEquipmentType('');
            setEquipment({ brand: '', model: '', serial: '' });
            setAccessories('');
            setReportedProblem('');
            setTechnicalReport('');
            setItems([]);
            setPayments([]);
            setStatus('Aberta');
            setInternalNotes([]);
            setNewComment('');
            setWarranty(defaultWarranty);
        }
      }
    };
    loadWarranty();
  }, [serviceOrder, customer, isEditing, isOpen, customers, useSaasServiceOrders]);

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEquipment(prev => ({ ...prev, [id]: value }));
  };

  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Item inválido',
        description: 'Preencha a descrição e a quantidade do item.',
      });
      return;
    }

    if (newItem.type === 'part') {
      const stockItem = findStockItemForServiceOrderItem(stock, newItem);
      if (!stockItem) {
        setManualAddItem({ ...newItem, id: Date.now() });
        setIsManualAddDialogOpen(true);
        return;
      }

      const availableQuantity = getAvailableStockForDraftItem(stock, serviceOrder?.items || [], items, {
        stockItemId: stockItem.id,
        description: stockItem.name,
      });

      if ((availableQuantity ?? 0) < newItem.quantity) {
        toast({
          variant: 'destructive',
          title: 'Estoque insuficiente',
          description: `A peça "${stockItem.name}" possui ${Math.max(availableQuantity ?? 0, 0)} unidade(s) disponível(is) para esta OS.`,
        });
        return;
      }

      setItems([...items, { ...newItem, id: Date.now(), stockItemId: stockItem.id, description: stockItem.name, unitPrice: stockItem.price }]);
      setNewItem({ description: '', quantity: 1, unitPrice: 0, type: 'service', stockItemId: undefined });
      return;
    }

    setItems([...items, { ...newItem, id: Date.now() }]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0, type: 'service', stockItemId: undefined });
  };

  const confirmManualAdd = () => {
    if (manualAddItem) {
      setItems([...items, manualAddItem]);
    }
    setNewItem({ description: '', quantity: 1, unitPrice: 0, type: 'service', stockItemId: undefined });
    setIsManualAddDialogOpen(false);
    setManualAddItem(null);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity || 0) * (item.unitPrice || 0), 0);
  };
  
  const totalValue = calculateTotal();
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const balanceDue = totalValue - totalPaid;

  const handleAddPayment = async () => {
      if (newPayment.amount <= 0 || newPayment.amount > balanceDue) {
          toast({ variant: "destructive", title: "Valor de pagamento inválido."});
          return;
      }
      
      const paymentToAdd: OSPayment = {
          id: `PAY-${Date.now()}`,
          amount: newPayment.amount,
          date: new Date().toISOString().split('T')[0],
          method: newPayment.method,
      };

      setPayments(prev => [...prev, paymentToAdd]);
      
      const newBalance = balanceDue - newPayment.amount;
      setStatus(resolveServiceOrderStatusFromBalance(newBalance));
      
      const transaction: Omit<FinancialTransaction, 'id'> = {
        type: 'receita',
        description: `Pagamento da OS #${formatServiceOrderNumber(serviceOrder?.id) || 'NOVA'}`,
        amount: newPayment.amount,
        date: new Date().toISOString().split('T')[0],
        category: 'Venda de Servi\u00e7o',
        paymentMethod: newPayment.method,
        relatedServiceOrderId: serviceOrder?.id,
        status: 'pago',
        origin: 'service-order-payment',
      };
      
      if (!useSaasServiceOrders) {
        const existingTransactions = await getFinancialTransactions();
        await saveFinancialTransactions([{ ...transaction, id: `FIN-${Date.now()}` }, ...existingTransactions]);
      }

      toast({ title: "Pagamento adicionado!", description: `R$ ${newPayment.amount.toFixed(2)} recebido.`});
      setNewPayment({ amount: 0, method: 'Dinheiro' });
  };
  
  const handleRemovePayment = (paymentId: string) => {
    setPayments(payments.filter(p => p.id !== paymentId));
  }


  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return;
    const comment: InternalNote = {
      user: currentUser.name,
      date: new Date().toISOString(),
      comment: newComment.trim(),
    };
    setInternalNotes(prev => [...prev, comment]);
    setNewComment('');
  };
  
  const getFinalOrderData = () => {
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Por favor, selecione um cliente.' });
      return null;
    }

    const fullEquipmentName = `${equipmentType} ${equipment.brand} ${equipment.model}`.trim();
    if (!fullEquipmentName) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Por favor, preencha as informações do equipamento.' });
        return null;
    }

    const finalOrder: ServiceOrder = {
        // Em SaaS o numero visivel e reservado e gravado pela RPC no banco.
        // Um novo formulario nunca escolhe um numero no navegador.
        id: serviceOrder?.id || '',
        customerName: selectedCustomer.name,
        customerId: selectedCustomerId,
        equipment: fullEquipmentName,
        reportedProblem: reportedProblem,
        status: status,
        date: serviceOrder?.date || new Date().toISOString().split('T')[0],
        totalValue: totalValue,
        items: items,
        payments: payments,
        internalNotes: internalNotes,
        technicalReport: technicalReport,
        accessories: accessories,
        serialNumber: equipment.serial,
        warranty: warranty,
        attendant: serviceOrder?.attendant || currentUser?.name || 'Admin',
    };

    if (finalOrder.status === 'Entregue' && !finalOrder.deliveredDate) {
      finalOrder.deliveredDate = new Date().toISOString().split('T')[0];
    } else if (finalOrder.status !== 'Entregue') {
      delete finalOrder.deliveredDate;
    }
    
    return finalOrder;
  };
  
  const handleSaveAndClose = async () => {
    const finalOrder = getFinalOrderData();
    if (finalOrder && onSave) {
      await onSave(finalOrder);
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  };

  const handleSaveAndFinalize = async () => {
    if (!isEditing || !onSave || !onFinalizeRequest) {
      return;
    }

    const finalOrder = getFinalOrderData();
    if (!finalOrder) {
      return;
    }

    await onSave(finalOrder);
    if (onOpenChange) {
      onOpenChange(false);
    }
    await onFinalizeRequest(finalOrder);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
           <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => onNewOrderClick()}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Adicionar OS
            </span>
              <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-flex">
                O
              </kbd>
          </Button>
        </DialogTrigger>
        <DialogContent className="flex h-[95dvh] w-[calc(100vw-1rem)] flex-col overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="p-4 flex-shrink-0 border-b">
            <DialogTitle>{isEditing ? `Editar Ordem de Serviço #${formatServiceOrderNumber(serviceOrder?.id)}` : 'Nova Ordem de Serviço'}</DialogTitle>
            <DialogDescription>
              {isEditing ? `Altere os dados do atendimento, adicione serviços e peças.` : 'Preencha os dados para registrar um novo atendimento.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow min-h-0">
              <Tabs defaultValue="general" className="h-full flex flex-col">
                  <div className="px-4 pt-4">
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 sm:grid-cols-5">
                        <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                        <TabsTrigger value="items">Serviços e Peças</TabsTrigger>
                        <TabsTrigger value="financial">Financeiro</TabsTrigger>
                        <TabsTrigger value="notes">Comentários</TabsTrigger>
                        <TabsTrigger value="files">Arquivos</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-grow min-h-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 pt-2 space-y-3">
                        <TabsContent value="general" className="mt-0 space-y-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              <div className="md:col-span-2">
                                  <Label htmlFor="customer">Cliente</Label>
                                  <CustomerAutocomplete
                                    id="customer"
                                    selectedCustomer={customers.find((c) => c.id === selectedCustomerId) ?? null}
                                    onSelect={(customer) => setSelectedCustomerId(customer?.id ?? '')}
                                    searchFunction={useSaasServiceOrders ? searchTenantCustomers : undefined}
                                    placeholder="Buscar cliente para a OS..."
                                    emptyMessage="Nenhum cliente encontrado."
                                  />
                              </div>
                              <div>
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={(v) => setStatus(v as ServiceOrder['status'])}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Aberta">Aberta</SelectItem>
                                    <SelectItem value="Em análise">Em análise</SelectItem>
                                    <SelectItem value="Aguardando peça">Aguardando peça</SelectItem>
                                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                                    <SelectItem value="Em conserto">Em conserto</SelectItem>
                                    <SelectItem value="Aguardando Pagamento">Aguardando Pagamento</SelectItem>
                                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                                    <SelectItem value="Entregue">Entregue</SelectItem>
                                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <div>
                                <Label htmlFor="type">Tipo</Label>
                                <Input id="type" placeholder="Ex: Notebook" value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} />
                              </div>
                              <div>
                                <Label htmlFor="brand">Marca</Label>
                                <Input id="brand" placeholder="Ex: Dell" value={equipment.brand} onChange={handleEquipmentChange} />
                              </div>
                              <div>
                                <Label htmlFor="model">Modelo</Label>
                                <Input id="model" placeholder="Ex: Inspiron 15" value={equipment.model} onChange={handleEquipmentChange} />
                              </div>
                              <div>
                                <Label htmlFor="serial">Nº de Série</Label>
                                <Input id="serial" placeholder="Serial" value={equipment.serial} onChange={handleEquipmentChange} />
                              </div>
                            </div>
                             <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                <div className="space-y-1.5">
                                  <Label htmlFor="reported_problem">Defeito Reclamado</Label>
                                  <Textarea id="reported_problem" placeholder="Descrição do problema relatado pelo cliente." value={reportedProblem} onChange={(e) => setReportedProblem(e.target.value)} rows={3}/>
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="accessories">Acessórios Entregues</Label>
                                  <Textarea id="accessories" placeholder="Ex: Carregador original, mochila preta e adaptador HDMI." value={accessories} onChange={(e) => setAccessories(e.target.value)} rows={3}/>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="technical_report">Diagnóstico / Laudo Técnico</Label>
                                <Textarea id="technical_report" placeholder="Descrição técnica detalhada do diagnóstico, serviço a ser executado, peças necessárias, etc." value={technicalReport} onChange={(e) => setTechnicalReport(e.target.value)} rows={4}/>
                              </div>
                              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
                                  <div className="space-y-1.5">
                                      <Label htmlFor="warranty">Garantia Aplicada</Label>
                                      <Input id="warranty" placeholder="Ex: 90 dias" value={warranty} onChange={(e) => setWarranty(e.target.value)}/>
                                      <p className="text-xs text-muted-foreground">Exemplos: 90 dias, 6 meses, 1 ano, Sem garantia</p>
                                  </div>
                              </div>
                        </TabsContent>
                        <TabsContent value="items" className="mt-0 space-y-3">
                          <div>
                            <div className="space-y-2">
                              {items.map((item) => (
                                <div key={item.id} className="flex items-start gap-2 rounded-md border p-2">
                                  <div className="grid flex-grow gap-1 sm:grid-cols-12 sm:items-center sm:gap-2">
                                      <span className="sm:col-span-5 sm:truncate">{item.description}</span>
                                      <span className="col-span-2 text-sm text-muted-foreground">({item.type === 'service' ? 'Serviço' : 'Peça'})</span>
                                      <span className="text-sm text-muted-foreground sm:col-span-1">Qtd: {item.quantity}</span>
                                      <span className="text-sm text-muted-foreground sm:col-span-2">Unit: R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      <span className="font-medium sm:col-span-2 sm:text-right">R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 grid gap-2 rounded-md border border-dashed p-2 lg:grid-cols-[minmax(0,1fr)_7rem_4rem_6rem_auto] lg:items-end">
                               <div className="min-w-0">
                                  <Label htmlFor="newItemDescription" className="text-xs">Descrição</Label>
                                  {newItem.type === 'part' ? (
                                      <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                          <PopoverTrigger asChild>
                                              <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                                                  {newItem.description || "Selecione uma peça..."}
                                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                              </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                              <div className="p-2">
                                                <LocalAutocomplete
                                                  items={stock}
                                                  selectedItem={stock.find((stockItem) => stockItem.id === newItem.stockItemId) ?? null}
                                                  onSelect={(stockItem) => {
                                                    if (stockItem) {
                                                      setNewItem({
                                                        ...newItem,
                                                        description: stockItem.name,
                                                        unitPrice: stockItem.price,
                                                        stockItemId: stockItem.id,
                                                      });
                                                      setOpenCombobox(false);
                                                    }
                                                  }}
                                                  getOption={(stockItem) => ({
                                                    item: stockItem,
                                                    value: stockItem.name,
                                                    keywords: [stockItem.category || '', stockItem.barcode || ''],
                                                  })}
                                                  renderItem={(stockItem, query) => (
                                                    <span className="block truncate">{highlightMatch(stockItem.name, query)}</span>
                                                  )}
                                                  placeholder="Procurar pe�a..."
                                                  emptyMessage="Nenhuma pe�a encontrada."
                                                  inputClassName="border-0 shadow-none focus-visible:ring-0"
                                                />
                                              </div>
                                          </PopoverContent>
                                      </Popover>
                                  ) : ( <Input id="newItemDescription" placeholder="Ex: Formatação" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value, stockItemId: undefined})} /> )}
                              </div>
                              <div className="w-28"><Label className="text-xs">Tipo</Label><Select value={newItem.type} onValueChange={(value: 'service' | 'part') => setNewItem({...newItem, type: value, description: '', unitPrice: 0, stockItemId: undefined })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="service">Serviço</SelectItem><SelectItem value="part">Peça</SelectItem></SelectContent></Select></div>
                              <div className="w-16"><Label htmlFor="newItemQty" className="text-xs">Qtd</Label><Input id="newItemQty" type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value, 10) || 1})} /></div>
                              <div className="w-24"><Label htmlFor="newItemPrice" className="text-xs">Valor R$</Label><CurrencyInput id="newItemPrice" value={newItem.unitPrice} onValueChange={(val) => setNewItem({...newItem, unitPrice: val})} disabled={newItem.type === 'part'} /></div>
                              <Button onClick={handleAddItem} size="sm" className="w-full lg:w-auto">Adicionar</Button>
                            </div>
                            <div className="mt-4 text-right"><p className="text-lg font-bold">Total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                          </div>
                        </TabsContent>
                         <TabsContent value="financial" className="mt-0 space-y-4">
                            <div className="p-4 border rounded-lg bg-muted/20">
                                <h3 className="font-semibold text-lg mb-4">Resumo Financeiro</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Valor Total da OS</span><span className="font-medium">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                                    <div className="flex justify-between items-center text-green-500"><span >Total Pago</span><span className="font-medium">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                                    <div className="flex justify-between items-center text-xl font-bold text-primary border-t pt-2 mt-2"><span >Saldo Devedor</span><span>R$ {balanceDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                                </div>
                            </div>
                             <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">Histórico de Pagamentos</h4>
                                {payments.length > 0 ? (
                                    <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Valor</TableHead><TableHead>Método</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                                        <TableBody>
                                        {payments.map(p => (
                                            <TableRow key={p.id}><TableCell>{new Date(p.date).toLocaleDateString('pt-BR')}</TableCell><TableCell>R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell><TableCell>{p.method}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => handleRemovePayment(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                ) : (<p className="text-sm text-muted-foreground text-center p-4">Nenhum pagamento registrado.</p>)}
                             </div>
                             <div className="p-4 border rounded-lg border-dashed">
                                 <h4 className="font-semibold mb-2">Registrar Novo Pagamento Parcial</h4>
                                 <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                     <div className="flex-grow space-y-1"><Label htmlFor="newPaymentAmount">Valor</Label><CurrencyInput id="newPaymentAmount" value={newPayment.amount} onValueChange={(val) => setNewPayment(p => ({...p, amount: val}))}/></div>
                                     <div className="flex-grow space-y-1"><Label htmlFor="newPaymentMethod">Método</Label>
                                         <Select value={newPayment.method} onValueChange={(v) => setNewPayment(p => ({...p, method: v}))}>
                                             <SelectTrigger><SelectValue/></SelectTrigger>
                                             <SelectContent>
                                                {SERVICE_ORDER_PAYMENT_METHODS.map((method) => (
                                                  <SelectItem key={method} value={method}>{method}</SelectItem>
                                                ))}
                                             </SelectContent>
                                         </Select>
                                     </div>
                                     <Button onClick={handleAddPayment} className="w-full sm:w-auto" disabled={newPayment.amount <= 0 || newPayment.amount > balanceDue}>Adicionar</Button>
                                 </div>
                             </div>
                        </TabsContent>
                        <TabsContent value="notes" className="mt-0">
                           <div className="space-y-4">
                              <div className="space-y-2"><Label>Histórico de Comentários</Label>
                                  <div className="border rounded-md p-2 bg-muted/30 max-h-60 overflow-y-auto space-y-3">
                                      {internalNotes.length > 0 ? ( internalNotes.map((note, index) => (
                                              <div key={index} className="text-sm p-2 bg-background rounded-md shadow-sm">
                                                  <p className="leading-relaxed">{note.comment}</p>
                                                  <p className="text-xs text-muted-foreground mt-1 pt-2 border-t border-muted">
                                                      Adicionado por <span className="font-semibold">{note.user}</span> em {new Date(note.date).toLocaleString('pt-BR')}
                                                  </p>
                                              </div>))) : (<p className="text-sm text-muted-foreground p-4 text-center">Nenhum comentário interno ainda.</p>)}
                                  </div>
                              </div>
                               <div className="space-y-2"><Label htmlFor="new_comment">Adicionar Novo Comentário</Label>
                                  <div className="flex items-start gap-2"><Textarea id="new_comment" placeholder="Adicione observações para a equipe..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3}/><Button onClick={handleAddComment} className="mt-auto">Adicionar</Button></div>
                                  <p className="text-sm text-muted-foreground">Estas anotações são para uso exclusivo da equipe.</p>
                              </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="files" className="mt-0">
                          <ServiceOrderFilesPanel
                            serviceOrderId={serviceOrder?.id}
                            enabled={useSaasServiceOrders}
                          />
                        </TabsContent>
                      </div>
                    </ScrollArea>
                  </div>
              </Tabs>
          </div>
          <DialogFooter className="p-4 border-t flex-shrink-0 bg-card sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              {isEditing && onFinalizeRequest && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleSaveAndFinalize}
                  disabled={status === 'Finalizado' || status === 'Entregue' || status === 'Cancelada'}
                >
                  <Check className="h-4 w-4" />
                  Finalizar OS
                </Button>
              )}
              {isEditing && onOpenChange && (
                  <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4 sm:mt-0">
                <Button onClick={handleSaveAndClose}>{isEditing ? 'Salvar Alterações' : 'Salvar e Fechar'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isManualAddDialogOpen} onOpenChange={setIsManualAddDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Peça fora do estoque</AlertDialogTitle><AlertDialogDescription>A peça <span className="font-bold">"{manualAddItem?.description}"</span> não consta no estoque. Deseja adicioná-la mesmo assim?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setManualAddItem(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmManualAdd}>Adicionar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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
import { getCustomers, getStock, getCompanyInfo, getSettings, saveFinancialTransactions, getFinancialTransactions } from '@/lib/storage';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { Customer, ServiceOrder, StockItem, CompanyInfo, User, InternalNote, FinancialTransaction, OSPayment, ServiceOrderItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { add } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface NewOrderSheetProps {
  onNewOrderClick: (customer?: Customer | null) => void;
  customer?: Customer | null;
  serviceOrder?: ServiceOrder | null;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onSave?: (serviceOrder: ServiceOrder) => void;
}

export function NewOrderSheet({ onNewOrderClick, customer, serviceOrder, isOpen, onOpenChange, onSave }: NewOrderSheetProps) {
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  
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
  
  const [newItem, setNewItem] = React.useState({ description: '', quantity: 1, unitPrice: 0, type: 'service' as 'service' | 'part' });
  const [openCombobox, setOpenCombobox] = React.useState(false);

  const isEditing = !!serviceOrder;
  
  React.useEffect(() => {
    const loadData = async () => {
      const [customersData, stockData] = await Promise.all([
        getCustomers(),
        getStock(),
      ]);
      setCustomers(customersData);
      setStock(stockData);
    };
    loadData();
  }, []);

  React.useEffect(() => {
    const loadWarranty = async () => {
      const settings = await getSettings();
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
  }, [serviceOrder, customer, isEditing, isOpen, customers]);

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
      const stockItem = stock.find(item => item.name.toLowerCase() === newItem.description.toLowerCase());
      if (!stockItem) {
        setManualAddItem({ ...newItem, id: Date.now() });
        setIsManualAddDialogOpen(true);
        return;
      }
    }

    setItems([...items, { ...newItem, id: Date.now() }]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0, type: 'service' });
  };

  const confirmManualAdd = () => {
    if (manualAddItem) {
      setItems([...items, manualAddItem]);
    }
    setNewItem({ description: '', quantity: 1, unitPrice: 0, type: 'service' });
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
      if (newBalance <= 0) {
          setStatus("Finalizado");
      } else {
          setStatus("Aguardando Pagamento");
      }
      
      const transaction: Omit<FinancialTransaction, 'id'> = {
        type: 'receita',
        description: `Pagamento da OS #${serviceOrder?.id.slice(-4) || 'NOVA'}`,
        amount: newPayment.amount,
        date: new Date().toISOString().split('T')[0],
        category: 'Venda de Serviço',
        paymentMethod: newPayment.method,
        relatedServiceOrderId: serviceOrder?.id,
        status: 'pago',
      };
      
      const existingTransactions = await getFinancialTransactions();
      await saveFinancialTransactions([{ ...transaction, id: `FIN-${Date.now()}` }, ...existingTransactions]);

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
        id: serviceOrder?.id || `OS-${Date.now()}`,
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
  
  const handleSaveAndClose = () => {
    const finalOrder = getFinalOrderData();
    if (finalOrder && onSave) {
      onSave(finalOrder);
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
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
        <DialogContent className="sm:max-w-5xl w-full h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-4 flex-shrink-0 border-b">
            <DialogTitle>{isEditing ? `Editar Ordem de Serviço #${serviceOrder?.id.slice(-4)}` : 'Nova Ordem de Serviço'}</DialogTitle>
            <DialogDescription>
              {isEditing ? `Altere os dados do atendimento, adicione serviços e peças.` : 'Preencha os dados para registrar um novo atendimento.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow min-h-0">
              <Tabs defaultValue="general" className="h-full flex flex-col">
                  <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                        <TabsTrigger value="items">Serviços e Peças</TabsTrigger>
                        <TabsTrigger value="financial">Financeiro</TabsTrigger>
                        <TabsTrigger value="notes">Comentários</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-grow min-h-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 pt-2 space-y-3">
                        <TabsContent value="general" className="mt-0 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-2">
                                  <Label htmlFor="customer">Cliente</Label>
                                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {customers.map((c) => (
                                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
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
                            <div className="grid grid-cols-4 gap-3">
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
                             <div className="grid grid-cols-2 gap-3">
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
                              <div className="grid grid-cols-2 gap-3 items-end">
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
                                <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border">
                                  <div className="flex-grow grid grid-cols-12 gap-2 items-center">
                                      <span className="col-span-5 truncate">{item.description}</span>
                                      <span className="col-span-2 text-sm text-muted-foreground">({item.type === 'service' ? 'Serviço' : 'Peça'})</span>
                                      <span className="col-span-1 text-sm text-muted-foreground">Qtd: {item.quantity}</span>
                                      <span className="col-span-2 text-sm text-muted-foreground">Unit: R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      <span className="col-span-2 font-medium text-right">R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 flex items-end gap-2 p-2 rounded-md border border-dashed">
                               <div className="flex-grow">
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
                                              <Command>
                                                  <CommandInput placeholder="Procurar peça..." value={newItem.description} onValueChange={(search) => setNewItem({...newItem, description: search })}/>
                                                  <CommandList>
                                                      <CommandEmpty>Nenhuma peça encontrada.</CommandEmpty>
                                                      <CommandGroup>
                                                          {stock.map((stockItem) => (
                                                              <CommandItem key={stockItem.id} value={stockItem.name} onSelect={(currentValue) => {
                                                                      const selected = stock.find(s => s.name.toLowerCase() === currentValue.toLowerCase());
                                                                      if (selected) { setNewItem({ ...newItem, description: selected.name, unitPrice: selected.price }); }
                                                                      setOpenCombobox(false);
                                                                  }}>
                                                                  <Check className={cn("mr-2 h-4 w-4", newItem.description.toLowerCase() === stockItem.name.toLowerCase() ? "opacity-100" : "opacity-0")} />
                                                                  {stockItem.name}
                                                              </CommandItem>
                                                          ))}
                                                      </CommandGroup>
                                                  </CommandList>
                                              </Command>
                                          </PopoverContent>
                                      </Popover>
                                  ) : ( <Input id="newItemDescription" placeholder="Ex: Formatação" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} /> )}
                              </div>
                              <div className="w-28"><Label className="text-xs">Tipo</Label><Select value={newItem.type} onValueChange={(value: 'service' | 'part') => setNewItem({...newItem, type: value, description: '', unitPrice: 0 })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="service">Serviço</SelectItem><SelectItem value="part">Peça</SelectItem></SelectContent></Select></div>
                              <div className="w-16"><Label htmlFor="newItemQty" className="text-xs">Qtd</Label><Input id="newItemQty" type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value, 10) || 1})} /></div>
                              <div className="w-24"><Label htmlFor="newItemPrice" className="text-xs">Valor R$</Label><CurrencyInput id="newItemPrice" value={newItem.unitPrice} onValueChange={(val) => setNewItem({...newItem, unitPrice: val})} disabled={newItem.type === 'part'} /></div>
                              <Button onClick={handleAddItem} size="sm">Adicionar</Button>
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
                                 <div className="flex items-end gap-2">
                                     <div className="flex-grow space-y-1"><Label htmlFor="newPaymentAmount">Valor</Label><CurrencyInput id="newPaymentAmount" value={newPayment.amount} onValueChange={(val) => setNewPayment(p => ({...p, amount: val}))}/></div>
                                     <div className="flex-grow space-y-1"><Label htmlFor="newPaymentMethod">Método</Label>
                                         <Select value={newPayment.method} onValueChange={(v) => setNewPayment(p => ({...p, method: v}))}>
                                             <SelectTrigger><SelectValue/></SelectTrigger>
                                             <SelectContent><SelectItem value="Dinheiro">Dinheiro</SelectItem><SelectItem value="PIX">PIX</SelectItem><SelectItem value="Cartão de Crédito">Crédito</SelectItem><SelectItem value="Cartão de Débito">Débito</SelectItem></SelectContent>
                                         </Select>
                                     </div>
                                     <Button onClick={handleAddPayment} disabled={newPayment.amount <= 0 || newPayment.amount > balanceDue}>Adicionar</Button>
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
                      </div>
                    </ScrollArea>
                  </div>
              </Tabs>
          </div>
          <DialogFooter className="p-4 border-t flex-shrink-0 bg-card sm:justify-between">
            <div>
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

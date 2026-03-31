
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Check } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ServiceOrder, OSPayment, FinancialTransaction } from '@/types';

interface AddPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  serviceOrder: ServiceOrder | null;
  mode?: 'payment' | 'finalize';
  onSave: (orderId: string, newPayments: OSPayment[], newTransactions: FinancialTransaction[]) => void;
  onFinalizeComplete?: (orderId: string, amount: number, status: 'pago' | 'pendente') => void;
}

export function AddPaymentDialog({
  isOpen,
  onOpenChange,
  serviceOrder,
  mode = 'payment',
  onSave,
  onFinalizeComplete,
}: AddPaymentDialogProps) {
  const { toast } = useToast();
  const [paymentType, setPaymentType] = React.useState<'integral' | 'parcelado'>('integral');
  const [installments, setInstallments] = React.useState(2);
  const [firstDueDate, setFirstDueDate] = React.useState<Date | undefined>(addMonths(new Date(), 1));
  const [entryAmount, setEntryAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState('Dinheiro');
  const [finalAmount, setFinalAmount] = React.useState<number>(0);
  const [finalPaymentStatus, setFinalPaymentStatus] = React.useState<'pago' | 'pendente'>('pago');
  const [observation, setObservation] = React.useState('');
  const isFinalizeMode = mode === 'finalize';

  const totalPaid = serviceOrder?.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
  const balanceDue = (serviceOrder?.finalValue ?? serviceOrder?.totalValue ?? 0) - totalPaid;

  React.useEffect(() => {
    if (isOpen) {
      setPaymentType('integral');
      setInstallments(2);
      setFirstDueDate(addMonths(new Date(), 1));
      setEntryAmount(0);
      setPaymentMethod('Dinheiro');
      setFinalPaymentStatus('pago');
      setObservation('');
      setFinalAmount(serviceOrder ? serviceOrder.finalValue ?? serviceOrder.totalValue ?? 0 : 0);
    }
  }, [isOpen, serviceOrder]);

  const handleSave = () => {
    if (!serviceOrder) return;
    
    const newPayments: OSPayment[] = [];
    const newTransactions: FinancialTransaction[] = [];
    
    const currentDate = new Date().toISOString().split('T')[0];
    const saleDate = format(new Date(serviceOrder.date), 'dd/MM/yyyy');
    const baseDesc = `Cliente: ${serviceOrder.customerName} | OS #${serviceOrder.id.slice(-4)} | Pagamento: ${paymentMethod} | Valor Total: R$ ${serviceOrder.totalValue.toFixed(2)} | Data: ${saleDate}`;
    
    if (isFinalizeMode) {
        const amount = Number(finalAmount) || 0;
        if (amount <= 0) {
            toast({ variant: 'destructive', title: 'Valor inválido', description: 'Informe o valor final da OS.' });
            return;
        }

        if (!paymentMethod) {
            toast({ variant: 'destructive', title: 'Forma de pagamento', description: 'Escolha uma forma de pagamento.' });
            return;
        }

        const description = observation
            ? `${baseDesc} | Observação: ${observation.trim()}`
            : baseDesc;

        const transaction: FinancialTransaction = {
            id: `FIN-${Date.now()}`,
            type: 'receita',
            description,
            amount,
            date: currentDate,
            category: 'Venda de Serviço',
            paymentMethod,
            relatedServiceOrderId: serviceOrder.id,
            status: finalPaymentStatus,
        };

        const paymentsToAdd: OSPayment[] =
            finalPaymentStatus === 'pago'
                ? [{ id: `PAY-${Date.now()}`, amount, date: currentDate, method: paymentMethod }]
                : [];

        onSave(serviceOrder.id, paymentsToAdd, [transaction]);
        onFinalizeComplete?.(serviceOrder.id, amount, finalPaymentStatus);
        return;
    }

    if (paymentType === 'integral') {
        newPayments.push({ id: `PAY-${Date.now()}`, amount: balanceDue, date: new Date().toISOString().split('T')[0], method: paymentMethod });
        newTransactions.push({ 
            id: `FIN-${Date.now()}`, 
            type: 'receita', 
            description: baseDesc,
            amount: balanceDue, 
            date: new Date().toISOString().split('T')[0], 
            category: 'Venda de Serviço', 
            paymentMethod, 
            relatedServiceOrderId: serviceOrder.id, 
            status: 'pago' 
        });
    } else { // Parcelado
        const entry = Number(entryAmount) || 0;
        if (entry > balanceDue) {
            toast({ variant: 'destructive', title: 'Entrada inválida', description: 'O valor de entrada não pode ser maior que o saldo devedor.'});
            return;
        }
        
        // Registra a entrada se houver
        if (entry > 0) {
            newPayments.push({ id: `PAY-${Date.now()}-entry`, amount: entry, date: new Date().toISOString().split('T')[0], method: paymentMethod });
            newTransactions.push({ 
                id: `FIN-${Date.now()}-entry`, 
                type: 'receita', 
                description: `Entrada: ${baseDesc}`,
                amount: entry, 
                date: new Date().toISOString().split('T')[0], 
                category: 'Venda de Serviço', 
                paymentMethod, 
                relatedServiceOrderId: serviceOrder.id, 
                status: 'pago' 
            });
        }
        
        const remainingBalance = balanceDue - entry;
        if (remainingBalance > 0 && installments > 0) {
          const installmentAmount = remainingBalance / installments;

          for (let i = 0; i < installments; i++) {
              const dueDate = addMonths(firstDueDate || new Date(), i);

              newTransactions.push({
                  id: `FIN-${Date.now()}-${i}`,
                  type: 'receita',
                  description: `Cliente: ${serviceOrder.customerName} | OS #${serviceOrder.id.slice(-4)} | Parcelamento: ${i + 1}/${installments} de R$ ${installmentAmount.toFixed(2)} | Pagamento: ${paymentMethod} | Valor Total: R$ ${serviceOrder.totalValue.toFixed(2)} | Vencimento: ${format(dueDate, 'dd/MM/yyyy')} | Data: ${saleDate}`,
                  amount: installmentAmount,
                  date: new Date().toISOString().split('T')[0], // Data de criação da transação
                  dueDate: format(dueDate, 'yyyy-MM-dd'), // Data de vencimento da parcela
                  category: 'Venda de Serviço',
                  paymentMethod: paymentMethod, // Usar o método principal para referência
                  relatedServiceOrderId: serviceOrder.id,
                  status: 'pendente', 
              });
          }
        }
    }
    
    onSave(serviceOrder.id, newPayments, newTransactions);
  };
  
  if (!serviceOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento da OS #{serviceOrder.id.slice(-4)}</DialogTitle>
          <DialogDescription>
            Defina como o pagamento de <span className="font-bold">R$ {balanceDue.toFixed(2)}</span> será realizado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            {isFinalizeMode ? (
                <>
                    <div className="space-y-2">
                        <Label>Valor total do serviço</Label>
                        <CurrencyInput value={finalAmount} onValueChange={setFinalAmount} />
                    </div>
                    <div className="space-y-2">
                        <Label>Forma de pagamento</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="PIX">PIX</SelectItem>
                                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Status do Pagamento</Label>
                        <RadioGroup value={finalPaymentStatus} onValueChange={(value) => setFinalPaymentStatus(value as 'pago' | 'pendente')} className="grid grid-cols-2 gap-2">
                            <Label className="flex items-center gap-2 rounded-md border px-3 py-2" htmlFor="status-paid">
                                <RadioGroupItem id="status-paid" value="pago" className="sr-only" />
                                Pago
                            </Label>
                            <Label className="flex items-center gap-2 rounded-md border px-3 py-2" htmlFor="status-pending">
                                <RadioGroupItem id="status-pending" value="pendente" className="sr-only" />
                                Pendente
                            </Label>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>Observação (opcional)</Label>
                        <Textarea value={observation} onChange={(event) => setObservation(event.target.value)} className="resize-none" rows={3} />
                    </div>
                </>
            ) : (
                <>
                    <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as any)} className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="r-integral" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="integral" id="r-integral" className="sr-only" />
                                Pagamento Integral
                            </Label>
                        </div>
                        <div>
                            <Label htmlFor="r-parcelado" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value="parcelado" id="r-parcelado" className="sr-only" />
                                Parcelado
                            </Label>
                        </div>
                    </RadioGroup>

                    {paymentType === 'integral' ? (
                        <div className="space-y-2">
                            <Label htmlFor="paymentMethodIntegral">Forma de Pagamento</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                    <SelectItem value="PIX">PIX</SelectItem>
                                    <SelectItem value="Crédito">Cartão de Crédito</SelectItem>
                                    <SelectItem value="Débito">Cartão de Débito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-4 p-4 border rounded-md">
                            <div className="space-y-2">
                                <Label htmlFor="entryAmount">Valor de Entrada (Opcional)</Label>
                                <CurrencyInput id="entryAmount" value={entryAmount} onValueChange={setEntryAmount} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="installments">Nº de Parcelas</Label>
                                    <Input id="installments" type="number" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value, 10))} min={1} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="firstDueDate">1º Vencimento</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button id="firstDueDate" variant="outline" className={cn('w-full justify-start text-left font-normal', !firstDueDate && 'text-muted-foreground')}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {firstDueDate ? format(firstDueDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={firstDueDate} onSelect={setFirstDueDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="text-center text-sm text-muted-foreground mt-2">
                                <p>{installments}x de <span className="font-bold">R$ {((balanceDue - (Number(entryAmount) || 0)) / installments).toFixed(2)}</span></p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
                onClick={handleSave}
                className={isFinalizeMode ? 'bg-emerald-500 text-white hover:bg-emerald-600' : undefined}
            >
                {isFinalizeMode ? (
                    <>
                        <Check className="mr-2 h-4 w-4" />
                        Finalizar Ordem de Serviço
                    </>
                ) : (
                    'Confirmar Pagamento'
                )}
            </Button>
        </DialogFooter>
    </DialogContent>
  </Dialog>
  );
}

    

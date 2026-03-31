
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { FinancialTransaction } from '@/types';
import { Printer } from 'lucide-react';

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  type: 'receita' | 'despesa';
  onSave: (transaction: Omit<FinancialTransaction, 'id' | 'relatedSaleId' | 'relatedServiceOrderId'>, printReceipt: boolean) => void;
}

const initialFormState = {
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'Outra Receita' as FinancialTransaction['category'],
    paymentMethod: 'Dinheiro',
};

export function AddTransactionDialog({ isOpen, onOpenChange, type, onSave }: AddTransactionDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState(initialFormState);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialFormState,
        amount: 0,
        category: type === 'receita' ? 'Outra Receita' : 'Outra Despesa',
      });
    }
  }, [isOpen, type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleAmountChange = (value: number) => {
    setFormData(prev => ({...prev, amount: value}));
  };

  const handleSave = (printReceipt: boolean) => {
    if (!formData.description || formData.amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Campos Inválidos',
        description: 'Por favor, preencha a descrição e um valor maior que zero.',
      });
      return;
    }

    onSave({ ...formData, type }, printReceipt);
  };

  const title = type === 'receita' ? 'Adicionar Receita Avulsa' : 'Adicionar Nova Despesa';
  const description = type === 'receita' 
    ? 'Registre uma entrada de caixa que não seja de uma venda.' 
    : 'Registre uma saída de caixa.';

  const categories = type === 'receita'
    ? ['Venda de Produto', 'Venda de Serviço', 'Outra Receita']
    : ['Compra de Peça', 'Salário', 'Aluguel', 'Outra Despesa'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder={type === 'receita' ? 'Ex: Venda de sucata' : 'Ex: Compra de café'}
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <CurrencyInput
                id="amount"
                value={formData.amount}
                onValueChange={handleAmountChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => handleSelectChange('paymentMethod', value)}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                <SelectItem value="Transferência">Transferência Bancária</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSave(false)}>Salvar Lançamento</Button>
                <Button onClick={() => handleSave(true)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Salvar e Imprimir
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

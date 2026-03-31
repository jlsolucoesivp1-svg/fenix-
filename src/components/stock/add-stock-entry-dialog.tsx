
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
import type { StockItem } from '@/types';

interface AddStockEntryDialogProps {
  item: StockItem | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (itemId: string, quantity: number, cost: number) => void;
}

export function AddStockEntryDialog({ item, isOpen, onOpenChange, onSave }: AddStockEntryDialogProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [cost, setCost] = React.useState(0);

  React.useEffect(() => {
    if (isOpen && item) {
      setQuantity(1);
      setCost(item.costPrice || 0);
    }
  }, [isOpen, item]);

  const handleSave = () => {
    if (item) {
      onSave(item.id, quantity, cost);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
          <DialogDescription>
            Adicione novas unidades para o item: <span className="font-semibold">{item.name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Novo Preço de Custo (por unidade)</Label>
            <CurrencyInput id="cost" value={cost} onValueChange={setCost} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Entrada</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

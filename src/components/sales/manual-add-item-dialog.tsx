
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { SaleItem, StockItem } from '@/types';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

interface ManualAddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (item: Omit<SaleItem, 'id'> & { id?: string }) => void;
  stockItems?: StockItem[];
}

const initialItemState: Omit<SaleItem, 'id'> & { id?: string } = { name: '', price: 0, quantity: 1 };

export function ManualAddItemDialog({ isOpen, onOpenChange, onAddItem, stockItems = [] }: ManualAddItemDialogProps) {
  const [item, setItem] = React.useState<Omit<SaleItem, 'id'> & { id?: string }>(initialItemState);
  const [openCombobox, setOpenCombobox] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setItem(initialItemState);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setItem(prev => ({
      ...prev,
      [id]: value,
    }));
  };
  
  const handleNumericChange = (id: keyof SaleItem, value: number) => {
    setItem(prev => ({ ...prev, [id]: value }));
  }

  const handleUpdateQuantity = (value: string) => {
    const newQuantity = parseInt(value, 10);
    // Prevent NaN by defaulting to 0 if input is empty
    handleNumericChange('quantity', isNaN(newQuantity) ? 0 : newQuantity);
  };


  const handleAdd = () => {
    if (item.name && item.price > 0 && item.quantity > 0) {
      onAddItem(item);
      onOpenChange(false);
    }
  };
  
  const handleSelectProduct = (stockItem: StockItem) => {
    setItem({
        id: stockItem.id,
        name: stockItem.name,
        price: stockItem.price,
        quantity: 1
    });
    setOpenCombobox(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Item</DialogTitle>
          <DialogDescription>
            Busque um item no estoque ou insira os dados de um novo produto/serviço.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Produto no Estoque</Label>
             <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                        {item.name || "Selecione um produto..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar produto..." />
                        <CommandList>
                            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                            <CommandGroup>
                                {stockItems.map((stockItem) => (
                                    <CommandItem
                                        key={stockItem.id}
                                        value={stockItem.name}
                                        onSelect={() => handleSelectProduct(stockItem)}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", item.id === stockItem.id ? "opacity-100" : "opacity-0")} />
                                        {stockItem.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Descrição do Item (ou novo item)</Label>
            <Input id="name" placeholder="Ex: Formatação de PC" value={item.name} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="price">Preço Unitário (R$)</Label>
                <CurrencyInput id="price" value={item.price} onValueChange={(val) => handleNumericChange('price', val)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input id="quantity" type="number" value={item.quantity} onChange={(e) => handleUpdateQuantity(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAdd}>Adicionar à Venda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

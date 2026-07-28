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
import type { SaleItem, StockItem } from '@/types';
import { ProductAutocomplete } from '@/components/sales/product-autocomplete';
import { LocalAutocomplete } from '@/components/ui/local-autocomplete';

interface ManualAddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddItem: (item: Omit<SaleItem, 'id'> & { id?: string }) => void;
  stockItems?: StockItem[];
  searchFunction?: (query: string, limit: number) => Promise<StockItem[]>;
  addProductImmediately?: boolean;
}
const initialItemState: Omit<SaleItem, 'id'> & { id?: string } = { name: '', price: 0, quantity: 1 };

export function ManualAddItemDialog({ isOpen, onOpenChange, onAddItem, stockItems = [], searchFunction, addProductImmediately = false }: ManualAddItemDialogProps) {
  const [item, setItem] = React.useState<Omit<SaleItem, 'id'> & { id?: string }>(initialItemState);

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
    if (addProductImmediately) {
      onAddItem({ productId: stockItem.id, name: stockItem.name, price: stockItem.price, quantity: 1 });
      onOpenChange(false);
      return;
    }
    setItem({
        productId: stockItem.id,
        name: stockItem.name,
        price: stockItem.price,
        quantity: 1
    });
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
            {searchFunction ? (
              <ProductAutocomplete onSelect={handleSelectProduct} searchFunction={searchFunction} />
            ) : (
              <LocalAutocomplete
                items={stockItems}
                selectedItem={null}
                onSelect={(product) => product && handleSelectProduct(product)}
                getOption={(product) => ({ item: product, value: product.name, keywords: [product.category || '', product.barcode || ''] })}
                renderItem={(product) => <span>{product.name}</span>}
                placeholder="Buscar produto..."
                emptyMessage="Nenhum produto encontrado."
              />
            )}
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

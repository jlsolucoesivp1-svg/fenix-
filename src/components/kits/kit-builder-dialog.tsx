
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import type { Kit, KitItem, StockItem } from '@/types';
import { PlusCircle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KitBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  kit: Kit | null;
  stockItems: StockItem[];
  onSave: (kit: Kit) => void;
}

export function KitBuilderDialog({ isOpen, onOpenChange, kit, stockItems, onSave }: KitBuilderDialogProps) {
  const { toast } = useToast();
  const [kitName, setKitName] = React.useState('');
  const [kitItems, setKitItems] = React.useState<KitItem[]>([]);
  const [productSearch, setProductSearch] = React.useState('');
  const [openCombobox, setOpenCombobox] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (kit) {
        setKitName(kit.name);
        setKitItems(kit.items);
      } else {
        setKitName('');
        setKitItems([]);
      }
    }
  }, [kit, isOpen]);

  const handleAddItem = (stockItem: StockItem) => {
    setKitItems(prev => {
      const existing = prev.find(item => item.productId === stockItem.id);
      if (existing) {
        return prev.map(item =>
          item.productId === stockItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: stockItem.id, name: stockItem.name, quantity: 1 }];
    });
    setProductSearch('');
    setOpenCombobox(false);
  };

  const handleRemoveItem = (productId: string) => {
    setKitItems(kitItems.filter(item => item.productId !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) return handleRemoveItem(productId);
    setKitItems(kitItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ));
  };
  
  const handleSave = () => {
    if (!kitName) {
        toast({ variant: 'destructive', title: "Nome do kit é obrigatório" });
        return;
    }
    if (kitItems.length === 0) {
        toast({ variant: 'destructive', title: "O kit não pode estar vazio" });
        return;
    }
    const finalKit: Kit = {
        id: kit?.id || `KIT-${Date.now()}`,
        name: kitName,
        items: kitItems,
    };
    onSave(finalKit);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{kit ? 'Editar Kit' : 'Criar Novo Kit'}</DialogTitle>
          <DialogDescription>
            Defina o nome do kit e adicione os produtos que fazem parte dele.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-6 py-4 flex-grow min-h-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kitName">Nome do Kit</Label>
              <Input
                id="kitName"
                placeholder="Ex: Kit Gamer de Entrada"
                value={kitName}
                onChange={(e) => setKitName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Adicionar Peça ao Kit</Label>
               <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    Selecione um produto...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar produto..." />
                    <CommandList>
                      <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                      <CommandGroup>
                        {stockItems.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.name}
                            onSelect={() => handleAddItem(item)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                kitItems.some(i => i.productId === item.id) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {item.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <Label className="mb-2">Peças no Kit</Label>
            <div className="border rounded-md flex-grow relative">
                <ScrollArea className="absolute inset-0">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-24">Qtd.</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {kitItems.length > 0 ? kitItems.map(item => (
                        <TableRow key={item.productId}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                            <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value))}
                            className="h-8 w-16 text-center"
                            />
                        </TableCell>
                        <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
                            Adicione peças ao kit.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Kit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

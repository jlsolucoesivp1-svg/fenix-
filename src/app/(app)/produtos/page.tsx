
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, Search, MoreHorizontal, FileDown, Printer, ChevronDown, PackagePlus } from 'lucide-react';
import Link from 'next/link';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { getStock, saveStock } from '@/lib/storage';
import type { StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { EditStockItemDialog } from '@/components/stock/edit-stock-item-dialog';
import { AddStockEntryDialog } from '@/components/stock/add-stock-entry-dialog';
import { PrintLabelDialog } from '@/components/stock/print-label-dialog';

function ProductsComponent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = React.useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  
  const [selectedItem, setSelectedItem] = React.useState<StockItem | null>(null);

  React.useEffect(() => {
    const loadStock = async () => {
      setIsLoading(true);
      const stockData = await getStock();
      stockData.sort((a, b) => a.name.localeCompare(b.name));
      setStock(stockData);
      setIsLoading(false);
    };
    loadStock();

    const openNew = searchParams.get('new');
    if (openNew === 'true') {
      handleEdit(null);
    }
  }, [searchParams]);

  const filteredStock = React.useMemo(() => {
    if (!stock) return [];
    return stock.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stock, searchTerm]);

  const handleEdit = (item: StockItem | null) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };
  
  const handleSaveItem = async (itemToSave: StockItem) => {
    let updatedStock;
    if (stock.some(s => s.id === itemToSave.id)) {
      updatedStock = stock.map(s => s.id === itemToSave.id ? itemToSave : s);
    } else {
      updatedStock = [...stock, itemToSave];
    }
    updatedStock.sort((a, b) => a.name.localeCompare(b.name));
    setStock(updatedStock);
    await saveStock(updatedStock);
    toast({ title: 'Produto Salvo!', description: `${itemToSave.name} foi atualizado com sucesso.`});
    setIsEditDialogOpen(false);
  };

  const handleEntry = (item: StockItem) => {
    setSelectedItem(item);
    setIsEntryDialogOpen(true);
  };
  
  const handleSaveEntry = async (itemId: string, quantity: number, cost: number) => {
     const updatedStock = stock.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: (item.quantity || 0) + quantity,
          costPrice: cost
        };
      }
      return item;
    });

    setStock(updatedStock);
    await saveStock(updatedStock);
    toast({ title: 'Entrada Registrada!', description: `${quantity} unidade(s) adicionada(s) ao estoque.`});
    setIsEntryDialogOpen(false);
  };

  const handlePrint = (item: StockItem) => {
    setSelectedItem(item);
    setIsPrintDialogOpen(true);
  };

  if (isLoading) {
    return <div>Carregando produtos...</div>;
  }
  
  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Produtos e Estoque</CardTitle>
                <CardDescription>
                  Gerencie o catálogo de produtos e peças da sua loja.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/produtos/kits">
                    <PackagePlus className="h-4 w-4 mr-2" />
                    Gerenciar Kits
                  </Link>
                </Button>
                <Button size="sm" onClick={() => handleEdit(null)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>
           </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por nome, código ou categoria..."
                    className="w-full rounded-lg bg-background pl-8 md:w-1/3"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Qtd.</TableHead>
                <TableHead className="text-right">Preço de Venda</TableHead>
                <TableHead className="w-[64px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menu de Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                         <DropdownMenuItem onSelect={() => handleEntry(item)}>Registrar Entrada</DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handleEdit(item)}>Editar Produto</DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handlePrint(item)}>Imprimir Etiqueta</DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem className="text-destructive">Excluir Produto</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <EditStockItemDialog 
        item={selectedItem} 
        isOpen={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        onSave={handleSaveItem} 
      />

      <AddStockEntryDialog
        item={selectedItem}
        isOpen={isEntryDialogOpen}
        onOpenChange={setIsEntryDialogOpen}
        onSave={handleSaveEntry}
      />
      
      <PrintLabelDialog
        item={selectedItem}
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
      />
    </>
  );
}

export default function ProductsPage() {
    return (
        <React.Suspense fallback={<div>Carregando...</div>}>
            <ProductsComponent />
        </React.Suspense>
    )
}

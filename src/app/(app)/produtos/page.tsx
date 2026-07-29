'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MoreHorizontal, PackagePlus, PlusCircle } from 'lucide-react';
import { AddStockEntryDialog } from '@/components/stock/add-stock-entry-dialog';
import { EditStockItemDialog } from '@/components/stock/edit-stock-item-dialog';
import { PrintLabelDialog } from '@/components/stock/print-label-dialog';
import { DebouncedSearchInput } from '@/components/ui/debounced-search-input';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useToast } from '@/hooks/use-toast';
import type { StockItem } from '@/types';
import {
  createTenantProduct,
  deleteTenantProduct,
  getStock,
  listTenantProductsPage,
  registerTenantStockEntry,
  registrarDespesaEntradaEstoque,
  salvarItemEstoqueComFinanceiro,
  saveStock,
  updateTenantProduct,
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ModuleLoadingState, ModuleState } from '@/components/ui/module-state';

function ProductsComponent() {
  const { toast } = useToast();
  const session = useCurrentAppSession();
  const searchParams = useSearchParams();
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = React.useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<StockItem | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isPageLoading, setIsPageLoading] = React.useState(false);

  const useSaasProducts =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;

  const loadStock = React.useCallback(async (requestedPage = 1) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      if (useSaasProducts) {
        setIsPageLoading(true);
        const result = await listTenantProductsPage({ page: requestedPage, search: searchTerm });
        setStock(result.items);
        setPage(result.page);
        setTotalProducts(result.total);
        setTotalPages(result.totalPages);
      } else {
        const stockData = await getStock();
        stockData.sort((a, b) => a.name.localeCompare(b.name));
        setStock(stockData);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar os produtos.';
      setLoadError(message);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar produtos',
        description: message,
      });
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  }, [searchTerm, toast, useSaasProducts]);

  React.useEffect(() => {
    if (session.isLoading) {
      return;
    }

    const openNew = searchParams.get('new');
    if (openNew === 'true') {
      handleEdit(null);
    }
  }, [searchParams, session.isLoading]);

  const filteredStock = React.useMemo(() => {
    if (useSaasProducts) return stock;
    return stock.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, stock, useSaasProducts]);

  React.useEffect(() => {
    if (!session.isLoading && useSaasProducts) {
      void loadStock(1);
    }
  }, [loadStock, searchTerm, session.isLoading, useSaasProducts]);

  const handleEdit = (item: StockItem | null) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleSaveItem = async (itemToSave: StockItem) => {
    const existingItem = stock.find((item) => item.id === itemToSave.id);

    try {
      if (useSaasProducts) {
        const savedItem = existingItem
          ? await updateTenantProduct(itemToSave)
          : await createTenantProduct(itemToSave);

        const updatedStock = [...stock.filter((item) => item.id !== savedItem.id), savedItem].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setStock(updatedStock);
        void loadStock(page);
        toast({
          title: 'Produto salvo!',
          description: `${savedItem.name} foi atualizado com sucesso no modulo SaaS.`,
        });
      } else {
        const result = await salvarItemEstoqueComFinanceiro({
          item: itemToSave,
          previousQuantity: existingItem?.quantity || 0,
        });

        const updatedStock = [...result.updatedStock].sort((a, b) => a.name.localeCompare(b.name));
        setStock(updatedStock);
        toast({
          title: 'Produto Salvo!',
          description: result.transaction
            ? `${itemToSave.name} foi atualizado e a entrada foi lancada no financeiro.`
            : `${itemToSave.name} foi atualizado com sucesso.`,
        });
      }

      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar produto',
        description: error instanceof Error ? error.message : 'Nao foi possivel salvar o produto.',
      });
    }
  };

  const handleEntry = (item: StockItem) => {
    setSelectedItem(item);
    setIsEntryDialogOpen(true);
  };

  const handleSaveEntry = async (itemId: string, quantity: number, cost: number, entryId: string) => {
    try {
      if (useSaasProducts) {
        const result = await registerTenantStockEntry({ itemId, quantity, cost, entryId });
        const product = result.updatedStock.find((item) => item.id === itemId);

        setStock([...result.updatedStock].sort((a, b) => a.name.localeCompare(b.name)));
        void loadStock(page);
        toast({
          title: result.duplicated ? 'Entrada ja registrada' : 'Entrada registrada!',
          description: result.duplicated
            ? 'A operacao ja havia sido processada anteriormente.'
            : `${quantity} unidade(s) adicionada(s) ao estoque e despesa financeira registrada${product ? ` para ${product.name}` : ''}.`,
        });
      } else {
        const result = await registrarDespesaEntradaEstoque({ itemId, quantity, cost, entryId });
        const product = result.updatedStock.find((item) => item.id === itemId);

        setStock([...result.updatedStock].sort((a, b) => a.name.localeCompare(b.name)));
        toast({
          title: result.duplicated ? 'Entrada ja registrada' : 'Entrada Registrada!',
          description: result.duplicated
            ? 'A operacao ja havia sido processada anteriormente. Nenhum lancamento duplicado foi criado.'
            : `${quantity} unidade(s) adicionada(s) ao estoque e despesa financeira registrada${product ? ` para ${product.name}` : ''}.`,
        });
      }

      setIsEntryDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar entrada',
        description: error instanceof Error ? error.message : 'Nao foi possivel atualizar o estoque.',
      });
    }
  };

  const handlePrint = (item: StockItem) => {
    setSelectedItem(item);
    setIsPrintDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    const itemToDelete = stock.find((item) => item.id === itemId);

    if (useSaasProducts) {
      await deleteTenantProduct(itemId);
      const updatedStock = stock
        .filter((item) => item.id !== itemId)
        .sort((a, b) => a.name.localeCompare(b.name));
      setStock(updatedStock);
    } else {
      const updatedStock = stock
        .filter((item) => item.id !== itemId)
        .sort((a, b) => a.name.localeCompare(b.name));
      await saveStock(updatedStock);
      setStock(updatedStock);
    }

    toast({
      title: 'Produto excluido!',
      description: itemToDelete
        ? `${itemToDelete.name} foi removido do estoque.`
        : 'O produto foi removido do estoque.',
      variant: 'destructive',
    });
    if (useSaasProducts) void loadStock(page);
  };

  if (session.isLoading || isLoading) {
    return (
      <ModuleLoadingState
        title="Carregando produtos"
        description="Sincronizando catalogo e estoque do contexto atual."
      />
    );
  }

  if (loadError) {
    return (
      <ModuleState
        title="Nao foi possivel carregar produtos"
        description={loadError}
        tone="destructive"
        actionLabel="Tentar novamente"
        onAction={() => void loadStock()}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Produtos e Estoque</CardTitle>
              <CardDescription>
                {useSaasProducts
                  ? 'Gerencie o catalogo de produtos e o estoque do tenant SaaS atual.'
                  : 'Gerencie o catalogo de produtos e pecas da sua loja.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/produtos/kits">
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Gerenciar Kits
                </Link>
              </Button>
              <Button size="sm" onClick={() => handleEdit(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <DebouncedSearchInput
              defaultValue={searchTerm}
              onDebouncedChange={setSearchTerm}
              placeholder="Buscar por nome, codigo ou categoria..."
              className="w-full md:w-1/3"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Qtd.</TableHead>
                <TableHead className="text-right">Preco de Venda</TableHead>
                <TableHead className="w-[64px] text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menu de Acoes</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleEntry(item)}>Registrar Entrada</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleEdit(item)}>Editar Produto</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handlePrint(item)}>Imprimir Etiqueta</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(event) => event.preventDefault()}
                              className="text-destructive"
                            >
                              Excluir Produto
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acao removera permanentemente o produto do estoque.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-6">
                    <ModuleState
                      title="Nenhum produto encontrado"
                      description={
                        stock.length === 0
                          ? 'Ainda nao existem produtos cadastrados para o contexto atual.'
                          : 'A busca atual nao encontrou itens no catalogo.'
                      }
                      compact
                      actionLabel={stock.length === 0 ? 'Adicionar produto' : 'Limpar busca'}
                      onAction={stock.length === 0 ? () => handleEdit(null) : () => setSearchTerm('')}
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          {useSaasProducts ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{isPageLoading ? 'Carregando produtos...' : `${totalProducts} ${totalProducts === 1 ? 'produto' : 'produtos'} no resultado`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={isPageLoading || page <= 1} onClick={() => void loadStock(page - 1)}>Anterior</Button>
                <span>Pagina {page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={isPageLoading || page >= totalPages} onClick={() => void loadStock(page + 1)}>Proxima</Button>
              </div>
            </div>
          ) : null}
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
    <React.Suspense
      fallback={
        <ModuleLoadingState
          title="Carregando modulo de produtos"
          description="Preparando catalogo e estoque."
        />
      }
    >
      <ProductsComponent />
    </React.Suspense>
  );
}

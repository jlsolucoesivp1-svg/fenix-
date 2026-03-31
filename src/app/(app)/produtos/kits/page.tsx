
'use client';

import * as React from 'react';
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
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getKits, getStock, saveKits } from '@/lib/storage';
import type { Kit, StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { KitBuilderDialog } from '@/components/kits/kit-builder-dialog';

export default function KitsPage() {
  const { toast } = useToast();
  const [kits, setKits] = React.useState<Kit[]>([]);
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [editingKit, setEditingKit] = React.useState<Kit | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [kitsData, stockData] = await Promise.all([getKits(), getStock()]);
      setKits(kitsData);
      setStock(stockData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleOpenBuilder = (kit: Kit | null = null) => {
    setEditingKit(kit);
    setIsBuilderOpen(true);
  };

  const handleSaveKit = async (savedKit: Kit) => {
    let updatedKits;
    if (kits.some(k => k.id === savedKit.id)) {
      updatedKits = kits.map(k => (k.id === savedKit.id ? savedKit : k));
      toast({ title: 'Kit Atualizado!', description: `O kit ${savedKit.name} foi salvo.` });
    } else {
      updatedKits = [...kits, savedKit];
      toast({ title: 'Kit Criado!', description: `O kit ${savedKit.name} foi adicionado.` });
    }
    setKits(updatedKits);
    await saveKits(updatedKits);
    setIsBuilderOpen(false);
  };

  if (isLoading) {
    return <div>Carregando kits...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/produtos">
                    <ArrowLeft className="h-4 w-4"/>
                    <span className="sr-only">Voltar para Produtos</span>
                </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gerenciador de Kits</h1>
              <p className="text-muted-foreground">Crie e edite kits de produtos para agilizar seus orçamentos.</p>
            </div>
        </div>
        <Button onClick={() => handleOpenBuilder()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Kit
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Kits Cadastrados</CardTitle>
          <CardDescription>
            Aqui está a lista de todos os kits de produtos criados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Kit</TableHead>
                <TableHead>Nº de Itens</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kits.length > 0 ? (
                kits.map(kit => (
                  <TableRow key={kit.id}>
                    <TableCell className="font-medium">{kit.name}</TableCell>
                    <TableCell>{kit.items.length}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" onClick={() => handleOpenBuilder(kit)}>
                          Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum kit cadastrado. Clique em "Novo Kit" para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <KitBuilderDialog
        isOpen={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        kit={editingKit}
        stockItems={stock}
        onSave={handleSaveKit}
      />
    </>
  );
}

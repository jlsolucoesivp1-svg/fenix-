'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { KitBuilderDialog } from '@/components/kits/kit-builder-dialog';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useToast } from '@/hooks/use-toast';
import type { Kit, StockItem } from '@/types';
import { getKits, getStock, listTenantKits, listTenantProducts, saveKits, saveTenantKit } from '@/lib/storage';
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
import { ModuleLoadingState, ModuleState } from '@/components/ui/module-state';

export default function KitsPage() {
  const { toast } = useToast();
  const session = useCurrentAppSession();
  const [kits, setKits] = React.useState<Kit[]>([]);
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [editingKit, setEditingKit] = React.useState<Kit | null>(null);

  const useSaasKits =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;

  React.useEffect(() => {
    if (session.isLoading) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [kitsData, stockData] = useSaasKits
          ? await Promise.all([listTenantKits(), listTenantProducts()])
          : await Promise.all([getKits(), getStock()]);

        if (cancelled) return;
        setKits(kitsData);
        setStock(stockData);
      } catch (error) {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar kits',
            description: error instanceof Error ? error.message : 'Nao foi possivel carregar os kits.',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [session.isLoading, toast, useSaasKits]);

  const handleOpenBuilder = (kit: Kit | null = null) => {
    setEditingKit(kit);
    setIsBuilderOpen(true);
  };

  const handleSaveKit = async (savedKit: Kit) => {
    let updatedKits: Kit[];

    if (useSaasKits) {
      const persistedKit = await saveTenantKit(savedKit);
      updatedKits = kits.some((kit) => kit.id === persistedKit.id)
        ? kits.map((kit) => (kit.id === persistedKit.id ? persistedKit : kit))
        : [...kits, persistedKit];

      toast({
        title: kits.some((kit) => kit.id === persistedKit.id) ? 'Kit atualizado!' : 'Kit criado!',
        description: `O kit ${persistedKit.name} foi salvo no modulo SaaS.`,
      });
    } else {
      updatedKits = kits.some((kit) => kit.id === savedKit.id)
        ? kits.map((kit) => (kit.id === savedKit.id ? savedKit : kit))
        : [...kits, savedKit];
      await saveKits(updatedKits);

      toast({
        title: kits.some((kit) => kit.id === savedKit.id) ? 'Kit Atualizado!' : 'Kit Criado!',
        description: `O kit ${savedKit.name} foi salvo.`,
      });
    }

    setKits(updatedKits);
    setIsBuilderOpen(false);
  };

  if (session.isLoading || isLoading) {
    return (
      <ModuleLoadingState
        title="Carregando kits"
        description="Sincronizando kits e produtos do contexto atual."
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/produtos">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar para Produtos</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gerenciador de Kits</h1>
            <p className="text-muted-foreground">
              {useSaasKits
                ? 'Crie e edite kits de produtos usando o catalogo SaaS atual.'
                : 'Crie e edite kits de produtos para agilizar seus orcamentos.'}
            </p>
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
            Aqui esta a lista de todos os kits de produtos criados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Kit</TableHead>
                <TableHead>No de Itens</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kits.length > 0 ? (
                kits.map((kit) => (
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
                  <TableCell colSpan={3} className="p-6">
                    <ModuleState
                      title="Nenhum kit cadastrado"
                      description='Clique em "Novo Kit" para comecar a montar combinacoes de produtos.'
                      compact
                      actionLabel="Novo kit"
                      onAction={() => handleOpenBuilder()}
                    />
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

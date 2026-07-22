'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, PlusCircle, RefreshCw } from 'lucide-react';
import type { DashboardOverview, FinancialTransaction } from '@/types';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { TodayAppointments } from '@/components/dashboard/today-appointments';
import { PrintReceiptDialog } from '@/components/financials/print-receipt-dialog';
import { Button } from '@/components/ui/button';
import { ModuleLoadingState, ModuleState } from '@/components/ui/module-state';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useToast } from '@/hooks/use-toast';
import {
  criarLancamentoManual,
  getFinancialTransactions,
  getTenantDashboardOverview,
  saveFinancialTransactions,
  updateTenantAppointment,
} from '@/lib/storage';

const EMPTY_DASHBOARD_OVERVIEW: DashboardOverview = {
  totalCustomers: 0,
  activeOrders: 0,
  completedOrders: 0,
  todaysAppointments: [],
};

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const session = useCurrentAppSession();

  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = React.useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  const [transactionToPrint, setTransactionToPrint] = React.useState<FinancialTransaction | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  const [saasOverview, setSaasOverview] = React.useState<DashboardOverview>(EMPTY_DASHBOARD_OVERVIEW);
  const [isLoadingSaasOverview, setIsLoadingSaasOverview] = React.useState(false);
  const [dashboardError, setDashboardError] = React.useState<string | null>(null);

  const useSaasDashboard =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;

  const handleNewSale = () => {
    router.push('/vendas');
  };

  const shouldUseLegacyManualTransactionFallback = (error: unknown) => {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.message.includes('Falha na requisicao: 404') ||
      error.message.includes('Falha na requisicao: 405') ||
      error.message.includes('Failed to fetch')
    );
  };

  const handleAddTransactionLegacy = async (
    transaction: Omit<FinancialTransaction, 'id'>,
    shouldPrint: boolean
  ) => {
    const existingTransactions = await getFinancialTransactions();
    const newTransaction: FinancialTransaction = {
      ...transaction,
      id: `FIN-${Date.now()}`,
    };

    await saveFinancialTransactions([newTransaction, ...existingTransactions]);
    toast({
      title: `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} adicionada!`,
      description: `O lancamento de R$ ${transaction.amount.toFixed(2)} foi salvo.`,
    });
    setIsIncomeDialogOpen(false);
    setIsExpenseDialogOpen(false);

    if (shouldPrint) {
      setTransactionToPrint(newTransaction);
      setIsPrintDialogOpen(true);
    }

    window.dispatchEvent(new Event('storage-change-financialTransactions'));
  };

  const handleAddTransaction = async (
    transaction: Omit<FinancialTransaction, 'id'>,
    shouldPrint: boolean
  ) => {
    try {
      const result = await criarLancamentoManual({ transaction });

      toast({
        title: `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} adicionada!`,
        description: `O lancamento de R$ ${transaction.amount.toFixed(2)} foi salvo.`,
      });
      setIsIncomeDialogOpen(false);
      setIsExpenseDialogOpen(false);

      if (shouldPrint) {
        setTransactionToPrint(result.transaction);
        setIsPrintDialogOpen(true);
      }
    } catch (error) {
      if (!useSaasDashboard && shouldUseLegacyManualTransactionFallback(error)) {
        await handleAddTransactionLegacy(transaction, shouldPrint);
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao salvar lancamento',
        description: error instanceof Error ? error.message : 'Nao foi possivel salvar o lancamento.',
      });
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.key) return;

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = event.key.toUpperCase();

      if (event.key === 'F2') {
        event.preventDefault();
        handleNewSale();
      } else if (event.shiftKey && key === 'R') {
        event.preventDefault();
        setIsIncomeDialogOpen(true);
      } else if (event.shiftKey && key === 'D') {
        event.preventDefault();
        setIsExpenseDialogOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    if (!useSaasDashboard) {
      setSaasOverview(EMPTY_DASHBOARD_OVERVIEW);
      setDashboardError(null);
      return;
    }

    let cancelled = false;

    const loadOverview = async () => {
      try {
        setIsLoadingSaasOverview(true);
        setDashboardError(null);
        const overview = await getTenantDashboardOverview();
        if (!cancelled) {
          setSaasOverview(overview);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardError(
            error instanceof Error ? error.message : 'Nao foi possivel carregar o dashboard SaaS.'
          );
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar dashboard',
            description:
              error instanceof Error ? error.message : 'Nao foi possivel carregar o dashboard SaaS.',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSaasOverview(false);
        }
      }
    };

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [toast, useSaasDashboard]);

  const handleReloadOverview = React.useCallback(() => {
    if (!useSaasDashboard) {
      return;
    }

    setIsLoadingSaasOverview(true);
    setDashboardError(null);

    void getTenantDashboardOverview()
      .then((overview) => {
        setSaasOverview(overview);
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Nao foi possivel recarregar o dashboard SaaS.';
        setDashboardError(message);
        toast({
          variant: 'destructive',
          title: 'Erro ao recarregar dashboard',
          description: message,
        });
      })
      .finally(() => {
        setIsLoadingSaasOverview(false);
      });
  }, [toast, useSaasDashboard]);

  const handleSaasAppointmentStatus = async (
    appointmentId: string,
    newStatus: 'concluido' | 'cancelado'
  ) => {
    const appointment = saasOverview.todaysAppointments.find((item) => item.id === appointmentId);
    if (!appointment) {
      return;
    }

    await updateTenantAppointment({
      ...appointment,
      extendedProps: {
        ...appointment.extendedProps,
        status: newStatus,
      },
    });

    setSaasOverview((current) => ({
      ...current,
      todaysAppointments: current.todaysAppointments.filter((item) => item.id !== appointmentId),
    }));

    toast({
      title: 'Status atualizado!',
      description: `O agendamento foi marcado como ${
        newStatus === 'concluido' ? 'concluido' : 'cancelado'
      }.`,
    });
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Visao geral do seu negocio em tempo real.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleNewSale}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Venda
              <kbd className="ml-4 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 md:inline-flex">
                F2
              </kbd>
            </Button>
            {useSaasDashboard ? (
              <Button variant="outline" onClick={handleReloadOverview} disabled={isLoadingSaasOverview}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Painel
              </Button>
            ) : null}

            <Button
              variant="outline"
              className="border-green-700 bg-green-600 text-white hover:bg-green-700"
              onClick={() => setIsIncomeDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Receita
              <kbd className="ml-4 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-green-500 px-1.5 font-mono text-[10px] font-medium text-white opacity-100 md:inline-flex">
                Shift+R
              </kbd>
            </Button>

            <Button variant="destructive" onClick={() => setIsExpenseDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
              <kbd className="ml-4 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-red-700 px-1.5 font-mono text-[10px] font-medium text-white opacity-100 md:inline-flex">
                Shift+D
              </kbd>
            </Button>
          </div>
        </div>

        {useSaasDashboard ? (
          <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 text-sm shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">Painel do tenant atual</p>
                <p className="text-muted-foreground">
                  Indicadores sincronizados diretamente da empresa ativa no runtime SaaS.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Empresa ativa: {session.tenantAccess?.company?.tradeName || session.tenantAccess?.activeCompanyId}
              </p>
            </div>
          </div>
        ) : null}

        {useSaasDashboard && dashboardError ? (
          <ModuleState
            title="Nao foi possivel carregar o dashboard SaaS"
            description={dashboardError}
            icon={AlertCircle}
            tone="destructive"
            actionLabel="Tentar novamente"
            onAction={handleReloadOverview}
          />
        ) : null}

        {useSaasDashboard && isLoadingSaasOverview && !dashboardError ? (
          <ModuleLoadingState
            title="Atualizando indicadores do dashboard"
            description="Buscando clientes, ordens de servico e agenda do tenant atual."
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCards
            stats={
              useSaasDashboard
                ? {
                    totalCustomers: saasOverview.totalCustomers,
                    activeOrders: saasOverview.activeOrders,
                    completedOrders: saasOverview.completedOrders,
                    lowStockItems: 0,
                  }
                : undefined
            }
            isLoading={useSaasDashboard && (session.isLoading || isLoadingSaasOverview)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-8">
          <div className="lg:col-span-2">
            <TodayAppointments
              appointments={useSaasDashboard ? saasOverview.todaysAppointments : undefined}
              isLoading={useSaasDashboard && (session.isLoading || isLoadingSaasOverview)}
              onUpdateStatus={useSaasDashboard ? handleSaasAppointmentStatus : undefined}
            />
          </div>
        </div>
      </div>

      <AddTransactionDialog
        isOpen={isIncomeDialogOpen}
        onOpenChange={setIsIncomeDialogOpen}
        type="receita"
        onSave={handleAddTransaction}
      />

      <AddTransactionDialog
        isOpen={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        type="despesa"
        onSave={handleAddTransaction}
      />

      <PrintReceiptDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        transaction={transactionToPrint}
      />
    </>
  );
}

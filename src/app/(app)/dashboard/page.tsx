'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { TodayAppointments } from '@/components/dashboard/today-appointments';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog';
import { getFinancialTransactions, saveFinancialTransactions } from '@/lib/storage';
import { FinancialTransaction } from '@/types';
import { PrintReceiptDialog } from '@/components/financials/print-receipt-dialog';


export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = React.useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  const [transactionToPrint, setTransactionToPrint] = React.useState<FinancialTransaction | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);

  const handleNewSale = () => {
    router.push('/vendas');
  };
  
  const handleAddTransaction = async (transaction: Omit<FinancialTransaction, 'id'>, shouldPrint: boolean) => {
    const existingTransactions = await getFinancialTransactions();
    const newTransaction: FinancialTransaction = {
      ...transaction,
      id: `FIN-${Date.now()}`
    };
    await saveFinancialTransactions([newTransaction, ...existingTransactions]);
    toast({
      title: `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} adicionada!`,
      description: `O lançamento de R$ ${transaction.amount.toFixed(2)} foi salvo.`
    });
    setIsIncomeDialogOpen(false);
    setIsExpenseDialogOpen(false);
    
    if (shouldPrint) {
      setTransactionToPrint(newTransaction);
      setIsPrintDialogOpen(true);
    }
    // Disparar evento para que outros componentes (como a lista de transações) possam recarregar
    window.dispatchEvent(new Event('storage-change-financialTransactions'));
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
  }, [toast, router]);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do seu negócio em tempo real.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleNewSale}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Venda
              <kbd className="ml-4 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 md:inline-flex">
                F2
              </kbd>
            </Button>
            <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-green-700" onClick={() => setIsIncomeDialogOpen(true)}>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCards />
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-8">
          <div className="lg:col-span-2">
            <TodayAppointments />
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

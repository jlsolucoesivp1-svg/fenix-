'use client';

import * as React from 'react';
import { Mail, MapPin, MoreHorizontal, Phone, PlusCircle, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EditCustomerDialog } from '@/components/customers/edit-customer-dialog';
import { CustomerAutocomplete } from '@/components/customers/customer-autocomplete';
import { CustomerFormFields } from '@/components/customers/customer-form-fields';
import { CustomerFilesPanel } from '@/components/customers/customer-files-panel';
import { ServiceHistory } from '@/components/customers/service-history';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { useToast } from '@/hooks/use-toast';
import type { Customer, ServiceOrder } from '@/types';
import {
  createTenantCustomer,
  deleteTenantCustomer,
  getCustomers,
  getServiceOrders,
  listTenantCustomersPage,
  saveCustomers,
  searchTenantCustomers,
  updateTenantCustomer,
} from '@/lib/storage';
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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModuleLoadingState, ModuleState } from '@/components/ui/module-state';
import { Input } from '@/components/ui/input';

const initialNewCustomerState: Omit<Customer, 'id'> = {
  name: '',
  phone: '',
  email: '',
  address: '',
  document: '',
  cep: '',
};

const sortCustomersByName = (items: Customer[]) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const session = useCurrentAppSession();

  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [serviceOrders, setServiceOrders] = React.useState<ServiceOrder[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [customerServiceHistory, setCustomerServiceHistory] = React.useState<ServiceOrder[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState(initialNewCustomerState);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalCustomers, setTotalCustomers] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [listSearch, setListSearch] = React.useState('');
  const [isPageLoading, setIsPageLoading] = React.useState(false);

  const useSaasCustomers =
    session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;

  const loadSaasCustomersPage = React.useCallback(async (requestedPage: number, search = '') => {
    setIsPageLoading(true);
    try {
      const result = await listTenantCustomersPage({ page: requestedPage, search });
      setCustomers(result.items);
      setPage(result.page);
      setTotalCustomers(result.total);
      setTotalPages(result.totalPages);
      setServiceOrders([]);
      return result;
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      if (useSaasCustomers) {
        await loadSaasCustomersPage(1);
        return;
      }

      const [customersData, serviceOrdersData] = await Promise.all([getCustomers(), getServiceOrders()]);
      setCustomers(sortCustomersByName(customersData));
      setServiceOrders(serviceOrdersData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel carregar os clientes.';
      setLoadError(message);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar clientes',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadSaasCustomersPage, toast, useSaasCustomers]);

  React.useEffect(() => {
    if (session.isLoading) {
      return;
    }

    void loadData();
  }, [loadData, session.isLoading]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key &&
        event.key.toLowerCase() === 'n' &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !event.metaKey
      ) {
        const target = event.target as HTMLElement;
        if (
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          target.tagName !== 'SELECT' &&
          !target.isContentEditable
        ) {
          event.preventDefault();
          setIsAddCustomerDialogOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    if (!isAddCustomerDialogOpen) {
      setNewCustomer(initialNewCustomerState);
    }
  }, [isAddCustomerDialogOpen]);

  const handleSelectCustomer = React.useCallback(
    async (customer: Customer | null) => {
      setSelectedCustomer(customer);

      if (!customer) {
        setCustomerServiceHistory([]);
        return;
      }

      if (useSaasCustomers) {
        const result = await loadSaasCustomersPage(1, customer.name);
        setSelectedCustomer(result.items.find((item) => item.id === customer.id) ?? null);
        return;
      }

      const history = serviceOrders
        .filter((order: any) => {
          if (order.customerId) {
            return order.customerId === customer.id;
          }

          const orderCustomerName = order.customerName || order.client?.name;
          return orderCustomerName && orderCustomerName.toLowerCase() === customer.name.toLowerCase();
        })
        .sort((a, b) => {
          const dateA = new Date(a.date || (a as any).entryDate).getTime();
          const dateB = new Date(b.date || (b as any).entryDate).getTime();
          return dateB - dateA;
        });

      setCustomerServiceHistory(history);
    },
    [loadSaasCustomersPage, serviceOrders, useSaasCustomers]
  );

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    if (useSaasCustomers) {
      const savedCustomer = await updateTenantCustomer(updatedCustomer);
      setCustomers((current) => current.map((customer) => (customer.id === savedCustomer.id ? savedCustomer : customer)));
      setSelectedCustomer(savedCustomer);
    } else {
      const updatedCustomers = sortCustomersByName(
        customers.map((customer) => (customer.id === updatedCustomer.id ? updatedCustomer : customer))
      );

      await saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
      setSelectedCustomer(updatedCustomer);
    }

    toast({
      title: 'Cliente atualizado!',
      description: `Os dados de ${updatedCustomer.name} foram salvos.`,
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (useSaasCustomers) {
      await deleteTenantCustomer(customerId);
    } else {
      const updatedCustomers = customers.filter((customer) => customer.id !== customerId);
      await saveCustomers(updatedCustomers);
    }

    setCustomers((current) => current.filter((customer) => customer.id !== customerId));
    setSelectedCustomer(null);
    setCustomerServiceHistory([]);
    toast({
      title: 'Cliente excluido!',
      description: 'O cliente foi removido do sistema.',
      variant: 'destructive',
    });

    if (useSaasCustomers) {
      await loadSaasCustomersPage(Math.min(page, totalPages));
    }
  };

  const handleOpenServiceOrder = () => {
    if (selectedCustomer && !useSaasCustomers) {
      router.push(`/ordens-de-servico?customerId=${selectedCustomer.id}`);
    }
  };

  const handleSaveCustomer = async () => {
    if (!newCustomer.name) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatorio',
        description: 'O nome do cliente precisa ser preenchido.',
      });
      return;
    }

    if (useSaasCustomers) {
      const customerToAdd = await createTenantCustomer(newCustomer);
      await loadSaasCustomersPage(1, '');
      setListSearch('');
      setSelectedCustomer(customerToAdd);

      toast({
        title: 'Cliente salvo!',
        description: `${customerToAdd.name} foi adicionado com sucesso no modulo SaaS.`,
      });
    } else {
      const customerToAdd: Customer = {
        ...newCustomer,
        id: `CUST-${Date.now()}`,
      };

      const updatedCustomers = sortCustomersByName([...customers, customerToAdd]);
      await saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);

      toast({
        title: 'Cliente salvo!',
        description: `${customerToAdd.name} foi adicionado com sucesso.`,
      });
    }

    setIsAddCustomerDialogOpen(false);
  };

  if (session.isLoading || isLoading) {
    return (
      <ModuleLoadingState
        title="Carregando clientes"
        description="Sincronizando cadastro e dados do contexto atual."
      />
    );
  }

  if (loadError) {
    return (
      <ModuleState
        title="Nao foi possivel carregar clientes"
        description={loadError}
        tone="destructive"
        actionLabel="Tentar novamente"
        onAction={() => void loadData()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>
                {useSaasCustomers
                  ? 'Modulo de clientes rodando sobre o tenant SaaS atual.'
                  : 'Gerencie seus clientes e consulte o historico de atendimentos.'}
              </CardDescription>
            </div>
            <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Cliente
                  <kbd className="ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    N
                  </kbd>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo cliente abaixo.
                  </DialogDescription>
                </DialogHeader>
                <CustomerFormFields value={newCustomer} onChange={setNewCustomer} />
                <DialogFooter className="justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsAddCustomerDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveCustomer}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <CustomerAutocomplete
              selectedCustomer={selectedCustomer}
              onSelect={(customer) => {
                if (!customer) {
                  void handleSelectCustomer(null);
                  return;
                }

                const fullCustomer = customers.find((item) => item.id === customer.id) ?? null;
                if (fullCustomer) {
                  void handleSelectCustomer(fullCustomer);
                  return;
                }

                void handleSelectCustomer(customer as Customer);
              }}
              searchFunction={useSaasCustomers ? searchTenantCustomers : undefined}
              placeholder="Digite para buscar clientes em tempo real..."
              emptyMessage="Nenhum cliente encontrado."
              className="w-full md:w-[400px]"
            />
          </div>

          {useSaasCustomers ? (
            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  value={listSearch}
                  onChange={(event) => setListSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void loadSaasCustomersPage(1, listSearch);
                    }
                  }}
                  placeholder="Filtrar por nome, documento, telefone ou e-mail"
                  className="sm:max-w-md"
                />
                <Button variant="outline" onClick={() => void loadSaasCustomersPage(1, listSearch)} disabled={isPageLoading}>
                  {isPageLoading ? 'Carregando...' : 'Buscar'}
                </Button>
              </div>

              <div className="rounded-md border">
                {isPageLoading ? (
                  <p className="p-4 text-sm text-muted-foreground">Carregando clientes...</p>
                ) : customers.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                ) : (
                  <div className="divide-y">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-4 p-3 text-left hover:bg-muted/50"
                        onClick={() => void handleSelectCustomer(customer)}
                      >
                        <span>
                          <span className="block font-medium">{customer.name}</span>
                          <span className="block text-sm text-muted-foreground">
                            {customer.document || customer.phone || customer.email || 'Sem contato informado'}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">Ver detalhes</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>{totalCustomers} {totalCustomers === 1 ? 'cliente' : 'clientes'} no resultado</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadSaasCustomersPage(page - 1, listSearch)}
                    disabled={isPageLoading || page <= 1}
                  >
                    Anterior
                  </Button>
                  <span>Pagina {page} de {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadSaasCustomersPage(page + 1, listSearch)}
                    disabled={isPageLoading || page >= totalPages}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedCustomer ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dados do Cliente</CardTitle>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                      Editar Cliente
                    </DropdownMenuItem>
                    {!useSaasCustomers ? (
                      <DropdownMenuItem onSelect={handleOpenServiceOrder}>
                        Abrir Nova Ordem de Servico
                      </DropdownMenuItem>
                    ) : null}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(event) => event.preventDefault()}
                          className="text-destructive"
                        >
                          Excluir Cliente
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Voce tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa acao nao pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCustomer(selectedCustomer.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{selectedCustomer.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{selectedCustomer.phone || 'Nao informado'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>{selectedCustomer.email || 'Nao informado'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                  <span className="flex-1">{selectedCustomer.address || 'Nao informado'}</span>
                </div>
                {selectedCustomer.cep ? (
                  <div className="text-sm text-muted-foreground">CEP: {selectedCustomer.cep}</div>
                ) : null}
                {selectedCustomer.document ? (
                  <div className="text-sm text-muted-foreground">
                    Documento: {selectedCustomer.document}
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                {useSaasCustomers
                  ? 'Historico de OS SaaS sera integrado na proxima etapa.'
                  : `Ultimo atendimento em: ${
                      customerServiceHistory.length > 0
                        ? new Date(
                            customerServiceHistory[0].date || (customerServiceHistory[0] as any).entryDate
                          ).toLocaleDateString('pt-BR')
                        : 'Nenhum'
                    }`}
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-2">
            {useSaasCustomers ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Historico de Atendimentos</CardTitle>
                    <CardDescription>
                      O CRUD de clientes ja esta no runtime SaaS. O historico de OS permanece no legado
                      ate a migracao do modulo correspondente.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos do Cliente</CardTitle>
                    <CardDescription>
                      Arquivos privados armazenados no bucket `customer-files` do tenant atual.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CustomerFilesPanel customerId={selectedCustomer.id} enabled />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <ServiceHistory history={customerServiceHistory} />
            )}
          </div>
        </div>
      ) : (
        <Card className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Nenhum cliente selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um cliente acima para ver seus dados
              {useSaasCustomers ? ' no tenant atual.' : ' e historico.'}
            </p>
          </CardContent>
        </Card>
      )}

      {selectedCustomer ? (
        <EditCustomerDialog
          customer={selectedCustomer}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleUpdateCustomer}
        />
      ) : null}
    </div>
  );
}

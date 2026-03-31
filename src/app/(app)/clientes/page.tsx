'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, Check, ChevronsUpDown, User, Phone, Mail, MapPin, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { getCustomers, getServiceOrders, saveCustomers } from '@/lib/storage';
import type { Customer, ServiceOrder } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EditCustomerDialog } from '@/components/customers/edit-customer-dialog';
import { ServiceHistory } from '@/components/customers/service-history';
import { CustomerFormFields } from '@/components/customers/customer-form-fields';

const initialNewCustomerState: Omit<Customer, 'id'> = {
  name: '',
  phone: '',
  email: '',
  address: '',
  document: '',
  cep: '',
};

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [serviceOrders, setServiceOrders] = React.useState<ServiceOrder[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [customerServiceHistory, setCustomerServiceHistory] = React.useState<ServiceOrder[]>([]);
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState(initialNewCustomerState);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [customersData, serviceOrdersData] = await Promise.all([
        getCustomers(),
        getServiceOrders(),
      ]);
      customersData.sort((a, b) => a.name.localeCompare(b.name));
      setCustomers(customersData);
      setServiceOrders(serviceOrdersData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key && event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT' && !target.isContentEditable) {
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

  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      const history = serviceOrders.filter(
        (order: any) => {
          if (order.customerId) {
            return order.customerId === customer.id;
          }
          const orderCustomerName = order.customerName || order.client?.name;
          return orderCustomerName && orderCustomerName.toLowerCase() === customer.name.toLowerCase();
        }
      ).sort((a, b) => {
        const dateA = new Date(a.date || (a as any).entryDate).getTime();
        const dateB = new Date(b.date || (b as any).entryDate).getTime();
        return dateB - dateA;
      });
      setCustomerServiceHistory(history);
    } else {
      setCustomerServiceHistory([]);
    }
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    const updatedCustomers = customers.map((customer) => (
      customer.id === updatedCustomer.id ? updatedCustomer : customer
    ));
    updatedCustomers.sort((a, b) => a.name.localeCompare(b.name));
    await saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);
    setSelectedCustomer(updatedCustomer);
    toast({
      title: 'Cliente atualizado!',
      description: `Os dados de ${updatedCustomer.name} foram salvos.`,
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const updatedCustomers = customers.filter((customer) => customer.id !== customerId);
    await saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);
    setSelectedCustomer(null);
    setCustomerServiceHistory([]);
    toast({
      title: 'Cliente excluido!',
      description: 'O cliente foi removido do sistema.',
      variant: 'destructive',
    });
  };

  const handleOpenServiceOrder = () => {
    if (selectedCustomer) {
      router.push(`/ordens-de-servico?customerId=${selectedCustomer.id}`);
    }
  };

  const handleSaveCustomer = async (generateOsAfterSave = false) => {
    if (!newCustomer.name) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatorio',
        description: 'O nome do cliente precisa ser preenchido.',
      });
      return;
    }

    const customerToAdd: Customer = {
      ...newCustomer,
      id: `CUST-${Date.now()}`,
    };

    const updatedCustomers = [...customers, customerToAdd];
    updatedCustomers.sort((a, b) => a.name.localeCompare(b.name));
    await saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);

    toast({
      title: 'Cliente salvo!',
      description: `${customerToAdd.name} foi adicionado com sucesso.`,
    });

    setIsAddCustomerDialogOpen(false);

    if (generateOsAfterSave) {
      router.push(`/ordens-de-servico?customerId=${customerToAdd.id}`);
    }
  };

  if (isLoading) {
    return <div>Carregando clientes...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>
                Gerencie seus clientes e consulte o historico de atendimentos.
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
                  <Button variant="ghost" onClick={() => setIsAddCustomerDialogOpen(false)}>Cancelar</Button>
                  <Button variant="outline" onClick={() => handleSaveCustomer(false)}>Salvar</Button>
                  <Button onClick={() => handleSaveCustomer(true)}>Salvar e Gerar OS</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between md:w-[400px]"
                >
                  {selectedCustomer ? selectedCustomer.name : 'Selecione ou pesquise um cliente...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Procurar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.name}
                          onSelect={(currentValue) => {
                            const selected = customers.find((item) => item.name.toLowerCase() === currentValue.toLowerCase());
                            handleSelectCustomer(selected || null);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCustomer?.name.toLowerCase() === customer.name.toLowerCase() ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {customer.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {selectedCustomer ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dados do Cliente</CardTitle>
                <DropdownMenu>
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
                    <DropdownMenuItem onSelect={handleOpenServiceOrder}>
                      Abrir Nova Ordem de Servico
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                          Excluir Cliente
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Voce tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa acao nao pode ser desfeita. Isso excluira permanentemente o cliente e todo seu historico de atendimentos.
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
                  <div className="text-sm text-muted-foreground">
                    CEP: {selectedCustomer.cep}
                  </div>
                ) : null}
                {selectedCustomer.document ? (
                  <div className="text-sm text-muted-foreground">
                    Documento: {selectedCustomer.document}
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Ultimo atendimento em: {customerServiceHistory.length > 0 ? new Date(customerServiceHistory[0].date || (customerServiceHistory[0] as any).entryDate).toLocaleDateString('pt-BR') : 'Nenhum'}
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <ServiceHistory history={customerServiceHistory} />
          </div>
        </div>
      ) : (
        <Card className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Nenhum cliente selecionado</h3>
            <p className="text-muted-foreground">Selecione um cliente acima para ver seus dados e historico.</p>
          </CardContent>
        </Card>
      )}

      {selectedCustomer && (
        <EditCustomerDialog
          customer={selectedCustomer}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleUpdateCustomer}
        />
      )}
    </div>
  );
}

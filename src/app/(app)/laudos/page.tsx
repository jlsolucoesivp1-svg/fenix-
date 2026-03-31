
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getCustomers, getServiceOrders, saveServiceOrders, getCompanyInfo } from '@/lib/storage';
import type { Customer, ServiceOrder, CompanyInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Printer, User, HardDrive, Save } from 'lucide-react';
import { generateLaudoPdf } from '@/lib/pdf-generators/laudo-pdf-generator';


export default function LaudosPage() {
  const { toast } = useToast();
  const { user: currentUser } = useCurrentUser();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [serviceOrders, setServiceOrders] = React.useState<ServiceOrder[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [laudoText, setLaudoText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [customersData, ordersData] = await Promise.all([getCustomers(), getServiceOrders()]);
      setCustomers(customersData);
      setServiceOrders(ordersData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedOrderId(null);
    setLaudoText('');
  };

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = serviceOrders.find(o => o.id === orderId);
    // Pre-fill laudo text with technical report if it exists
    setLaudoText(order?.technicalReport || '');
  };

  const filteredOrders = React.useMemo(() => {
    if (!selectedCustomerId) return [];
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return [];
    return serviceOrders.filter(o => o.customerName === customer.name);
  }, [selectedCustomerId, customers, serviceOrders]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedOrder = serviceOrders.find(o => o.id === selectedOrderId);
  
  const handleSaveLaudo = async () => {
    if (!selectedOrderId || !laudoText) {
      toast({
        variant: 'destructive',
        title: 'Dados Incompletos',
        description: 'Selecione uma OS e preencha o laudo para salvar.',
      });
      return;
    }
    
    const updatedOrders = serviceOrders.map(order => 
      order.id === selectedOrderId ? { ...order, technicalReport: laudoText } : order
    );
    
    await saveServiceOrders(updatedOrders);
    setServiceOrders(updatedOrders);
    
    toast({
      title: 'Laudo Salvo!',
      description: 'O laudo técnico foi salvo na Ordem de Serviço.',
    });
  };

  const generatePdf = async () => {
    if (!selectedCustomer || !selectedOrder || !currentUser) {
      toast({
        variant: 'destructive',
        title: 'Dados Incompletos',
        description: 'Selecione um cliente, uma OS e certifique-se de estar logado.',
      });
      return;
    }
    await generateLaudoPdf(selectedOrder, selectedCustomer, currentUser);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerador de Laudos Técnicos</CardTitle>
        <CardDescription>
          Selecione o cliente e a ordem de serviço para gerar ou editar um laudo técnico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="customer-select">1. Selecione o Cliente</Label>
            <Select onValueChange={handleCustomerChange} value={selectedCustomerId || ''}>
              <SelectTrigger id="customer-select" disabled={isLoading}>
                <SelectValue placeholder={isLoading ? 'Carregando...' : 'Selecione...'} />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-select">2. Selecione a Ordem de Serviço</Label>
            <Select onValueChange={handleOrderChange} value={selectedOrderId || ''} disabled={!selectedCustomerId || filteredOrders.length === 0}>
              <SelectTrigger id="order-select">
                <SelectValue placeholder={!selectedCustomerId ? 'Aguardando cliente...' : filteredOrders.length === 0 ? 'Nenhuma OS encontrada' : 'Selecione a OS...'} />
              </SelectTrigger>
              <SelectContent>
                {filteredOrders.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    OS #{o.id.slice(-4)} - {typeof o.equipment === 'string' ? o.equipment : o.equipment.type} - {new Date(o.date).toLocaleDateString('pt-BR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCustomer && selectedOrder && (
          <div className="p-4 border rounded-lg bg-muted/30 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.document || 'Documento não informado'}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
               <HardDrive className="h-5 w-5 text-muted-foreground mt-1" />
               <div>
                  <p className="font-semibold">{typeof selectedOrder.equipment === 'string' ? selectedOrder.equipment : `${selectedOrder.equipment.type} ${selectedOrder.equipment.brand}`}</p>
                  <p className="text-sm text-muted-foreground">OS #{selectedOrder.id.slice(-4)}</p>
                  <p className="text-sm text-muted-foreground">Entrada: {new Date(selectedOrder.date).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="laudo-text">3. Conteúdo do Laudo Técnico</Label>
          <Textarea
            id="laudo-text"
            rows={15}
            placeholder="Digite aqui a análise técnica, os procedimentos realizados, as peças trocadas e a conclusão do laudo..."
            value={laudoText}
            onChange={e => setLaudoText(e.target.value)}
            disabled={!selectedOrderId}
          />
        </div>

        <div className="flex justify-end gap-2">
           <Button variant="secondary" onClick={handleSaveLaudo} disabled={!laudoText.trim()}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Laudo na OS
          </Button>
          <Button onClick={generatePdf} disabled={!laudoText.trim()}>
            <Printer className="mr-2 h-4 w-4" />
            Gerar e Visualizar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

    
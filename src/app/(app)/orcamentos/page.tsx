'use client';

import * as React from 'react';
import { MoreHorizontal, FileText, ShoppingCart, Printer, PlusCircle, ArrowLeft, Trash2, ScanLine, UserPlus, ChevronsUpDown, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input, CurrencyInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    createTenantCustomer,
    createTenantQuote,
    deleteTenantQuote,
    getCompanyInfo,
    getCustomers,
    finalizarVenda,
    getFinancialTransactions,
    getKits,
    getQuotes,
    getSales,
    getStock,
    getTenantCompanyInfo,
    listTenantCustomers,
    listTenantKits,
    listTenantProducts,
    listTenantQuotes,
    saveCustomers,
    saveFinancialTransactions,
    saveQuotes,
    saveSales,
    searchTenantCustomers,
    updateTenantQuote,
} from '@/lib/storage';
import type { Quote, Sale, FinancialTransaction, Customer, StockItem, SaleItem, Kit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { addDays } from 'date-fns';
import { ManualAddItemDialog } from '@/components/sales/manual-add-item-dialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Textarea } from '@/components/ui/textarea';
import { CustomerAutocomplete } from '@/components/customers/customer-autocomplete';
import { DebouncedSearchInput } from '@/components/ui/debounced-search-input';
import { ModuleLoadingState, ModuleState } from '@/components/ui/module-state';

// --- Helper Functions ---

const DEFAULT_QUOTE_VALIDITY_DAYS = 3;

const formatDate = (dateString: string) => {
    if (!dateString) return 'Data inválida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const resolveQuoteValidityDays = (quote?: Quote | null) => {
    if (!quote) return DEFAULT_QUOTE_VALIDITY_DAYS;

    const storedDays = quote.validityDays ?? quote.dias_validade;
    if (typeof storedDays === 'number' && Number.isFinite(storedDays) && storedDays > 0) {
        return Math.floor(storedDays);
    }

    if (quote.date && (quote.validUntil || quote.data_vencimento)) {
        const startDate = new Date(`${quote.date}T00:00:00`);
        const endDate = new Date(`${quote.validUntil || quote.data_vencimento}T00:00:00`);
        const diffInDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (Number.isFinite(diffInDays) && diffInDays > 0) {
            return diffInDays;
        }
    }

    return DEFAULT_QUOTE_VALIDITY_DAYS;
};

const buildQuoteValidUntil = (quoteDate: string, validityDays: number) =>
    addDays(new Date(`${quoteDate}T00:00:00`), validityDays).toISOString().split('T')[0];

const parseCustomerAddress = (customer: Customer) => {
    const rawAddress = (customer.address || '').trim();
    const [streetSection = '', localitySection = ''] = rawAddress.split('|').map((part) => part.trim());
    const [district = '', city = '', state = ''] = localitySection.split('-').map((part) => part.trim()).filter(Boolean);

    return {
        addressLine: [streetSection, district].filter(Boolean).join(' - ') || rawAddress || 'Não informado',
        cityLine: [city, state].filter(Boolean).join(' - '),
        cepLine: customer.cep ? `CEP: ${customer.cep}` : '',
    };
};

const getStatusVariant = (status: Quote['status']) => {
    switch (status) {
        case 'Pendente': return 'bg-yellow-500/20 text-yellow-400';
        case 'Aprovado': return 'bg-green-500/20 text-green-400';
        case 'Cancelado': return 'bg-red-500/20 text-red-400';
        case 'Vendido': return 'bg-purple-500/20 text-purple-400';
        default: return 'bg-gray-700/50 text-gray-300';
    }
};

const loadImageAsDataUrl = (url: string | undefined): Promise<string | null> => {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = () => {
      console.warn(`Could not load image for PDF from: ${url}`);
      resolve(null);
    };
    img.src = url;
  });
};


// --- Sub-Components ---

interface QuoteTableProps {
    quotes: Quote[];
    canConvertToSale: boolean;
    onEdit: (quote: Quote | null) => void;
    onStatusChange: (quoteId: string, status: Quote['status']) => void;
    onConvertToSale: (quote: Quote) => void;
    onDelete: (quoteId: string) => void;
    onSearch: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    searchFilter: string;
}

function QuoteTable({ quotes, canConvertToSale, onEdit, onStatusChange, onConvertToSale, onDelete, onSearch, statusFilter, onStatusFilterChange, searchFilter }: QuoteTableProps) {
    const filteredQuotes = React.useMemo(() => {
        let result = [...quotes];
        if (statusFilter !== 'todos') {
            result = result.filter(q => q.status === statusFilter);
        }
        if (searchFilter) {
            const lowerCaseFilter = searchFilter.toLowerCase();
            result = result.filter(q =>
                (q.customerName && q.customerName.toLowerCase().includes(lowerCaseFilter)) ||
                (q.id && q.id.toLowerCase().includes(lowerCaseFilter))
            );
        }
        return result;
    }, [quotes, statusFilter, searchFilter]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Gerenciamento de Orçamentos</CardTitle>
                        <CardDescription>Acompanhe, edite e converta seus orçamentos em vendas.</CardDescription>
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2 ml-auto">
                        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filtrar por Status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pendente">Pendentes</SelectItem>
                                <SelectItem value="Aprovado">Aprovados</SelectItem>
                                <SelectItem value="Cancelado">Cancelados</SelectItem>
                                <SelectItem value="Vendido">Vendidos</SelectItem>
                                <SelectItem value="todos">Todos</SelectItem>
                            </SelectContent>
                        </Select>
                         <Button className="w-full md:w-auto" onClick={() => onEdit(null)}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Novo Orçamento
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <DebouncedSearchInput
                        defaultValue={searchFilter}
                        onDebouncedChange={onSearch}
                        placeholder="Filtrar por cliente ou nº do orçamento..."
                        className="max-w-sm"
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nº</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="hidden sm:table-cell">Data</TableHead>
                            <TableHead className="hidden md:table-cell">Validade</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredQuotes.map(quote => (
                            <TableRow key={quote.id}>
                                <TableCell className="font-medium">#{quote.id.slice(-6)}</TableCell>
                                <TableCell>{quote.customerName || 'Não informado'}</TableCell>
                                <TableCell className="hidden sm:table-cell">{formatDate(quote.date)}</TableCell>
                                <TableCell className="hidden md:table-cell">{formatDate(quote.validUntil || quote.data_vencimento || buildQuoteValidUntil(quote.date, resolveQuoteValidityDays(quote)))}</TableCell>
                                <TableCell>R$ {quote.total.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn('font-semibold', getStatusVariant(quote.status))}>
                                        {quote.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={() => onEdit(quote)}>
                                                <FileText className="mr-2"/>Ver / Editar
                                            </DropdownMenuItem>
                                             {canConvertToSale && quote.status === 'Aprovado' && (
                                                <DropdownMenuItem onSelect={() => onConvertToSale(quote)} className="text-green-500 focus:text-green-500">
                                                    <ShoppingCart className="mr-2"/>Converter em Venda
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Mudar Status</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuRadioGroup value={quote.status} onValueChange={(v) => onStatusChange(quote.id, v as Quote['status'])}>
                                                            <DropdownMenuRadioItem value="Pendente">Pendente</DropdownMenuRadioItem>
                                                            <DropdownMenuRadioItem value="Aprovado">Aprovado</DropdownMenuRadioItem>
                                                            <DropdownMenuRadioItem value="Cancelado">Cancelado</DropdownMenuRadioItem>
                                                        </DropdownMenuRadioGroup>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">Excluir</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta ação não pode ser desfeita e excluirá o orçamento permanentemente.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDelete(quote.id)}>Excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                         {filteredQuotes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="p-6">
                                    <ModuleState
                                        title="Nenhum orcamento encontrado"
                                        description={
                                            quotes.length === 0
                                                ? 'Ainda nao existem orcamentos cadastrados no contexto atual.'
                                                : 'Os filtros aplicados nao retornaram orcamentos.'
                                        }
                                        compact
                                        actionLabel={quotes.length === 0 ? 'Novo orcamento' : 'Limpar busca'}
                                        onAction={quotes.length === 0 ? () => onEdit(null) : () => onSearch('')}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

interface QuoteBuilderPageProps {
    quote: Quote | null;
    useSaasQuotes: boolean;
    onBack: () => void;
    onSave: (quote: Quote) => void;
}

function QuoteBuilderPage({ quote, useSaasQuotes, onBack, onSave }: QuoteBuilderPageProps) {
    const { toast } = useToast();
    const { user: currentUser } = useCurrentUser();
    
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [stock, setStock] = React.useState<StockItem[]>([]);
    const [kits, setKits] = React.useState<Kit[]>([]);

    const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined);
    const [items, setItems] = React.useState<SaleItem[]>([]);
    const [discount, setDiscount] = React.useState(0);
    const [observations, setObservations] = React.useState('');
    const [barcode, setBarcode] = React.useState('');
    const [validityDays, setValidityDays] = React.useState(DEFAULT_QUOTE_VALIDITY_DAYS);

    const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false);
    const [isManualAddOpen, setIsManualAddOpen] = React.useState(false);
    const [newCustomer, setNewCustomer] = React.useState<Omit<Customer, 'id'>>({ name: '', phone: '', email: '', address: '', document: '' });
    
    React.useEffect(() => {
        let cancelled = false;

        const loadPrerequisites = async () => {
          try {
            const [customersData, stockData, kitsData] = await Promise.all(
              useSaasQuotes
                ? [listTenantCustomers(), listTenantProducts(), listTenantKits()]
                : [getCustomers(), getStock(), getKits()]
            );
            if (cancelled) return;

            setCustomers(customersData);
            setStock(stockData);
            setKits(kitsData);
          } catch (error) {
            if (!cancelled) {
              toast({
                variant: 'destructive',
                title: 'Erro ao carregar dados do orcamento',
                description: error instanceof Error ? error.message : 'Nao foi possivel carregar clientes, produtos e kits.',
              });
            }
          }
        };
        void loadPrerequisites();

        return () => {
          cancelled = true;
        };
    }, [toast, useSaasQuotes]);

    React.useEffect(() => {
      if (quote) {
        setSelectedCustomerId(quote.customerId);
        setItems(quote.items);
        setDiscount(quote.discount || 0);
        setObservations(quote.observations || '');
        setValidityDays(resolveQuoteValidityDays(quote));
      } else {
        setSelectedCustomerId(undefined);
        setItems([]);
        setDiscount(0);
        setObservations('');
        setBarcode('');
        setValidityDays(DEFAULT_QUOTE_VALIDITY_DAYS);
      }
    }, [quote]);

    const handleAddItem = (item: Omit<SaleItem, 'id'>) => {
        setItems(prev => {
            const existing = prev.find(i => i.name.toLowerCase() === item.name.toLowerCase());
            if (existing) {
                return prev.map(i => i.name.toLowerCase() === item.name.toLowerCase() ? {...i, quantity: (i.quantity || 1) + (item.quantity || 1)} : i);
            }
            return [...prev, { ...item, id: `manual-${Date.now()}` }];
        });
    };
    
    const addStockItemToSale = (stockItem: StockItem, quantity = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === stockItem.id);
            if (existing) {
                return prev.map(i => i.id === stockItem.id ? {...i, quantity: (i.quantity || 1) + quantity} : i);
            }
            return [...prev, { id: stockItem.id, name: stockItem.name, price: stockItem.price, quantity }];
        });
    };
      
    const handleBarcodeScan = () => {
        if (!barcode.trim()) return;
        const product = stock.find(p => p.barcode === barcode.trim());
        if (product) {
            addStockItemToSale(product);
            setBarcode('');
        } else {
            toast({ variant: "destructive", title: "Produto não encontrado" });
        }
    };

    const handleAddKit = (kitId: string) => {
        const selectedKit = kits.find(k => k.id === kitId);
        if (!selectedKit) return;
        let itemsToAdd: SaleItem[] = [];
        selectedKit.items.forEach(kitItem => {
            const stockItem = stock.find(s => s.id === kitItem.productId);
            if (stockItem) {
                itemsToAdd.push({ id: stockItem.id, name: stockItem.name, price: stockItem.price, quantity: kitItem.quantity });
            }
        });
        setItems(prevItems => {
            const newItems = [...prevItems];
            itemsToAdd.forEach(itemToAdd => {
                const existingIndex = newItems.findIndex(i => i.id === itemToAdd.id);
                if (existingIndex > -1) {
                    newItems[existingIndex].quantity += itemToAdd.quantity;
                } else {
                    newItems.push(itemToAdd);
                }
            });
            return newItems;
        });
        toast({ title: "Kit Adicionado!", description: `Os itens do kit "${selectedKit.name}" foram adicionados.` });
    };

    const handleRemoveItem = (itemId: string) => { setItems(items.filter(item => item.id !== itemId)); };
    const handleUpdateQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) return handleRemoveItem(itemId);
        setItems(items.map(item => item.id === itemId ? { ...item, quantity } : item));
    };

    const handleSaveNewCustomer = async () => {
        if (!newCustomer.name) { toast({ variant: 'destructive', title: 'Nome obrigatório' }); return; }
        const customerToAdd: Customer = useSaasQuotes
          ? await createTenantCustomer(newCustomer)
          : { ...newCustomer, id: `CUST-${Date.now()}` };

        if (!useSaasQuotes) {
          const updatedCustomers = [...customers, customerToAdd];
          await saveCustomers(updatedCustomers);
          setCustomers(updatedCustomers);
        } else {
          setCustomers((prev) => [...prev, customerToAdd].sort((a, b) => a.name.localeCompare(b.name)));
        }

        setSelectedCustomerId(customerToAdd.id);
        setIsAddCustomerOpen(false);
        toast({ title: 'Cliente adicionado!', description: `${customerToAdd.name} foi salvo.` });
    };

    const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
    const total = subtotal - discount;

    const buildDraftQuote = (): Quote | null => {
        if (!selectedCustomerId) { toast({ variant: "destructive", title: "Cliente não selecionado" }); return null; }
        if (items.length === 0) { toast({ variant: "destructive", title: "Nenhum item adicionado" }); return null; }

        const customer = customers.find(c => c.id === selectedCustomerId);
        const quoteDate = quote?.date || new Date().toISOString().split('T')[0];
        const sanitizedValidityDays = Number.isFinite(validityDays) && validityDays > 0
            ? Math.floor(validityDays)
            : DEFAULT_QUOTE_VALIDITY_DAYS;
        const validUntil = buildQuoteValidUntil(quoteDate, sanitizedValidityDays);

        return {
            id: quote?.id || `QUOTE-${Date.now()}`,
            date: quoteDate,
            time: quote?.time || new Date().toLocaleTimeString('pt-BR'),
            user: currentUser?.name || 'Não identificado',
            items,
            subtotal,
            discount,
            total,
            status: quote?.status || 'Pendente',
            validUntil,
            data_vencimento: validUntil,
            validityDays: sanitizedValidityDays,
            dias_validade: sanitizedValidityDays,
            observations,
            customerId: selectedCustomerId,
            customerName: customer?.name,
        };
    };

    const handleSaveQuote = () => {
        const finalQuote = buildDraftQuote();
        if (!finalQuote) return;
        onSave(finalQuote);
    };

    const generatePdf = async () => {
        const draftQuote = buildDraftQuote();
        if (!draftQuote) { return; }
        const customer = customers.find(c => c.id === draftQuote.customerId);
        if (!customer) { toast({variant: 'destructive', title: 'Selecione um cliente'}); return; }
        const companyInfo = useSaasQuotes ? await getTenantCompanyInfo() : await getCompanyInfo();
        const logoDataUrl = await loadImageAsDataUrl(companyInfo.logoUrl);
        const customerAddress = parseCustomerAddress(customer);
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 20;
        let textX = margin;
        const fontColor = '#000000';
        const logoWidth = 30;
        const logoHeight = 30;
        const logoSpacing = 5;

        if (logoDataUrl) { doc.addImage(logoDataUrl, 'PNG', margin, currentY - 8, logoWidth, logoHeight); textX = margin + logoWidth + logoSpacing; }
        doc.setFont('helvetica');
        doc.setTextColor(fontColor);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        if (companyInfo?.name) { doc.text(companyInfo.name, textX, currentY); currentY += 8; }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (companyInfo?.address) { doc.text(companyInfo.address, textX, currentY); currentY += 4; }
        if (companyInfo?.phone || companyInfo?.emailOrSite) { doc.text(`Telefone: ${companyInfo.phone || ''} | E-mail: ${companyInfo.emailOrSite || ''}`, textX, currentY); }
        const rightHeaderX = pageWidth - margin;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Orçamento`, rightHeaderX, currentY - 8, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nº: #${draftQuote.id.slice(-6)}`, rightHeaderX, currentY - 2, { align: 'right' });
        doc.text(`Data Emissão: ${formatDate(draftQuote.date)}`, rightHeaderX, currentY + 4, { align: 'right' });
        currentY = 50;
        const boxWidth = (pageWidth - margin * 2);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, currentY, boxWidth, 7, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Dados do Cliente', margin + 3, currentY + 5);
        currentY += 7;
        const customerInfo = {
            'Nome:': customer.name || 'Não informado',
            'CPF/CNPJ:': customer.document || 'Não informado',
            'Telefone:': customer.phone || 'Não informado',
            'Endereço:': customerAddress.addressLine,
            'Cidade/UF:': customerAddress.cityLine || 'Não informado',
            'CEP:': customer.cep || 'Não informado',
        };
        (doc as any).autoTable({ body: Object.entries(customerInfo), startY: currentY, theme: 'grid', tableWidth: boxWidth, margin: { left: margin }, styles: { fontSize: 9, cellPadding: 2, lineColor: [200,200,200], lineWidth: 0.1 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } } });
        currentY = (doc as any).lastAutoTable.finalY + 8;
        (doc as any).autoTable({
            startY: currentY,
            head: [['Descrição', 'Qtd.', 'Vlr. Unit.', 'Subtotal']],
            body: items.map(item => [item.name, item.quantity, `R$ ${(item.price || 0).toFixed(2)}`, `R$ ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`]),
            foot: [ ['', '', { content: 'Subtotal:', styles: { halign: 'right' } }, { content: `R$ ${subtotal.toFixed(2)}` }], ['', '', { content: 'Desconto:', styles: { halign: 'right' } }, { content: `- R$ ${discount.toFixed(2)}` }], ['', '', { content: 'Total:', styles: { halign: 'right', fontStyle: 'bold' } }, { content: `R$ ${total.toFixed(2)}`, styles: { fontStyle: 'bold' } }] ],
            theme: 'striped',
            headStyles: { fillColor: '#334155', textColor: '#FFFFFF', fontStyle: 'bold' },
            footStyles: { fillColor: '#F1F5F9', textColor: '#000000' }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("Validade do Orçamento:", margin, currentY);
        currentY += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Válido até: ${formatDate(draftQuote.validUntil)}`, margin, currentY);
        doc.autoPrint();
        doc.output('dataurlnewwindow');
    };

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b bg-muted/30 sticky top-0 z-10">
                 <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Lista
                </Button>
                <h1 className="text-lg font-semibold">{quote ? `Editando Orçamento #${quote.id.slice(-6)}` : 'Novo Orçamento'}</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={generatePdf}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
                    <Button size="sm" onClick={handleSaveQuote}>Salvar Orçamento</Button>
                </div>
            </header>
            
            <div className="flex-grow p-4 grid md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                     <Card>
                        <CardHeader><CardTitle>Itens do Orçamento</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-2">
                                <div className="relative flex-grow">
                                    <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="Escanear código de barras..." className="pl-10" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()} />
                                </div>
                                <Button variant="outline" onClick={() => setIsManualAddOpen(true)}>Adicionar Item Manual</Button>
                            </div>
                            <div className="border rounded-lg min-h-[200px]">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="w-24 text-center">Qtd.</TableHead><TableHead className="w-32 text-right">Preço</TableHead><TableHead className="w-32 text-right">Subtotal</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {items.length > 0 ? items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell><Input type="number" value={item.quantity} onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))} className="w-16 h-8 text-center mx-auto" /></TableCell>
                                            <TableCell className="text-right">R$ {(item.price || 0).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</TableCell>
                                            <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><X className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                        )) : ( <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhum item adicionado.</TableCell></TableRow> )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                     </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer">Cliente</Label>
                                <div className="flex gap-2">
                                <CustomerAutocomplete
                                  id="customer"
                                  selectedCustomer={customers.find((c) => c.id === selectedCustomerId) ?? null}
                                  onSelect={(customer) => setSelectedCustomerId(customer?.id)}
                                  searchFunction={useSaasQuotes ? searchTenantCustomers : undefined}
                                  placeholder="Buscar cliente para o orçamento..."
                                  emptyMessage="Nenhum cliente encontrado."
                                  className="flex-1"
                                />
                                <Button variant="outline" size="icon" onClick={() => setIsAddCustomerOpen(true)}><UserPlus /></Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="kit">Adicionar Kit de Produtos</Label>
                                <Select onValueChange={handleAddKit}><SelectTrigger id="kit"><SelectValue placeholder="Selecione um kit..." /></SelectTrigger><SelectContent>{kits.map(k => ( <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem> ))}</SelectContent></Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="observations">Observações</Label>
                                <Textarea id="observations" placeholder="Condições, detalhes, etc." value={observations} onChange={e => setObservations(e.target.value)} rows={4}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="validityDays">Validade do orçamento (dias)</Label>
                                <Input
                                  id="validityDays"
                                  type="number"
                                  min={1}
                                  value={validityDays}
                                  onChange={(e) => setValidityDays(Math.max(1, parseInt(e.target.value, 10) || DEFAULT_QUOTE_VALIDITY_DAYS))}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Válido até: {formatDate(buildQuoteValidUntil(quote?.date || new Date().toISOString().split('T')[0], validityDays))}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Resumo Financeiro</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center text-sm"><Label htmlFor="discount">Desconto (R$)</Label><CurrencyInput id="discount" value={discount} onValueChange={setDiscount} className="w-24 h-8 text-right" /></div>
                            <div className="flex justify-between items-center font-bold text-xl border-t pt-2 mt-2"><Label>Total</Label><span>R$ {total.toFixed(2)}</span></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <ManualAddItemDialog isOpen={isManualAddOpen} stockItems={stock} onAddItem={handleAddItem} onOpenChange={setIsManualAddOpen}/>
        </div>
    );
}

// --- Main Page Component ---

export default function OrcamentosPage() {
    const { toast } = useToast();
    const session = useCurrentAppSession();
    const [view, setView] = React.useState<'list' | 'builder'>('list');
    const [quotes, setQuotes] = React.useState<Quote[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [statusFilter, setStatusFilter] = React.useState('Pendente');
    const [searchFilter, setSearchFilter] = React.useState('');
    const [editingQuote, setEditingQuote] = React.useState<Quote | null>(null);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    
    const useSaasQuotes =
      session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant === true;

    React.useEffect(() => {
      if (session.isLoading) {
        return;
      }

      void loadData();
    }, [session.isLoading, useSaasQuotes]);

    const loadData = async () => {
        try {
          setIsLoading(true);
          setLoadError(null);
          const loadedQuotes = useSaasQuotes ? await listTenantQuotes() : await getQuotes();
          setQuotes(loadedQuotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Nao foi possivel carregar os orcamentos.';
          setLoadError(message);
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar orcamentos',
            description: message,
          });
        } finally {
          setIsLoading(false);
        }
    };

    const handleEditQuote = (quote: Quote | null) => {
        setEditingQuote(quote);
        setView('builder');
    };

    const handleBackToList = () => {
        setEditingQuote(null);
        setView('list');
    };

    const handleSaveQuote = async (savedQuote: Quote) => {
        let updatedQuotes;
        const quoteExists = quotes.some(q => q.id === savedQuote.id);
        try {
            const persistedQuote = useSaasQuotes
              ? quoteExists
                ? await updateTenantQuote(savedQuote)
                : await createTenantQuote(savedQuote)
              : savedQuote;

            if (quoteExists) {
                updatedQuotes = quotes.map(q => q.id === persistedQuote.id ? persistedQuote : q);
                toast({ title: 'Orçamento Atualizado!', description: `O orçamento #${persistedQuote.id.slice(-6)} foi salvo.` });
            } else {
                updatedQuotes = [persistedQuote, ...quotes];
                toast({ title: 'Orçamento Salvo!', description: `O orçamento #${persistedQuote.id.slice(-6)} foi criado.` });
            }
            updatedQuotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setQuotes(updatedQuotes);
            if (!useSaasQuotes) {
              await saveQuotes(updatedQuotes);
            }
            setView('list');
        } catch (error) {
            toast({
              variant: 'destructive',
              title: 'Erro ao salvar orcamento',
              description: error instanceof Error ? error.message : 'Nao foi possivel salvar o orcamento.',
            });
        }
    };

    const handleQuickStatusChange = async (quoteId: string, status: Quote['status']) => {
        const currentQuote = quotes.find(q => q.id === quoteId);
        if (!currentQuote) return;

        const updatedQuote = { ...currentQuote, status };

        try {
            if (useSaasQuotes) {
              await updateTenantQuote(updatedQuote);
            }

            const updatedQuotes = quotes.map(q => q.id === quoteId ? updatedQuote : q);
            setQuotes(updatedQuotes);
            if (!useSaasQuotes) {
              await saveQuotes(updatedQuotes);
            }
            toast({ title: 'Status Alterado!', description: `O orçamento #${quoteId.slice(-6)} foi atualizado.` });
        } catch (error) {
            toast({
              variant: 'destructive',
              title: 'Erro ao atualizar status',
              description: error instanceof Error ? error.message : 'Nao foi possivel atualizar o status do orcamento.',
            });
        }
    };

    const handleConvertToSale = async (quote: Quote) => {
        if (useSaasQuotes) {
          try {
            const saleId = `SALE-${Date.now()}`;
            const result = await finalizarVenda({
              saleId,
              items: quote.items,
              discount: quote.discount,
              paymentMethod: 'pix',
              observations: `Venda gerada a partir do orçamento #${quote.id.slice(-6)}. ${quote.observations || ''}`.trim(),
              customerId: quote.customerId,
              customerName: quote.customerName,
              relatedQuoteId: quote.id,
              userName: quote.user,
              installments: {
                enabled: false,
                count: 0,
              },
            });

            setQuotes((currentQuotes) =>
              currentQuotes.map((currentQuote) =>
                currentQuote.id === quote.id ? { ...currentQuote, status: 'Vendido' } : currentQuote
              )
            );
            toast({
              title: 'Orçamento Convertido em Venda!',
              description: `A Venda #${result.sale.id.slice(-6)} foi criada no runtime SaaS.`,
            });
          } catch (error) {
            toast({
              variant: 'destructive',
              title: 'Erro ao converter orçamento',
              description: error instanceof Error ? error.message : 'Nao foi possivel converter o orcamento em venda.',
            });
          }
          return;
        }

        const newSale: Sale = {
            id: `SALE-${Date.now()}`,
            relatedQuoteId: quote.id,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('pt-BR'),
            user: quote.user,
            items: quote.items,
            subtotal: quote.subtotal,
            discount: quote.discount,
            total: quote.total,
            paymentMethod: 'A definir',
            observations: `Venda gerada a partir do orçamento #${quote.id.slice(-6)}. ${quote.observations || ''}`.trim(),
            customerId: quote.customerId,
            customerName: quote.customerName,
        };
        const newTransaction: FinancialTransaction = {
            id: `FIN-${Date.now()}`,
            type: 'receita',
            description: `Recebimento da Venda #${newSale.id.slice(-6)}`,
            amount: newSale.total,
            date: newSale.date,
            category: 'Venda de Produto',
            paymentMethod: 'A definir',
            relatedSaleId: newSale.id,
            status: 'pago',
        };
        const [existingSales, existingTransactions] = await Promise.all([ getSales(), getFinancialTransactions() ]);
        await saveSales([newSale, ...existingSales]);
        await saveFinancialTransactions([newTransaction, ...existingTransactions]);
        handleQuickStatusChange(quote.id, 'Vendido');
        toast({ title: 'Orçamento Convertido em Venda!', description: `A Venda #${newSale.id.slice(-6)} foi criada.` });
    };
    
    const handleDeleteQuote = async (quoteId: string) => {
        try {
            if (useSaasQuotes) {
              await deleteTenantQuote(quoteId);
            }

            const updatedQuotes = quotes.filter(q => q.id !== quoteId);
            setQuotes(updatedQuotes);
            if (!useSaasQuotes) {
              await saveQuotes(updatedQuotes);
            }
            toast({ variant: 'destructive', title: 'Orçamento Excluído!', description: 'O orçamento foi removido permanentemente.' });
        } catch (error) {
            toast({
              variant: 'destructive',
              title: 'Erro ao excluir orcamento',
              description: error instanceof Error ? error.message : 'Nao foi possivel excluir o orcamento.',
            });
        }
    };

    if (session.isLoading || isLoading) {
        return (
            <ModuleLoadingState
                title="Carregando orcamentos"
                description="Sincronizando lista e dados comerciais do contexto atual."
            />
        );
    }

    if (loadError) {
        return (
            <ModuleState
                title="Nao foi possivel carregar orcamentos"
                description={loadError}
                tone="destructive"
                actionLabel="Tentar novamente"
                onAction={() => void loadData()}
            />
        );
    }

    if (view === 'builder') {
        return <QuoteBuilderPage quote={editingQuote} useSaasQuotes={useSaasQuotes} onBack={handleBackToList} onSave={handleSaveQuote} />;
    }

    return (
            <QuoteTable
            quotes={quotes}
            canConvertToSale={true}
            onEdit={handleEditQuote}
            onStatusChange={handleQuickStatusChange}
            onConvertToSale={handleConvertToSale}
            onDelete={handleDeleteQuote}
            onSearch={setSearchFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchFilter={searchFilter}
        />
    );
}

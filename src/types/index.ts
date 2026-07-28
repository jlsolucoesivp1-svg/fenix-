

export type InternalNote = {
  user: string; // The name of the user who made the comment
  date: string; // ISO 8601 date string
  comment: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  document: string;
  cep?: string;
};

export type CustomerSearchResult = Pick<Customer, 'id' | 'name' | 'phone'>;

export type ServiceOrderItem = {
  id: number;
  stockItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  type: 'service' | 'part';
}

export type ServiceOrder = {
  id: string;
  customerName: string;
  customerId?: string; // Add this to link to the customer object
  client?: Customer; // For backwards compatibility
  equipment: any;
  reportedProblem: string;
  status: 'Em análise' | 'Aprovado' | 'Em conserto' | 'Finalizado' | 'Entregue' | 'Aberta' | 'Aguardando Pagamento' | 'Aguardando peça' | 'Cancelada';
  date: string; // YYYY-MM-DD
  deliveredDate?: string; // YYYY-MM-DD
  attendant: string; // Nome do atendente
  paymentMethod?: 'Dinheiro' | 'Boleto' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Transferência' | 'Pendente';
  warranty?: string; // Ex: "90 dias", "1 ano para a peça"
  totalValue: number;
  discount?: number;
  finalValue?: number;
  items?: ServiceOrderItem[];
  payments?: { id: string; amount: number; date: string; method: string; }[];
  internalNotes?: InternalNote[] | string;
  technicalReport?: string;
  accessories?: string;
  serialNumber?: string;
};

// Represents an item in our inventory.
export type StockItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
  costPrice: number;
  minStock: number;
  barcode: string;
  unitOfMeasure: string;
};

// Represents a line item in a sale, not a stock item.
export type SaleItem = {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
};

export type Sale = {
    id: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM:SS
    user: string; // Nome do usuário que efetuou a venda
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    observations?: string;
    customerId?: string;
    customerName?: string;
    relatedQuoteId?: string;
    status?: 'Finalizada' | 'Estornada';
    reversalReason?: string;
};

export type Quote = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  user: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  observations?: string;
  customerId?: string;
  customerName?: string;
  status: 'Pendente' | 'Aprovado' | 'Cancelado' | 'Vendido';
  validUntil: string; // YYYY-MM-DD
  data_vencimento?: string; // YYYY-MM-DD
  validityDays?: number;
  dias_validade?: number;
}

export type FinancialTransaction = {
    id: string;
    type: 'receita' | 'despesa';
    description: string;
    amount: number;
    date: string; // YYYY-MM-DD
    dueDate?: string; // YYYY-MM-DD, for installments
    status?: 'pago' | 'pendente' | 'Estornado';
    category: 'Venda de Produto' | 'Venda de Serviço' | 'Contas a Receber' | 'Compra de Peça' | 'Compra de Mercadoria' | 'Salário' | 'Aluguel' | 'Outra Receita' | 'Outra Despesa' | 'Venda Estornada';
    paymentMethod: string;
    relatedSaleId?: string;
    relatedServiceOrderId?: string;
    relatedStockEntryId?: string;
    origin?: 'manual' | 'sale' | 'service-order-payment' | 'service-order-finalization' | 'stock-entry';
};

export type UserPermissions = {
  accessDashboard: boolean;
  accessClients: boolean;
  accessServiceOrders: boolean;
  accessInventory: boolean;
  accessSales: boolean;
  accessFinancials: boolean;
  accessSettings: boolean;
  accessDangerZone: boolean;
  accessAgenda: boolean;
  accessQuotes: boolean;
  accessLaudos: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewPasswords: boolean;
  canManageUsers: boolean;
}

export type UserStatus = 'active' | 'inactive' | 'invited' | 'revoked';

export type User = {
  id: string;
  name: string;
  login: string;
  email?: string;
  password?: string;
  status?: UserStatus;
  isOwner?: boolean;
  permissions: UserPermissions;
};


export type CompanyInfo = {
  id?: number; // Optional because it's a singleton in the DB
  name: string;
  address: string;
  phone: string;
  emailOrSite: string;
  document: string; // CPF or CNPJ
  logoUrl: string;
  logoStoragePath?: string;
  pixKey: string;
  notificationSoundUrl?: string;
  notificationSoundStoragePath?: string;
};

export type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps: {
    customerId?: string;
    customerName?: string;
    address?: string;
    serviceType?: string;
    notes?: string;
    status: 'agendado' | 'concluido' | 'cancelado';
  };
};

export type DashboardOverview = {
  totalCustomers: number;
  activeOrders: number;
  completedOrders: number;
  todaysAppointments: Appointment[];
};

export type ServiceOrderFileSummary = {
  path: string;
  name: string;
  size: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  mimeType?: string | null;
  downloadUrl: string;
};

export type CompanyAssetKind = 'logo' | 'notification-sound' | 'brand-media';

export type ReceiptPrintFormat = 'a4' | 'thermal_80mm';

export type CompanyAssetSummary = {
  path: string;
  name: string;
  size: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  mimeType?: string | null;
  downloadUrl: string;
  kind: CompanyAssetKind;
};

export type KitItem = {
  productId: string;
  name: string;
  quantity: number;
};

export type Kit = {
  id: string;
  name: string;
  items: KitItem[];
};

export type OSPayment = {
  id: string;
  amount: number;
  date: string;
  method: string;
}

export interface AppSettings {
  id?: number; // Optional because it's a singleton in the DB
  defaultWarrantyDays: number;
  receiptPrintFormat: ReceiptPrintFormat;
}

export type ServiceOrderViewMetadata = {
  serviceOrderId: string;
  lastViewedAt: string; // ISO 8601 date string
};

export type SerialMetadata = {
  version: number;
  issuedAt: string;
  expiresAt?: string;
};

export type SystemActivationStatus = 'pending' | 'active';

export type SystemActivation = {
  machineKey: string;
  createdAt: string;
  status: SystemActivationStatus;
  activatedAt?: string;
  serial?: string;
  serialMetadata?: SerialMetadata;
};

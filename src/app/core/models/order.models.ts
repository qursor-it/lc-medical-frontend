export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface OrderPaymentStatusResponse {
  order: OrderSummary;
  paid: boolean;
  invoices: InvoiceSummary[];
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  surgeryDate: string | null;
  shippingDate: string | null;
  clientCode: string | null;
  pickupDate: string | null;
  shipTo: string | null;
  orderRef: string | null;
  patient: string | null;
  transport: string | null;
  surgeon: string | null;
  contact: string | null;
  phone: string | null;
  representative: string | null;
  lines: OrderLineSummary[];
  comments: string | null;
}

export interface OrderLineSummary {
  id: number;
  articolo: string | null;
  descrizione: string | null;
  quantita: number | null;
}

export interface InvoiceSummary {
  id: number;
  invoiceNumber: string | null;
  invoiceType: string | null;
  clientCode: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  orderNumber: string;
  buyerName: string | null;
  buyerVat: string | null;
  surgeon: string | null;
  patient: string | null;
  representative: string | null;
  total: number | null;
}

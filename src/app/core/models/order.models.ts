export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface OrderListItem {
  id: number;
  orderNumber: string;
  clientCode: string | null;
  paid: boolean;
  paymentStatus: PaymentStatus;
  commissionAmount: number | null;
}

export interface OrderPaymentStatusResponse {
  order: OrderSummary;
  paid: boolean;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  paidAmount: number | null;
  commissionRatePercent: number | null;
  commissionAmount: number | null;
  invoices: InvoiceSummary[];
  paidOrderItems: PaidOrderItemSummary[];
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

export interface UpdateOrderRequest {
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

export interface PaidOrderItemSummary {
  id: number;
  sourceFileName: string | null;
  sourceRowNumber: number | null;
  docType: string | null;
  documentNumber: string | null;
  postingDate: string | null;
  status: string | null;
  paidPeriod: string | null;
  customerCode: string | null;
  customerName: string | null;
  orderNumber: string;
  lineNumber: number | null;
  itemCode: string | null;
  description: string | null;
  quantity: number | null;
  lineTotal: number | null;
  price: number | null;
  manufacturerSerial: string | null;
  orderType: string | null;
  surgeryDate: string | null;
  surgeonCode: string | null;
  surgeonName: string | null;
  importedAt: string;
}

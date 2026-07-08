import { PageResponse } from './order.models';

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string | null;
  orderNumber: string;
  clientCode: string | null;
  total: number | null;
}

export interface InvoiceDetail extends InvoiceListItem {
  invoiceType: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  totalWithoutDiscount: number | null;
  discount: number | null;
  amountExVat: number | null;
  vat: number | null;
  bank: string | null;
  iban: string | null;
  buyerName: string | null;
  buyerAddress: string | null;
  buyerVat: string | null;
  surgeon: string | null;
  patient: string | null;
  representative: string | null;
  cupCode: string | null;
  cigCode: string | null;
  lines: InvoiceLineSummary[];
}

export interface InvoiceLineSummary {
  id: number;
  articolo: string | null;
  descrizione: string | null;
  quantita: number | null;
  prezzo: number | null;
  scontoPerc: number | null;
  ivaPerc: number | null;
  importo: number | null;
  seriali: string[];
}

export type InvoicePageResponse = PageResponse<InvoiceListItem>;

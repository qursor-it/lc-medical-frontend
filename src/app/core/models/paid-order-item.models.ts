import { PageResponse } from './order.models';

export interface PaidOrderItem {
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

export type PaidOrderItemsPageResponse = PageResponse<PaidOrderItem>;

export type UploadKind = 'orders' | 'invoices' | 'paid-order-items';

export interface BatchUploadResult<T = Record<string, unknown>> {
  fileName: string;
  success: boolean;
  item: T | null;
  error: string | null;
}

export interface PaidOrderItemsImportResult {
  [key: string]: unknown;
  fileName: string;
  readItems: number;
  importedItems: number;
  duplicateItems: number;
  skippedRows: number;
  uniqueOrders: number;
}

export type UploadQueueStatus = 'pending' | 'uploading' | 'success' | 'failed';

export interface UploadQueueItem<T = Record<string, unknown>> {
  id: string;
  file: File;
  fileName: string;
  size: number;
  status: UploadQueueStatus;
  result: BatchUploadResult<T> | null;
  error: string | null;
}

export interface UploadPanelConfig {
  kind: UploadKind;
  title: string;
  endpointLabel: string;
  chooseLabel: string;
  uploadLabel: string;
  accept: string;
  invalidFileTypeMessageDetail: string;
  maxFileSize: number;
  emptyTitle: string;
  emptyDescription: string;
  icon: string;
  iconClass: string;
}

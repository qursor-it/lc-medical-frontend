export type UploadKind = 'orders' | 'invoices';

export interface BatchUploadResult<T = Record<string, unknown>> {
  fileName: string;
  success: boolean;
  item: T | null;
  error: string | null;
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
  emptyTitle: string;
  emptyDescription: string;
  icon: string;
  iconClass: string;
}

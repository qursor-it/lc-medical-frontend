export type CommissionBase = 'NET' | 'GROSS';

export interface AppSettings {
  commissionBase: CommissionBase;
  commissionRatePercent: number;
  vatRatePercent: number;
}

export type DangerDataset = 'orders' | 'paid-order-items' | 'invoices';

export type DangerCounts = Record<DangerDataset, number>;

export interface PurgeResult {
  dataset: DangerDataset;
  deletedItems: number;
}

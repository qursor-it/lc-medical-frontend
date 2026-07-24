export type CommissionBase = 'NET' | 'GROSS';

export interface AppSettings {
  commissionBase: CommissionBase;
  commissionRatePercent: number;
  vatRatePercent: number;
}

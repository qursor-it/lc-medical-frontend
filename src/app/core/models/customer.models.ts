export interface Customer {
  code: string;
  name: string | null;
  group: string | null;
  city: string | null;
  country: string | null;
  vat: string | null;
  ordersCount: number;
  paymentsCount: number;
}

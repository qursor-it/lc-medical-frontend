import { LinePaymentStatus, OrderLineSummary } from '../core/models/order.models';

const LABELS: Record<LinePaymentStatus, string> = {
  PAID: 'Pagato',
  PARTIAL: 'Parziale',
  CREDITED: 'Stornato',
  UNPAID: 'Da pagare',
};

const CLASSES: Record<LinePaymentStatus, string> = {
  PAID: 'border-teal-200 bg-teal-50 text-teal-700',
  PARTIAL: 'border-amber-200 bg-amber-50 text-amber-700',
  CREDITED: 'border-slate-200 bg-slate-100 text-slate-600',
  UNPAID: 'border-red-200 bg-red-50 text-red-700',
};

export function lineStatusLabel(status: LinePaymentStatus): string {
  return LABELS[status] ?? status;
}

export function lineStatusClass(status: LinePaymentStatus): string {
  return CLASSES[status] ?? CLASSES.UNPAID;
}

export function lineStatusTitle(line: OrderLineSummary): string {
  const parts = [`Ordinate: ${line.quantita ?? 0}`, `fatturate: ${line.paidQuantity ?? 0}`];
  if (line.creditedQuantity) {
    parts.push(`stornate: ${line.creditedQuantity}`);
  }
  return parts.join(' · ');
}

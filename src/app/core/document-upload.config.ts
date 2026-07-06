import { UploadKind, UploadPanelConfig } from './models/upload.models';

export const uploadPanelConfigs: Record<UploadKind, UploadPanelConfig> = {
  orders: {
    kind: 'orders',
    title: 'Ordini',
    endpointLabel: '/orders/extract-text/batch',
    chooseLabel: 'Seleziona PDF',
    uploadLabel: 'Invia ordini',
    emptyTitle: 'Trascina qui i PDF degli ordini',
    emptyDescription: 'Puoi selezionare piu file in una sola operazione.',
    icon: 'pi-file-pdf',
    iconClass: 'text-teal-700',
  },
  invoices: {
    kind: 'invoices',
    title: 'Invoice',
    endpointLabel: '/invoices/extract-text/batch',
    chooseLabel: 'Seleziona PDF',
    uploadLabel: 'Invia invoice',
    emptyTitle: 'Trascina qui i PDF invoice',
    emptyDescription: 'Il risultato mostra una riga per ogni file processato.',
    icon: 'pi-receipt',
    iconClass: 'text-cyan-700',
  },
};

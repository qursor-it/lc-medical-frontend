import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { UploadQueueItem, UploadQueueStatus } from '../../../core/models/upload.models';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

@Component({
  selector: 'app-upload-results-table',
  imports: [ButtonModule, TableModule, TagModule],
  templateUrl: './upload-results-table.html',
})
export class UploadResultsTable {
  readonly title = input.required<string>();
  readonly items = input<UploadQueueItem[]>([]);
  readonly uploading = input(false);
  readonly clearRequested = output<void>();
  readonly uploadRequested = output<void>();

  protected hasFiles(): boolean {
    return this.items().length > 0;
  }

  protected statusLabel(status: UploadQueueStatus): string {
    const labels: Record<UploadQueueStatus, string> = {
      pending: 'Da inviare',
      uploading: 'Invio',
      success: 'Successo',
      failed: 'Fallito',
    };

    return labels[status];
  }

  protected statusSeverity(status: UploadQueueStatus): TagSeverity {
    const severities: Record<UploadQueueStatus, TagSeverity> = {
      pending: 'secondary',
      uploading: 'info',
      success: 'success',
      failed: 'danger',
    };

    return severities[status];
  }

  protected fileSize(size: number): string {
    if (size < 1_000_000) {
      return `${Math.max(size / 1_000, 1).toFixed(1)} KB`;
    }

    return `${(size / 1_000_000).toFixed(1)} MB`;
  }

  protected documentLabel(queueItem: UploadQueueItem): string {
    const result = queueItem.result;
    if (!result) {
      return '-';
    }

    const resultItem = result.item;
    if (!resultItem) {
      return '-';
    }

    return String(resultItem['orderNumber'] ?? resultItem['invoiceNumber'] ?? resultItem['id'] ?? '-');
  }

  protected documentDetail(queueItem: UploadQueueItem): string {
    if (queueItem.error) {
      return queueItem.error;
    }

    const result = queueItem.result;
    if (!result?.item) {
      return queueItem.status === 'pending' ? 'In attesa di invio' : '-';
    }

    const invoiceNumber = result.item['invoiceNumber'];
    const orderNumber = result.item['orderNumber'];

    if (invoiceNumber && orderNumber) {
      return `Invoice ${invoiceNumber} - ordine ${orderNumber}`;
    }

    if (orderNumber) {
      return `Ordine ${orderNumber}`;
    }

    return 'Documento salvato';
  }
}

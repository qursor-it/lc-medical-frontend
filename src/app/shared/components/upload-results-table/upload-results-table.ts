import { Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { BatchUploadResult } from '../../../core/models/upload.models';

@Component({
  selector: 'app-upload-results-table',
  imports: [TableModule, TagModule],
  templateUrl: './upload-results-table.html',
})
export class UploadResultsTable {
  readonly title = input.required<string>();
  readonly results = input<BatchUploadResult[]>([]);

  protected documentLabel(result: BatchUploadResult): string {
    const item = result.item;
    if (!item) {
      return '-';
    }

    return String(item['orderNumber'] ?? item['invoiceNumber'] ?? item['id'] ?? '-');
  }

  protected documentDetail(result: BatchUploadResult): string {
    const item = result.item;
    if (!item) {
      return '-';
    }

    const invoiceNumber = item['invoiceNumber'];
    const orderNumber = item['orderNumber'];

    if (invoiceNumber && orderNumber) {
      return `Invoice ${invoiceNumber} - ordine ${orderNumber}`;
    }

    if (orderNumber) {
      return `Ordine ${orderNumber}`;
    }

    return 'Documento salvato';
  }
}

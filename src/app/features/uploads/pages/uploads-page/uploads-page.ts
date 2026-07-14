import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

import { uploadPanelConfigs } from '../../../../core/document-upload.config';
import {
  BatchUploadResult,
  UploadKind,
  UploadPanelConfig,
  UploadQueueItem,
} from '../../../../core/models/upload.models';
import { DocumentUploadService } from '../../../../core/services/document-upload.service';
import { DocumentUploadPanel } from '../../../../shared/components/document-upload-panel/document-upload-panel';
import { UploadResultsTable } from '../../../../shared/components/upload-results-table/upload-results-table';

@Component({
  selector: 'app-uploads-page',
  imports: [DocumentUploadPanel, UploadResultsTable],
  templateUrl: './uploads-page.html',
})
export class UploadsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly uploadService = inject(DocumentUploadService);
  private readonly messages = inject(MessageService);

  protected readonly uploadQueue = signal<UploadQueueItem[]>([]);
  protected readonly uploading = signal(false);
  protected readonly kind = signal<UploadKind>(this.route.snapshot.data['kind'] as UploadKind);

  protected readonly config = computed<UploadPanelConfig>(() => uploadPanelConfigs[this.kind()]);
  protected readonly selectedFiles = computed(() => this.uploadQueue().map((item) => item.file));
  protected readonly successfulUploads = computed(
    () => this.uploadQueue().filter((item) => item.status === 'success').length,
  );
  protected readonly failedUploads = computed(
    () => this.uploadQueue().filter((item) => item.status === 'failed').length,
  );

  constructor() {
    this.route.data.subscribe((data) => {
      this.kind.set(data['kind'] as UploadKind);
      this.uploadQueue.set([]);
    });
  }

  protected updateSelectedFiles(files: File[]): void {
    const previousItems = new Map(
      this.uploadQueue().map((item) => [this.fileKey(item.file), item]),
    );

    this.uploadQueue.set(
      files.map((file): UploadQueueItem => {
        const previous = previousItems.get(this.fileKey(file));

        return (
          previous ?? {
            id: this.fileKey(file),
            file,
            fileName: file.name,
            size: file.size,
            status: 'pending',
            result: null,
            error: null,
          }
        );
      }),
    );
  }

  protected clearSelectedFiles(): void {
    this.uploadQueue.set([]);
  }

  protected uploadSelectedFiles(): void {
    this.upload(this.selectedFiles());
  }

  protected upload(files: File[]): void {
    if (!files.length) {
      this.messages.add({
        severity: 'warn',
        summary: 'Nessun file selezionato',
        detail: 'Seleziona almeno un file da caricare.',
      });
      return;
    }

    this.uploading.set(true);
    this.uploadQueue.update((items) =>
      items.map((item): UploadQueueItem => ({
        ...item,
        status: files.some((file) => this.fileKey(file) === item.id) ? 'uploading' : item.status,
        error: null,
      })),
    );

    this.uploadService.uploadBatch(this.kind(), files).subscribe({
      next: (response) => {
        this.applyUploadResults(response);
        const successCount = response.filter((result) => result.success).length;
        const failureCount = response.length - successCount;

        this.messages.add({
          severity: failureCount ? 'warn' : 'success',
          summary: this.processedSummary(),
          detail: this.processedDetail(response, successCount, failureCount),
        });
      },
      error: (error: HttpErrorResponse) => {
        const message = this.errorMessage(error);
        this.uploadQueue.update((items) =>
          items.map((item): UploadQueueItem => ({
            ...item,
            status: item.status === 'uploading' ? 'failed' : item.status,
            error: item.status === 'uploading' ? message : item.error,
            result: item.status === 'uploading' ? null : item.result,
          })),
        );
        this.messages.add({
          severity: 'error',
          summary: 'Upload non riuscito',
          detail: message,
        });
      },
      complete: () => this.uploading.set(false),
    });
  }

  private applyUploadResults(results: BatchUploadResult[]): void {
    const remainingResults = [...results];

    this.uploadQueue.update((items) =>
      items.map((item): UploadQueueItem => {
        if (item.status !== 'uploading') {
          return item;
        }

        const resultIndex = remainingResults.findIndex(
          (result) => result.fileName === item.fileName,
        );
        const result = resultIndex >= 0 ? remainingResults.splice(resultIndex, 1)[0] : null;

        if (!result) {
          return {
            ...item,
            status: 'failed',
            result: null,
            error: 'Il backend non ha restituito un esito per questo file.',
          };
        }

        return {
          ...item,
          status: result.success ? 'success' : 'failed',
          result,
          error: result.error,
        };
      }),
    );
  }

  private fileKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  private processedSummary(): string {
    const summaries: Record<UploadKind, string> = {
      orders: 'Ordini processati',
      invoices: 'Fatture processate',
      'paid-order-items': 'Pagamenti processati',
    };

    return summaries[this.kind()];
  }

  private processedDetail(
    response: BatchUploadResult[],
    successCount: number,
    failureCount: number,
  ): string {
    if (this.kind() !== 'paid-order-items') {
      return `${successCount} salvati, ${failureCount} errori.`;
    }

    const totals = response.reduce(
      (accumulator, result) => {
        const item = result.item;
        return {
          importedItems: accumulator.importedItems + this.numberValue(item?.['importedItems']),
          duplicateItems: accumulator.duplicateItems + this.numberValue(item?.['duplicateItems']),
          skippedRows: accumulator.skippedRows + this.numberValue(item?.['skippedRows']),
        };
      },
      { importedItems: 0, duplicateItems: 0, skippedRows: 0 },
    );

    const failureDetail = failureCount > 0 ? ` ${failureCount} file con errori.` : '';
    return `${totals.importedItems} righe nuove, ${totals.duplicateItems} già presenti, ${totals.skippedRows} scartate.${failureDetail}`;
  }

  private numberValue(value: unknown): number {
    return typeof value === 'number' ? value : 0;
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    if (typeof error.message === 'string' && error.message.length > 0) {
      return error.message;
    }

    return 'Il backend non ha risposto correttamente.';
  }
}

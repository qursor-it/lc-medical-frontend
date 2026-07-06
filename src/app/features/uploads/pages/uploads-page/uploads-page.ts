import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';

import { uploadPanelConfigs } from '../../../../core/document-upload.config';
import { BatchUploadResult, UploadKind, UploadPanelConfig } from '../../../../core/models/upload.models';
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

  protected readonly results = signal<BatchUploadResult[]>([]);
  protected readonly uploading = signal(false);
  protected readonly kind = signal<UploadKind>(this.route.snapshot.data['kind'] as UploadKind);

  protected readonly config = computed<UploadPanelConfig>(() => uploadPanelConfigs[this.kind()]);
  protected readonly successfulUploads = computed(() =>
    this.results().filter((result) => result.success).length,
  );
  protected readonly failedUploads = computed(() =>
    this.results().filter((result) => !result.success).length,
  );

  constructor() {
    this.route.data.subscribe((data) => {
      this.kind.set(data['kind'] as UploadKind);
      this.results.set([]);
    });
  }

  protected upload(files: File[]): void {
    if (!files.length) {
      this.messages.add({
        severity: 'warn',
        summary: 'Nessun file selezionato',
        detail: 'Seleziona almeno un PDF da caricare.',
      });
      return;
    }

    this.uploading.set(true);

    this.uploadService.uploadBatch(this.kind(), files).subscribe({
      next: (response) => {
        this.results.set(response);
        const successCount = response.filter((result) => result.success).length;
        const failureCount = response.length - successCount;

        this.messages.add({
          severity: failureCount ? 'warn' : 'success',
          summary: this.kind() === 'orders' ? 'Ordini processati' : 'Invoice processate',
          detail: `${successCount} salvati, ${failureCount} errori.`,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.results.set([]);
        this.messages.add({
          severity: 'error',
          summary: 'Upload non riuscito',
          detail: this.errorMessage(error),
        });
      },
      complete: () => this.uploading.set(false),
    });
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

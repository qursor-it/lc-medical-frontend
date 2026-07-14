import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { BatchUploadResult, PaidOrderItemsImportResult, UploadKind } from '../models/upload.models';

@Injectable({ providedIn: 'root' })
export class DocumentUploadService {
  private readonly http = inject(HttpClient);

  uploadBatch(kind: UploadKind, files: File[]): Observable<BatchUploadResult[]> {
    if (kind === 'paid-order-items') {
      return this.uploadPaidOrderItems(files);
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('file', file, file.name));

    return this.http.post<BatchUploadResult[]>(`/api/${kind}/ingest/batch`, formData);
  }

  private uploadPaidOrderItems(files: File[]): Observable<BatchUploadResult[]> {
    if (!files.length) {
      return of([]);
    }

    return forkJoin(files.map((file) => this.uploadPaidOrderItemsFile(file)));
  }

  private uploadPaidOrderItemsFile(
    file: File,
  ): Observable<BatchUploadResult<PaidOrderItemsImportResult>> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http
      .post<PaidOrderItemsImportResult>('/api/paid-order-items/ingest', formData)
      .pipe(
        map((result) => ({
          fileName: result.fileName || file.name,
          success: true,
          item: result,
          error: null,
        })),
        catchError((error: HttpErrorResponse) =>
          of({
            fileName: file.name,
            success: false,
            item: null,
            error: this.errorMessage(error),
          }),
        ),
      );
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }

    if (typeof error.message === 'string' && error.message.length > 0) {
      return error.message;
    }

    return 'Il backend non ha risposto correttamente.';
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BatchUploadResult, UploadKind } from '../models/upload.models';

@Injectable({ providedIn: 'root' })
export class DocumentUploadService {
  private readonly http = inject(HttpClient);

  uploadBatch(kind: UploadKind, files: File[]): Observable<BatchUploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('file', file, file.name));

    return this.http.post<BatchUploadResult[]>(`/api/${kind}/extract-text/batch`, formData);
  }
}

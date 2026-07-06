import { Component, input, output } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import type { FileUploadHandlerEvent } from 'primeng/types/fileupload';

import { UploadPanelConfig } from '../../../core/models/upload.models';

@Component({
  selector: 'app-document-upload-panel',
  imports: [FileUploadModule, TagModule],
  templateUrl: './document-upload-panel.html',
})
export class DocumentUploadPanel {
  readonly config = input.required<UploadPanelConfig>();
  readonly uploading = input(false);
  readonly uploadRequested = output<File[]>();

  protected handleUpload(event: FileUploadHandlerEvent): void {
    this.uploadRequested.emit(event.files);
  }
}

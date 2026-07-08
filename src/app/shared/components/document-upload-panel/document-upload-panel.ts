import { Component, input, output } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import type { FileRemoveEvent, FileSelectEvent } from 'primeng/types/fileupload';

import { UploadPanelConfig } from '../../../core/models/upload.models';

@Component({
  selector: 'app-document-upload-panel',
  imports: [FileUploadModule, TagModule],
  templateUrl: './document-upload-panel.html',
})
export class DocumentUploadPanel {
  readonly config = input.required<UploadPanelConfig>();
  readonly files = input<File[]>([]);
  readonly uploading = input(false);
  readonly selectedFilesChanged = output<File[]>();

  protected handleSelect(event: FileSelectEvent): void {
    this.selectedFilesChanged.emit(event.currentFiles);
  }

  protected handleRemove(event: FileRemoveEvent): void {
    this.selectedFilesChanged.emit(this.files().filter((file) => file !== event.file));
  }

  protected handleClear(): void {
    this.selectedFilesChanged.emit([]);
  }
}

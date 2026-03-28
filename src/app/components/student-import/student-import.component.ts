import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ImportResult {
  successCount: number;
  failedCount: number;
  failedList: string[];
}

@Component({
  selector: 'app-student-import',
  standalone: false,
  templateUrl: './student-import.component.html',
  styleUrls: ['./student-import.component.css'],
})
export class StudentImportComponent {
  private readonly apiBase = `${environment.apiUrl}/users/student`;

  // Upload state
  selectedFile: File | null = null;
  isDragOver = false;
  isUploading = false;
  uploadProgress = 0;
  importResult: ImportResult | null = null;
  errorMessage = '';

  // Download state
  isDownloading = false;
  downloadError = '';

  constructor(private http: HttpClient) {}

  // ─── Drag & Drop ──────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.setFile(files[0]);
    }
  }

  // ─── File Selection ───────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setFile(input.files[0]);
      input.value = '';
    }
  }

  private setFile(file: File): void {
    const allowedMime = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const allowedExt = /\.(xlsx|xls)$/i;

    if (!allowedMime.includes(file.type) && !allowedExt.test(file.name)) {
      this.errorMessage = 'Only Excel files (.xlsx, .xls) are accepted.';
      this.importResult = null;
      return;
    }

    this.selectedFile = file;
    this.clearMessages();
  }

  removeFile(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.clearMessages();
  }

  // ─── Upload ───────────────────────────────────────────

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    this.clearMessages();

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http
      .post<ImportResult>(`${this.apiBase}/import`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            // Show real upload progress
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            // Always stop the spinner here — regardless of successCount/failedCount
            this.stopUploading();

            const body = (event as HttpResponse<ImportResult>).body;
            this.importResult = {
              successCount: body?.successCount ?? 0,
              failedCount: body?.failedCount ?? 0,
              failedList: body?.failedList ?? [],
            };
          }
        },
        error: (err) => {
          // Always stop the spinner here too — for real HTTP errors (4xx, 5xx, network)
          this.stopUploading();
          this.importResult = null;
          this.errorMessage =
            err?.error?.message ||
            err?.error?.title ||
            'An error occurred while uploading. Please try again.';
        },
      });
  }

  private stopUploading(): void {
    this.isUploading = false;
    this.uploadProgress = 0;
    this.selectedFile = null;
  }

  // ─── Download Sample Excel ────────────────────────────

  downloadSampleExcel(): void {
    this.isDownloading = true;
    this.downloadError = '';

    this.http
      .get(`${this.apiBase}/sample-excel`, {
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (response) => {
          const blob = response.body!;
          const disposition = response.headers.get('Content-Disposition');
          const filename = this.extractFilename(disposition) ?? 'Student_Template.xlsx';
          this.triggerDownload(blob, filename);
          this.isDownloading = false;
        },
        error: (err) => {
          this.isDownloading = false;
          this.downloadError = 'Failed to download the template. Please try again.';
          console.error('Download error:', err);
        },
      });
  }

  private extractFilename(disposition: string | null): string | null {
    if (!disposition) return null;
    const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]*)\1/);
    return match ? match[2] : null;
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
    anchor.remove();
  }

  // ─── Helpers ──────────────────────────────────────────

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  private clearMessages(): void {
    this.importResult = null;
    this.errorMessage = '';
    this.downloadError = '';
  }
}

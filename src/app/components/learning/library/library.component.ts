import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionService } from '../../../auth/permission.service';

const BASE_URL = environment.apiUrl;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl?: string;
  fileUrl?: string;
  isDownloadable: boolean;
  isWatermarkRequired: boolean;
  createdAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  classId: string;
}

type ModalMode = 'create' | 'view' | 'delete' | null;

@Component({
  selector: 'app-library',
  standalone: false,
  templateUrl: './library.component.html',
  styleUrls: ['../../../shared-page.css', './library.component.css'],
})
export class LibraryComponent implements OnInit {
  books: Book[] = [];
  filteredBooks: Book[] = [];

  searchQuery = '';
  downloadableFilter = '';
  isLoading = false;
  isSubmitting = false;
  subjects: Subject[] = [];
  formSubjectId = '';
  subjectError = '';

  modalMode: ModalMode = null;
  selectedBook: Book | null = null;

  // ── Form fields ──────────────────────────────────────────────
  formTitle = '';
  formAuthor = '';
  formDescription = '';
  formIsDownloadable = true;
  formIsWatermarkRequired = false;
  formCoverImageFile: File | null = null;
  formFile: File | null = null;
  formCoverImagePreview = '';

  // ── Validation ───────────────────────────────────────────────
  titleError = '';
  authorError = '';
  descriptionError = '';
  fileError = '';

  // ─── Job ─────────────────────────────────────────────────────
  uploadJobId: string | null = null;
  uploadPollInterval: any = null;

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadBooks();
    this.loadSubjects();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ════════════════════════════════════════════════════════════════
  //  API CALLS
  // ════════════════════════════════════════════════════════════════

  /** GET /api/books */
  loadBooks(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/books').subscribe({
      next: (res: any) => {
        this.books = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load books.');
        this.isLoading = false;
      },
    });
  }

  loadSubjects(): void {
    this.httpService.getData(BASE_URL, '/subject').subscribe({
      next: (res: any) => {
        this.subjects = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {
        this.commonService.error('Failed to load subjects.');
      },
    });
  }

  /** POST /api/books  (multipart/form-data) */
  createBook(): void {
    if (!this.validateForm()) return;
    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('Title', this.formTitle.trim());
    formData.append('Author', this.formAuthor.trim());
    formData.append('Description', this.formDescription.trim());
    formData.append('IsDownloadable', String(this.formIsDownloadable));
    formData.append('IsWatermarkRequired', String(this.formIsWatermarkRequired));
    formData.append('SubjectId', this.formSubjectId);
    if (this.formCoverImageFile) {
      formData.append('CoverImage', this.formCoverImageFile, this.formCoverImageFile.name);
    }
    if (this.formFile) {
      formData.append('File', this.formFile, this.formFile.name);
    }

    this.httpService.postData(BASE_URL, '/books', formData).subscribe({
      next: (res: any) => {
        // this.commonService.success(`"${this.formTitle.trim()}" uploaded successfully.`);
        // this.closeModal();
        // this.loadBooks();
        // this.isSubmitting = false;
        this.uploadJobId = res.jobId;
        this.isSubmitting = false;
        this.closeModal();
        this.commonService.success('Upload started! We\'ll notify you when it\'s ready.');
        this.startPolling(res.jobId);
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to upload book.');
        this.isSubmitting = false;
      },
    });
  }

  startPolling(jobId: string): void {
    this.uploadPollInterval = setInterval(() => {
      this.httpService.getData(BASE_URL, `/books/job/${jobId}`).subscribe({
        next: (res: any) => {
          if (res.status === 'done') {
            this.stopPolling();
            this.commonService.success(res.message || 'Book uploaded successfully!');
            this.loadBooks();
          } else if (res.status === 'failed') {
            this.stopPolling();
            this.commonService.error(res.message || 'Upload failed. Please try again.');
          }
        },
        error: () => {
          this.stopPolling();
          this.commonService.error('Could not check upload status.');
        },
      });
    }, 3000);
    setTimeout(() => this.stopPolling(), 10 * 60 * 1000);
  }

  stopPolling(): void {
    if (this.uploadPollInterval) {
      clearInterval(this.uploadPollInterval);
      this.uploadPollInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  /** DELETE /api/books/{id} */
  deleteBook(): void {
    if (!this.selectedBook) return;
    this.httpService.deleteData(BASE_URL, `/books/${this.selectedBook.id}`).subscribe({
      next: () => {
        this.commonService.success(`"${this.selectedBook!.title}" deleted.`);
        this.closeModal();
        this.loadBooks();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to delete book.');
      },
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  MODAL HELPERS
  // ════════════════════════════════════════════════════════════════

  openCreateModal(): void {
    this.resetForm();
    this.selectedBook = null;
    this.modalMode = 'create';
  }

  openViewModal(book: Book): void {
    this.selectedBook = { ...book };
    this.modalMode = 'view';
  }

  openDeleteModal(book: Book): void {
    this.selectedBook = { ...book };
    this.modalMode = 'delete';
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedBook = null;
    this.clearErrors();
    this.formCoverImagePreview = '';
    this.formCoverImageFile = null;
    this.formFile = null;
  }

  // ════════════════════════════════════════════════════════════════
  //  FILE HANDLERS
  // ════════════════════════════════════════════════════════════════

  onCoverImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.formCoverImageFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.formCoverImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.formFile = input.files[0];
    this.fileError = '';
  }

  removeCoverImage(): void {
    this.formCoverImageFile = null;
    this.formCoverImagePreview = '';
  }

  removeFile(): void {
    this.formFile = null;
  }

  // ════════════════════════════════════════════════════════════════
  //  VALIDATION & FORM
  // ════════════════════════════════════════════════════════════════

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.formTitle.trim()) {
      this.titleError = 'Title is required.';
      valid = false;
    }
    if (!this.formAuthor.trim()) {
      this.authorError = 'Author is required.';
      valid = false;
    }
    if (!this.formDescription.trim()) {
      this.descriptionError = 'Description is required.';
      valid = false;
    }
    if (!this.formFile) {
      this.fileError = 'Please select a file to upload.';
      valid = false;
    }
    if (!this.formSubjectId) {
      this.subjectError = 'Please select a subject.';
      valid = false;
    }
    return valid;
  }

  clearErrors(): void {
    this.titleError = '';
    this.authorError = '';
    this.descriptionError = '';
    this.fileError = '';
    this.subjectError = '';
  }

  resetForm(): void {
    this.formTitle = '';
    this.formAuthor = '';
    this.formDescription = '';
    this.formIsDownloadable = true;
    this.formIsWatermarkRequired = false;
    this.formCoverImageFile = null;
    this.formFile = null;
    this.formCoverImagePreview = '';
    this.formSubjectId = '';
    this.clearErrors();
  }

  // ════════════════════════════════════════════════════════════════
  //  FILTERS & HELPERS
  // ════════════════════════════════════════════════════════════════

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.books];

    if (this.downloadableFilter === 'yes') {
      list = list.filter((b) => b.isDownloadable);
    } else if (this.downloadableFilter === 'no') {
      list = list.filter((b) => !b.isDownloadable);
    }

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q),
      );
    }

    this.filteredBooks = list;
  }

  getInitials(title: string): string {
    if (!title) return '?';
    const words = title.trim().split(' ');
    return words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : words[0].substring(0, 2).toUpperCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getFileLabel(file: File | null): string {
    if (!file) return '';
    const kb = file.size / 1024;
    const size = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
    return `${file.name} (${size})`;
  }

  openFile(url?: string): void {
    if (url) window.open(url, '_blank');
  }

  get downloadableCount(): number {
    return this.books.filter((b) => b.isDownloadable).length;
  }

  get watermarkedCount(): number {
    return this.books.filter((b) => b.isWatermarkRequired).length;
  }
}

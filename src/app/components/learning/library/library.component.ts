import { Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';

export interface LibraryResource {
  id: number;
  title: string;
  subject: string;
  type: 'PDF' | 'Video' | 'Notes' | 'Presentation';
  batch: string;
  uploadedBy: string;
  fileSize: string;
  downloads: number;
  status: 'active' | 'draft' | 'archived';
  uploadDate: string;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-library',
  standalone: false,
  templateUrl: './library.component.html',
  styleUrls: ['../../../shared-page.css', './library.component.css']
})
export class LibraryComponent {
  searchQuery = '';
  typeFilter = '';
  statusFilter = '';

  modalMode: ModalMode = null;
  selectedResource: LibraryResource | null = null;

  // Form fields
  formTitle = '';
  formSubject = '';
  formType: 'PDF' | 'Video' | 'Notes' | 'Presentation' = 'PDF';
  formBatch = '';
  formUploadedBy = '';
  formFileSize = '';
  formStatus: 'active' | 'draft' | 'archived' = 'active';

  // Validation
  formTitleError = '';
  formSubjectError = '';
  formUploadedByError = '';

  nextId = 11;

  resources: LibraryResource[] = [
    { id: 1,  title: 'Mathematics Formula Sheet – Grade 10 & 11',      subject: 'Mathematics',    type: 'PDF',          batch: 'Grade 10 & 11',       uploadedBy: 'Dr. Vikram Sharma',  fileSize: '3.2 MB',  downloads: 1248, status: 'active',   uploadDate: '2026-01-10' },
    { id: 2,  title: 'Physics – Mechanics Complete Video Lectures',     subject: 'Physics',        type: 'Video',        batch: 'Grade 11 – Batch A',  uploadedBy: 'Mr. Rahul Gupta',    fileSize: '820 MB',  downloads: 876,  status: 'active',   uploadDate: '2026-01-18' },
    { id: 3,  title: 'Chemistry – Organic Reactions Notes',             subject: 'Chemistry',      type: 'Notes',        batch: 'Grade 10 – Batch A',  uploadedBy: 'Ms. Pooja Iyer',     fileSize: '4.6 MB',  downloads: 964,  status: 'active',   uploadDate: '2026-01-25' },
    { id: 4,  title: 'Biology – Human Body Systems Slides',             subject: 'Biology',        type: 'Presentation', batch: 'Grade 10 – Batch B',  uploadedBy: 'Dr. Meena Krishnan', fileSize: '12.4 MB', downloads: 742,  status: 'active',   uploadDate: '2026-02-05' },
    { id: 5,  title: 'Mathematics – Calculus & Integration Guide',      subject: 'Mathematics',    type: 'PDF',          batch: 'Grade 12 – Batch A',  uploadedBy: 'Dr. Kiran Patel',    fileSize: '5.8 MB',  downloads: 682,  status: 'active',   uploadDate: '2026-02-12' },
    { id: 6,  title: 'Chemistry – Inorganic Chemistry Video Series',    subject: 'Chemistry',      type: 'Video',        batch: 'Grade 11 – Batch A',  uploadedBy: 'Dr. Sanjay Mishra',  fileSize: '560 MB',  downloads: 598,  status: 'active',   uploadDate: '2026-02-20' },
    { id: 7,  title: 'English – Essay Writing & Grammar Notes',         subject: 'English',        type: 'Notes',        batch: 'Grade 9 – Batch A',   uploadedBy: 'Ms. Divya Nair',     fileSize: '2.1 MB',  downloads: 524,  status: 'active',   uploadDate: '2026-03-01' },
    { id: 8,  title: 'History – World Wars – Analysis Slides',          subject: 'History',        type: 'Presentation', batch: 'Grade 10 – All',      uploadedBy: 'Dr. Vikram Sharma',  fileSize: '18.2 MB', downloads: 488,  status: 'active',   uploadDate: '2026-03-06' },
    { id: 9,  title: 'Computer Science – Data Structures Problem Set',  subject: 'Computer Sci.',  type: 'PDF',          batch: 'Grade 12 – Batch A',  uploadedBy: 'Mr. Arjun Verma',    fileSize: '6.4 MB',  downloads: 412,  status: 'draft',    uploadDate: '2026-03-10' },
    { id: 10, title: 'Physics – Electricity & Magnetism Concept Video', subject: 'Physics',        type: 'Video',        batch: 'Grade 11 & 12',       uploadedBy: 'Dr. Vikram Sharma',  fileSize: '380 MB',  downloads: 356,  status: 'active',   uploadDate: '2026-03-12' },
  ];

  constructor(private commonService: CommonService) {}

  get filteredResources(): LibraryResource[] {
    const q = this.searchQuery.toLowerCase();
    return this.resources.filter(r => {
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q) || r.uploadedBy.toLowerCase().includes(q) || r.batch.toLowerCase().includes(q);
      const matchType = !this.typeFilter || r.type === this.typeFilter;
      const matchStatus = !this.statusFilter || r.status === this.statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }

  get pdfCount(): number { return this.resources.filter(r => r.type === 'PDF').length; }
  get videoCount(): number { return this.resources.filter(r => r.type === 'Video').length; }
  get notesCount(): number { return this.resources.filter(r => r.type === 'Notes').length; }
  get totalDownloads(): number { return this.resources.reduce((s, r) => s + r.downloads, 0); }

  openUploadModal(): void {
    this.modalMode = 'create';
    this.selectedResource = null;
    this.formTitle = ''; this.formSubject = ''; this.formType = 'PDF'; this.formBatch = '';
    this.formUploadedBy = ''; this.formFileSize = ''; this.formStatus = 'active';
    this.clearErrors();
  }

  openEditModal(res: LibraryResource): void {
    this.modalMode = 'edit';
    this.selectedResource = res;
    this.formTitle = res.title; this.formSubject = res.subject; this.formType = res.type;
    this.formBatch = res.batch; this.formUploadedBy = res.uploadedBy; this.formFileSize = res.fileSize; this.formStatus = res.status;
    this.clearErrors();
  }

  openViewModal(res: LibraryResource): void { this.modalMode = 'view'; this.selectedResource = res; }
  openDeleteModal(res: LibraryResource): void { this.modalMode = 'delete'; this.selectedResource = res; }
  closeModal(): void { this.modalMode = null; this.selectedResource = null; this.clearErrors(); }

  clearErrors(): void { this.formTitleError = ''; this.formSubjectError = ''; this.formUploadedByError = ''; }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;
    if (!this.formTitle.trim()) { this.formTitleError = 'Title is required.'; valid = false; }
    if (!this.formSubject.trim()) { this.formSubjectError = 'Subject is required.'; valid = false; }
    if (!this.formUploadedBy.trim()) { this.formUploadedByError = 'Uploaded by is required.'; valid = false; }
    return valid;
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    const today = new Date().toISOString().split('T')[0];
    if (this.modalMode === 'create') {
      this.resources.unshift({
        id: this.nextId++,
        title: this.formTitle.trim(),
        subject: this.formSubject.trim(),
        type: this.formType,
        batch: this.formBatch.trim() || 'All Batches',
        uploadedBy: this.formUploadedBy.trim(),
        fileSize: this.formFileSize.trim() || '—',
        downloads: 0,
        status: this.formStatus,
        uploadDate: today
      });
      this.commonService.success(`Resource "${this.formTitle.trim()}" uploaded.`);
    } else if (this.modalMode === 'edit' && this.selectedResource) {
      const idx = this.resources.findIndex(r => r.id === this.selectedResource!.id);
      if (idx > -1) {
        this.resources[idx] = { ...this.resources[idx], title: this.formTitle.trim(), subject: this.formSubject.trim(), type: this.formType, batch: this.formBatch.trim(), uploadedBy: this.formUploadedBy.trim(), fileSize: this.formFileSize.trim(), status: this.formStatus };
      }
      this.commonService.success('Resource updated.');
    }
    this.closeModal();
  }

  deleteResource(): void {
    if (!this.selectedResource) return;
    this.resources = this.resources.filter(r => r.id !== this.selectedResource!.id);
    this.commonService.success(`Resource "${this.selectedResource.title}" deleted.`);
    this.closeModal();
  }

  getTypeChipClass(type: string): string {
    const map: Record<string, string> = { PDF: 'res-type res-type--pdf', Video: 'res-type res-type--video', Notes: 'res-type res-type--notes', Presentation: 'res-type res-type--ppt' };
    return map[type] || 'res-type';
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = { PDF: 'fa-file-pdf', Video: 'fa-video', Notes: 'fa-note-sticky', Presentation: 'fa-file-powerpoint' };
    return map[type] || 'fa-file';
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = { active: 'pg-badge--green', draft: 'pg-badge--yellow', archived: 'pg-badge--gray' };
    return map[status] || 'pg-badge--gray';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionService } from '../../../auth/permission.service';

const BASE_URL = environment.apiUrl;

export interface ClassEntry {
  id: string;
  name: string;
  description: string | null;
  boardId: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  classId: string;
  class?: ClassEntry;
}

export interface SubjectPayload {
  name: string;
  description: string | null;
  classId: string;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-subjects',
  standalone: false,
  templateUrl: './subjects.component.html',
  styleUrls: ['../../../shared-page.css', './subjects.component.css'],
})
export class SubjectsComponent implements OnInit {
  subjects: Subject[] = [];
  filteredSubjects: Subject[] = [];
  classes: ClassEntry[] = [];

  searchQuery: string = '';
  selectedClassFilter: string = '';
  isLoading: boolean = false;

  // Modal state
  modalMode: ModalMode = null;
  selectedSubject: Subject | null = null;

  // Form fields
  formName: string = '';
  formDescription: string = '';
  formClassId: string = '';

  // Validation
  nameError: string = '';
  classError: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadClasses();
    this.loadSubjects();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ─── API Calls ──────────────────────────────────────────────

  loadClasses(): void {
    this.httpService.getData(BASE_URL, '/class').subscribe({
      next: (res: any) => {
        this.classes = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {
        this.commonService.error('Failed to load classes.');
      },
    });
  }

  loadSubjects(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/subject').subscribe({
      next: (res: any) => {
        this.subjects = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load subjects.');
        this.isLoading = false;
      },
    });
  }

  createSubject(): void {
    const payload: SubjectPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || null,
      classId: this.formClassId,
    };
    this.httpService.postData(BASE_URL, '/subject', payload).subscribe({
      next: () => {
        this.commonService.success(
          `Subject "${payload.name}" created successfully.`,
        );
        this.closeModal();
        this.loadSubjects();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to create subject.';
        this.commonService.error(msg);
      },
    });
  }

  updateSubject(): void {
    if (!this.selectedSubject) return;
    const payload: SubjectPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || null,
      classId: this.formClassId,
    };
    this.httpService
      .putData(BASE_URL, `/subject/${this.selectedSubject.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Subject "${payload.name}" updated successfully.`,
          );
          this.closeModal();
          this.loadSubjects();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to update subject.';
          this.commonService.error(msg);
        },
      });
  }

  deleteSubject(): void {
    if (!this.selectedSubject) return;
    this.httpService
      .deleteData(BASE_URL, `/subject/${this.selectedSubject.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Subject "${this.selectedSubject!.name}" deleted successfully.`,
          );
          this.closeModal();
          this.loadSubjects();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to delete subject.';
          this.commonService.error(msg);
        },
      });
  }

  // ─── Modal Helpers ───────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedSubject = null;
    this.formName = '';
    this.formDescription = '';
    this.formClassId = '';
    this.clearErrors();
  }

  openEditModal(subject: Subject): void {
    this.modalMode = 'edit';
    this.selectedSubject = subject;
    this.formName = subject.name;
    this.formDescription = subject.description ?? '';
    this.formClassId = subject.classId;
    this.clearErrors();
  }

  openViewModal(subject: Subject): void {
    this.modalMode = 'view';
    this.selectedSubject = subject;
  }

  openDeleteModal(subject: Subject): void {
    this.modalMode = 'delete';
    this.selectedSubject = subject;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedSubject = null;
    this.clearErrors();
  }

  clearErrors(): void {
    this.nameError = '';
    this.classError = '';
  }

  // ─── Form Submit ─────────────────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.createSubject();
    } else if (this.modalMode === 'edit') {
      this.updateSubject();
    }
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    const trimmed = this.formName.trim();
    if (!trimmed) {
      this.nameError = 'Subject name is required.';
      valid = false;
    } else {
      const duplicate = this.subjects.find(
        (s) =>
          s.name.toLowerCase() === trimmed.toLowerCase() &&
          s.classId === this.formClassId &&
          s.id !== this.selectedSubject?.id,
      );
      if (duplicate) {
        this.nameError =
          'A subject with this name already exists for the selected class.';
        valid = false;
      }
    }

    if (!this.formClassId) {
      this.classError = 'Please select a class.';
      valid = false;
    }

    return valid;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getClassName(classId: string): string {
    return this.classes.find((c) => c.id === classId)?.name ?? '—';
  }

  // Classes that actually appear in loaded subjects (for filter dropdown)
  get classFilterOptions(): ClassEntry[] {
    const ids = [...new Set(this.subjects.map((s) => s.classId))];
    return this.classes.filter((c) => ids.includes(c.id));
  }

  onSearch(): void {
    this.applyFilters();
  }
  onClassFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.subjects];
    if (this.selectedClassFilter) {
      list = list.filter((s) => s.classId === this.selectedClassFilter);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          this.getClassName(s.classId).toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q),
      );
    }
    this.filteredSubjects = list;
  }
}

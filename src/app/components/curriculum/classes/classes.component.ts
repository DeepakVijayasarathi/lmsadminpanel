import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionService } from '../../../auth/permission.service';

const BASE_URL = environment.apiUrl;

export interface Board {
  id: string;
  name: string;
  description: string;
}

export interface ClassEntry {
  id: string;
  name: string;
  description: string | null;
  boardId: string;
  board?: Board;
}

export interface ClassPayload {
  name: string;
  description: string | null;
  boardId: string;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-classes',
  standalone: false,
  templateUrl: './classes.component.html',
  styleUrls: ['../../../shared-page.css', './classes.component.css'],
})
export class ClassesComponent implements OnInit {
  classes: ClassEntry[] = [];
  filteredClasses: ClassEntry[] = [];
  boards: Board[] = [];

  searchQuery: string = '';
  selectedBoardFilter: string = '';
  isLoading: boolean = false;

  // Modal state
  modalMode: ModalMode = null;
  selectedClass: ClassEntry | null = null;

  // Form fields
  formName: string = '';
  formDescription: string = '';
  formBoardId: string = '';

  // Validation
  nameError: string = '';
  boardError: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadBoards();
    this.loadClasses();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ─── API Calls ──────────────────────────────────────────────

  loadBoards(): void {
    this.httpService.getData(BASE_URL, '/board').subscribe({
      next: (res: any) => {
        this.boards = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {
        this.commonService.error('Failed to load boards.');
      },
    });
  }

  loadClasses(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/class').subscribe({
      next: (res: any) => {
        this.classes = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load classes.');
        this.isLoading = false;
      },
    });
  }

  createClass(): void {
    const payload: ClassPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || null,
      boardId: this.formBoardId,
    };
    this.httpService.postData(BASE_URL, '/class', payload).subscribe({
      next: () => {
        this.commonService.success(
          `Class "${payload.name}" created successfully.`,
        );
        this.closeModal();
        this.loadClasses();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to create class.';
        this.commonService.error(msg);
      },
    });
  }

  updateClass(): void {
    if (!this.selectedClass) return;
    const payload: ClassPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || null,
      boardId: this.formBoardId,
    };
    this.httpService
      .putData(BASE_URL, `/class/${this.selectedClass.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Class "${payload.name}" updated successfully.`,
          );
          this.closeModal();
          this.loadClasses();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to update class.';
          this.commonService.error(msg);
        },
      });
  }

  deleteClass(): void {
    if (!this.selectedClass) return;
    this.httpService
      .deleteData(BASE_URL, `/class/${this.selectedClass.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Class "${this.selectedClass!.name}" deleted successfully.`,
          );
          this.closeModal();
          this.loadClasses();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to delete class.';
          this.commonService.error(msg);
        },
      });
  }

  // ─── Modal Helpers ───────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedClass = null;
    this.formName = '';
    this.formDescription = '';
    this.formBoardId = '';
    this.clearErrors();
  }

  openEditModal(cls: ClassEntry): void {
    this.modalMode = 'edit';
    this.selectedClass = cls;
    this.formName = cls.name;
    this.formDescription = cls.description ?? '';
    this.formBoardId = cls.boardId;
    this.clearErrors();
  }

  openViewModal(cls: ClassEntry): void {
    this.modalMode = 'view';
    this.selectedClass = cls;
  }

  openDeleteModal(cls: ClassEntry): void {
    this.modalMode = 'delete';
    this.selectedClass = cls;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedClass = null;
    this.clearErrors();
  }

  clearErrors(): void {
    this.nameError = '';
    this.boardError = '';
  }

  // ─── Form Submit ─────────────────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.createClass();
    } else if (this.modalMode === 'edit') {
      this.updateClass();
    }
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    const trimmed = this.formName.trim();
    if (!trimmed) {
      this.nameError = 'Class name is required.';
      valid = false;
    } else {
      const duplicate = this.classes.find(
        (c) =>
          c.name.toLowerCase() === trimmed.toLowerCase() &&
          c.boardId === this.formBoardId &&
          c.id !== this.selectedClass?.id,
      );
      if (duplicate) {
        this.nameError =
          'A class with this name already exists for the selected board.';
        valid = false;
      }
    }

    if (!this.formBoardId) {
      this.boardError = 'Please select a board.';
      valid = false;
    }

    return valid;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getBoardName(boardId: string): string {
    return this.boards.find((b) => b.id === boardId)?.name ?? '—';
  }

  // Unique boards present in loaded classes (for filter dropdown)
  get boardFilterOptions(): Board[] {
    const ids = [...new Set(this.classes.map((c) => c.boardId))];
    return this.boards.filter((b) => ids.includes(b.id));
  }

  onSearch(): void {
    this.applyFilters();
  }
  onBoardFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.classes];
    if (this.selectedBoardFilter) {
      list = list.filter((c) => c.boardId === this.selectedBoardFilter);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          this.getBoardName(c.boardId).toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q),
      );
    }
    this.filteredClasses = list;
  }
}

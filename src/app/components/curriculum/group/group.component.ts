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

export interface GroupEntry {
  id: string;
  name: string;
  description: string | null;
  classId: string;
  order: number | null;
}

export interface GroupPayload {
  name: string;
  description: string | null;
  order: number | null;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-groups',
  standalone: false,
  templateUrl: './group.component.html',
  styleUrls: ['../../../shared-page.css', './group.component.css'],
})
export class GroupComponent implements OnInit {
  groups: GroupEntry[] = [];
  filteredGroups: GroupEntry[] = [];
  classes: ClassEntry[] = [];

  searchQuery: string = '';
  selectedClassFilter: string = '';
  isLoading: boolean = false;

  // Modal state
  modalMode: ModalMode = null;
  selectedGroup: GroupEntry | null = null;

  // Form fields
  formName: string = '';
  formDescription: string = '';
  formClassId: string = '';
  formOrder: number | null = null;

  // Validation
  nameError: string = '';
  classError: string = '';

  pageSize = 10;
  currentPage = 1;

  get pagedGroups(): GroupEntry[] {
    return this.filteredGroups.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredGroups.length / this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadClasses();
    this.loadGroups();
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

  loadGroups(): void {
    this.isLoading = true;

    // If a class filter is already selected, load by class; else load all
    const endpoint = this.selectedClassFilter
      ? `/groups/by-class/${this.selectedClassFilter}`
      : '/groups';

    this.httpService.getData(BASE_URL, endpoint).subscribe({
      next: (res: any) => {
        this.groups = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load groups.');
        this.isLoading = false;
      },
    });
  }

  loadGroupsByClass(classId: string): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, `/groups/by-class/${classId}`).subscribe({
      next: (res: any) => {
        this.groups = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load groups.');
        this.isLoading = false;
      },
    });
  }

  createGroup(): void {
    if (!this.formClassId) return;
    const payload: GroupPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || null,
      order: this.formOrder ?? null,
    };
    this.httpService
      .postData(BASE_URL, `/groups`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Group "${payload.name}" created successfully.`,
          );
          this.closeModal();
          this.loadGroups();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to create group.';
          this.commonService.error(msg);
        },
      });
  }

  updateGroup(): void {
    if (!this.selectedGroup) return;
    const payload: GroupPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || null,
      order: this.formOrder ?? null,
    };
    this.httpService
      .putData(BASE_URL, `/groups/${this.selectedGroup.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Group "${payload.name}" updated successfully.`,
          );
          this.closeModal();
          this.loadGroups();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to update group.';
          this.commonService.error(msg);
        },
      });
  }

  deleteGroup(): void {
    if (!this.selectedGroup) return;
    this.httpService
      .deleteData(BASE_URL, `/groups/${this.selectedGroup.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Group "${this.selectedGroup!.name}" deleted successfully.`,
          );
          this.closeModal();
          this.loadGroups();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to delete group.';
          this.commonService.error(msg);
        },
      });
  }

  // ─── Modal Helpers ───────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedGroup = null;
    this.formName = '';
    this.formDescription = '';
    this.formClassId = this.selectedClassFilter || '';
    this.formOrder = null;
    this.clearErrors();
  }

  openEditModal(grp: GroupEntry): void {
    this.modalMode = 'edit';
    this.selectedGroup = grp;
    this.formName = grp.name;
    this.formDescription = grp.description ?? '';
    this.formClassId = grp.classId;
    this.formOrder = grp.order ?? null;
    this.clearErrors();
  }

  openViewModal(grp: GroupEntry): void {
    this.modalMode = 'view';
    this.selectedGroup = grp;
  }

  openDeleteModal(grp: GroupEntry): void {
    this.modalMode = 'delete';
    this.selectedGroup = grp;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedGroup = null;
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
      this.createGroup();
    } else if (this.modalMode === 'edit') {
      this.updateGroup();
    }
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.formClassId) {
      this.classError = 'Please select a class.';
      valid = false;
    }

    const trimmed = this.formName.trim();
    if (!trimmed) {
      this.nameError = 'Group name is required.';
      valid = false;
    } else if (this.formClassId) {
      const duplicate = this.groups.find(
        (g) =>
          g.name.toLowerCase() === trimmed.toLowerCase() &&
          g.classId === this.formClassId &&
          g.id !== this.selectedGroup?.id,
      );
      if (duplicate) {
        this.nameError =
          'A group with this name already exists for the selected class.';
        valid = false;
      }
    }

    return valid;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getClassName(classId: string): string {
    return this.classes.find((c) => c.id === classId)?.name ?? '—';
  }

  // Unique classes present in loaded groups (for filter dropdown)
  get classFilterOptions(): ClassEntry[] {
    const ids = [...new Set(this.groups.map((g) => g.classId))];
    return this.classes.filter((c) => ids.includes(c.id));
  }

  onSearch(): void {
    this.applyFilters();
  }

  onClassFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.groups];
    if (this.selectedClassFilter) {
      list = list.filter((g) => g.classId === this.selectedClassFilter);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          this.getClassName(g.classId).toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q),
      );
    }
    this.filteredGroups = list;
    this.currentPage = 1;
  }
}

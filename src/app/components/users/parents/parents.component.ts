import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ParentStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export interface Parent {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt?: string;
  students: ParentStudent[]; // API returns "students", not "children"
}

type ModalMode = 'view' | 'delete' | 'block' | 'device-reset' | null;

@Component({
  selector: 'app-parents',
  standalone: false,
  templateUrl: './parents.component.html',
  styleUrls: [
    '../../../shared-page.css',
    './parents.component.css',
  ],
})
export class ParentsComponent implements OnInit {
  parents: Parent[] = [];
  filteredParents: Parent[] = [];

  searchTerm: string = '';
  filterStatus: string = '';
  isLoading: boolean = false;

  modalMode: ModalMode = null;
  selectedParent: Parent | null = null;

  formBlockReason: string = '';
  blockReasonError: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadParents();
  }

  // ─── Load ────────────────────────────────────────────────────

  loadParents(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/batches/parents').subscribe({
      next: (res: any) => {
        this.parents = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load parents.');
        this.isLoading = false;
      },
    });
  }

  // ─── Actions ─────────────────────────────────────────────────

  deleteParent(): void {
    if (!this.selectedParent) return;
    this.httpService
      .deleteData(BASE_URL, `/batches/parents/${this.selectedParent.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(`"${this.selectedParent!.name}" deleted.`);
          this.closeModal();
          this.loadParents();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to delete parent.',
          );
        },
      });
  }

  blockParent(): void {
    if (!this.selectedParent) return;
    if (!this.formBlockReason.trim()) {
      this.blockReasonError = 'Block reason is required.';
      return;
    }
    this.httpService
      .putData(BASE_URL, `/batches/parents/${this.selectedParent.id}/block`, {
        reason: this.formBlockReason.trim(),
      })
      .subscribe({
        next: () => {
          this.commonService.success(`"${this.selectedParent!.name}" blocked.`);
          this.closeModal();
          this.loadParents();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to block parent.',
          );
        },
      });
  }

  deviceReset(): void {
    if (!this.selectedParent) return;
    this.httpService
      .putData(
        BASE_URL,
        `/batches/parents/${this.selectedParent.id}/device-reset`,
        {},
      )
      .subscribe({
        next: () => {
          this.commonService.success('Device reset successful.');
          this.closeModal();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to reset device.',
          );
        },
      });
  }

  // ─── Modals ──────────────────────────────────────────────────

  openViewModal(parent: Parent): void {
    this.selectedParent = { ...parent }; // clone to ensure change detection
    this.modalMode = 'view';
  }

  openDeleteModal(parent: Parent): void {
    this.selectedParent = { ...parent };
    this.modalMode = 'delete';
  }

  openBlockModal(parent: Parent): void {
    this.selectedParent = { ...parent };
    this.formBlockReason = '';
    this.blockReasonError = '';
    this.modalMode = 'block';
  }

  openDeviceResetModal(parent: Parent): void {
    this.selectedParent = { ...parent };
    this.modalMode = 'device-reset';
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedParent = null;
    this.formBlockReason = '';
    this.blockReasonError = '';
  }

  // ─── Filters ─────────────────────────────────────────────────

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.parents];
    if (this.filterStatus) {
      list = list.filter((p) =>
        this.filterStatus === 'active' ? p.isActive : !p.isActive,
      );
    }
    const q = this.searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.includes(q) ||
          p.relationship?.toLowerCase().includes(q) ||
          p.students?.some(
            (s) =>
              s.firstName?.toLowerCase().includes(q) ||
              s.lastName?.toLowerCase().includes(q) ||
              s.email?.toLowerCase().includes(q),
          ),
      );
    }
    this.filteredParents = list;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  getStudentInitials(student: ParentStudent): string {
    return (
      (student.firstName?.[0] ?? '') + (student.lastName?.[0] ?? '')
    ).toUpperCase() || '?';
  }

  getStudentFullName(student: ParentStudent): string {
    return `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim();
  }

  get totalActive(): number {
    return this.parents.filter((p) => p.isActive).length;
  }

  get totalInactive(): number {
    return this.parents.filter((p) => !p.isActive).length;
  }
}

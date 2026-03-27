import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionSlotService, SessionSlot, SessionSlotPayload } from '../../../services/session-slot.service';
import { CommonService } from '../../../services/common.service';
import { Permission, PermissionService } from '../../../auth/permission.service';

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-session-slots',
  standalone: false,
  templateUrl: './session-slots.component.html',
  styleUrls: ['../../../shared-page.css', './session-slots.component.css'],
})
export class SessionSlotsComponent implements OnInit {
  slots: SessionSlot[] = [];
  filteredSlots: SessionSlot[] = [];

  searchQuery = '';
  isLoading = false;
  isSaving = false;

  modalMode: ModalMode = null;
  selectedSlot: SessionSlot | null = null;

  // Form fields
  formSlotNumber: number = 1;
  formName = '';
  formStartTime = '';
  formEndTime = '';

  // Validation
  formErrors: Record<string, string> = {};

  pageSize = 10;
  currentPage = 1;

  get pagedSlots(): SessionSlot[] {
    return this.filteredSlots.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSlots.length / this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  constructor(
    private sessionSlotService: SessionSlotService,
    private commonService: CommonService,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSlots();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ─── API ─────────────────────────────────────────────────

  loadSlots(): void {
    this.isLoading = true;
    this.sessionSlotService.getAll().subscribe({
      next: (res: any) => {
        this.slots = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load session slots.');
        this.isLoading = false;
      },
    });
  }

  createSlot(): void {
    this.isSaving = true;
    this.sessionSlotService.create(this.buildPayload()).subscribe({
      next: () => {
        this.commonService.success('Session slot created successfully.');
        this.closeModal();
        this.loadSlots();
        this.isSaving = false;
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to create session slot.');
        this.isSaving = false;
      },
    });
  }

  updateSlot(): void {
    if (!this.selectedSlot) return;
    this.isSaving = true;
    this.sessionSlotService.update(this.selectedSlot.id, this.buildPayload()).subscribe({
      next: () => {
        this.commonService.success('Session slot updated successfully.');
        this.closeModal();
        this.loadSlots();
        this.isSaving = false;
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to update session slot.');
        this.isSaving = false;
      },
    });
  }

  deleteSlot(): void {
    if (!this.selectedSlot) return;
    this.sessionSlotService.delete(this.selectedSlot.id).subscribe({
      next: () => {
        this.commonService.success('Session slot deleted.');
        this.closeModal();
        this.loadSlots();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to delete session slot.');
      },
    });
  }

  private buildPayload(): SessionSlotPayload {
    return {
      slotNumber: this.formSlotNumber,
      name: this.formName.trim(),
      startTime: this.formStartTime,
      endTime: this.formEndTime,
    };
  }

  // ─── Modals ──────────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedSlot = null;
    this.resetForm();
  }

  openEditModal(slot: SessionSlot): void {
    this.modalMode = 'edit';
    this.selectedSlot = slot;
    this.formSlotNumber = slot.slotNumber;
    this.formName = slot.name ?? '';
    this.formStartTime = slot.startTime ?? '';
    this.formEndTime = slot.endTime ?? '';
    this.formErrors = {};
  }

  openViewModal(slot: SessionSlot): void {
    this.modalMode = 'view';
    this.selectedSlot = slot;
  }

  openDeleteModal(slot: SessionSlot): void {
    this.modalMode = 'delete';
    this.selectedSlot = slot;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedSlot = null;
    this.formErrors = {};
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') this.createSlot();
    else if (this.modalMode === 'edit') this.updateSlot();
  }

  validateForm(): boolean {
    this.formErrors = {};
    if (!this.formSlotNumber || this.formSlotNumber < 1) {
      this.formErrors['slotNumber'] = 'Slot number is required.';
    }
    if (!this.formStartTime) this.formErrors['startTime'] = 'Start time is required.';
    if (!this.formEndTime)   this.formErrors['endTime']   = 'End time is required.';
    if (this.formStartTime && this.formEndTime && this.formEndTime <= this.formStartTime) {
      this.formErrors['endTime'] = 'End time must be after start time.';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  private resetForm(): void {
    this.formSlotNumber = 1;
    this.formName = '';
    this.formStartTime = '';
    this.formEndTime = '';
    this.formErrors = {};
  }

  // ─── Filters ─────────────────────────────────────────────

  onSearch(): void { this.applyFilters(); }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredSlots = q
      ? this.slots.filter(s =>
          (s.name || '').toLowerCase().includes(q) ||
          String(s.slotNumber).includes(q)
        )
      : [...this.slots];
    this.currentPage = 1;
  }

  // ─── Display helpers ─────────────────────────────────────

  formatTime(time: string): string {
    if (!time) return '—';
    if (time.includes('T')) {
      return new Date(time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  }
}

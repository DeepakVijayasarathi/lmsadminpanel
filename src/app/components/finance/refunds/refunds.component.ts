import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionService } from '../../../auth/permission.service';

const BASE_URL = environment.apiUrl;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Refund {
  id: string;
  paymentId: string;
  username: string;
  firstName: string;
  lastName: string;
  reason: string;
  refundAmount: number;
  status: string;           // "Pending" | "Approved" | "Rejected"  (capitalised)
  requestedAt: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
}

export interface CreateRefundPayload {
  paymentId: string;
  userId: string;
  reason: string;
}

type ModalMode = 'create' | 'view' | 'approve' | 'reject' | null;

@Component({
  selector: 'app-refunds',
  standalone: false,
  templateUrl: './refunds.component.html',
  styleUrls: ['../../../shared-page.css', './refunds.component.css'],
})
export class RefundsComponent implements OnInit {
  refunds: Refund[] = [];
  filteredRefunds: Refund[] = [];

  searchQuery = '';
  statusFilter = '';
  isLoading = false;
  isSubmitting = false;

  modalMode: ModalMode = null;
  selectedRefund: Refund | null = null;

  // ── Create form fields ───────────────────────────────────────
  formPaymentId = '';
  formUserId = '';
  formReason = '';

  // ── Validation ───────────────────────────────────────────────
  paymentIdError = '';
  userIdError = '';
  reasonError = '';

  pageSize = 10;
  currentPage = 1;

  get pagedRefunds(): Refund[] {
    return this.filteredRefunds.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRefunds.length / this.pageSize);
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
    this.loadRefunds();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ════════════════════════════════════════════════════════════════
  //  API CALLS
  // ════════════════════════════════════════════════════════════════

  /** GET /api/refund/refund */
  loadRefunds(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/refund').subscribe({
      next: (res: any) => {
        this.refunds = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load refund requests.');
        this.isLoading = false;
      },
    });
  }

  /** POST /api/refund/refund */
  createRefund(): void {
    if (!this.validateForm()) return;
    this.isSubmitting = true;

    const payload: CreateRefundPayload = {
      paymentId: this.formPaymentId.trim(),
      userId: this.formUserId.trim(),
      reason: this.formReason.trim(),
    };

    this.httpService.postData(BASE_URL, '/refund', payload).subscribe({
      next: () => {
        this.commonService.success('Refund request submitted successfully.');
        this.closeModal();
        this.loadRefunds();
        this.isSubmitting = false;
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to submit refund request.');
        this.isSubmitting = false;
      },
    });
  }

  /** POST /api/refund/approve/{id} */
  confirmApprove(): void {
    if (!this.selectedRefund) return;
    this.isSubmitting = true;

    this.httpService
      .postData(BASE_URL, `/refund/approve/${this.selectedRefund.id}`, {})
      .subscribe({
        next: () => {
          this.commonService.success(
            `Refund of ${this.formatAmount(this.selectedRefund!.refundAmount)} approved for "${this.getFullName(this.selectedRefund!)}".`,
          );
          this.closeModal();
          this.loadRefunds();
          this.isSubmitting = false;
        },
        error: (err: any) => {
          this.commonService.error(err?.error?.message || 'Failed to approve refund.');
          this.isSubmitting = false;
        },
      });
  }

  /** POST /api/refund/refund/reject/{id} */
  confirmReject(): void {
    if (!this.selectedRefund) return;
    this.isSubmitting = true;

    this.httpService
      .postData(BASE_URL, `/refund/reject/${this.selectedRefund.id}`, {})
      .subscribe({
        next: () => {
          this.commonService.warning(
            `Refund request from "${this.getFullName(this.selectedRefund!)}" rejected.`,
          );
          this.closeModal();
          this.loadRefunds();
          this.isSubmitting = false;
        },
        error: (err: any) => {
          this.commonService.error(err?.error?.message || 'Failed to reject refund.');
          this.isSubmitting = false;
        },
      });
  }

  // ════════════════════════════════════════════════════════════════
  //  MODAL HELPERS
  // ════════════════════════════════════════════════════════════════

  openCreateModal(): void {
    this.resetForm();
    this.modalMode = 'create';
  }

  openViewModal(refund: Refund): void {
    this.selectedRefund = { ...refund };
    this.modalMode = 'view';
  }

  openApproveModal(refund: Refund): void {
    this.selectedRefund = { ...refund };
    this.modalMode = 'approve';
  }

  openRejectModal(refund: Refund): void {
    this.selectedRefund = { ...refund };
    this.modalMode = 'reject';
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedRefund = null;
    this.isSubmitting = false;
    this.clearErrors();
  }

  // ════════════════════════════════════════════════════════════════
  //  VALIDATION & FORM
  // ════════════════════════════════════════════════════════════════

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!this.formPaymentId.trim()) {
      this.paymentIdError = 'Payment ID is required.';
      valid = false;
    } else if (!uuidPattern.test(this.formPaymentId.trim())) {
      this.paymentIdError = 'Enter a valid UUID.';
      valid = false;
    }

    if (!this.formUserId.trim()) {
      this.userIdError = 'User ID is required.';
      valid = false;
    } else if (!uuidPattern.test(this.formUserId.trim())) {
      this.userIdError = 'Enter a valid UUID.';
      valid = false;
    }

    if (!this.formReason.trim()) {
      this.reasonError = 'Reason is required.';
      valid = false;
    } else if (this.formReason.trim().length < 10) {
      this.reasonError = 'Reason must be at least 10 characters.';
      valid = false;
    }

    return valid;
  }

  clearErrors(): void {
    this.paymentIdError = '';
    this.userIdError = '';
    this.reasonError = '';
  }

  resetForm(): void {
    this.formPaymentId = '';
    this.formUserId = '';
    this.formReason = '';
    this.clearErrors();
  }

  // ════════════════════════════════════════════════════════════════
  //  FILTERS
  // ════════════════════════════════════════════════════════════════

  onSearch(): void { this.applyFilters(); }
  onFilterChange(): void { this.applyFilters(); }

  applyFilters(): void {
    let list = [...this.refunds];

    if (this.statusFilter) {
      list = list.filter(
        (r) => r.status?.toLowerCase() === this.statusFilter.toLowerCase(),
      );
    }

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) =>
          this.getFullName(r).toLowerCase().includes(q) ||
          r.username?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q) ||
          r.paymentId?.toLowerCase().includes(q),
      );
    }

    this.filteredRefunds = list;
    this.currentPage = 1;
  }

  // ════════════════════════════════════════════════════════════════
  //  DISPLAY HELPERS
  // ════════════════════════════════════════════════════════════════

  getFullName(refund: Refund): string {
    return `${refund.firstName ?? ''} ${refund.lastName ?? ''}`.trim() || refund.username || '—';
  }

  getInitial(refund: Refund): string {
    return (refund.firstName?.charAt(0) ?? refund.username?.charAt(0) ?? '?').toUpperCase();
  }

  isPending(refund: Refund): boolean {
    return refund.status?.toLowerCase() === 'pending';
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      pending:  'pg-badge--yellow',
      approved: 'pg-badge--green',
      rejected: 'pg-badge--red',
    };
    return map[status?.toLowerCase()] || 'pg-badge--gray';
  }

  formatAmount(amount?: number): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  truncate(text: string, limit = 55): string {
    return text?.length > limit ? text.substring(0, limit) + '…' : (text ?? '—');
  }

  get pendingCount(): number  { return this.refunds.filter((r) => r.status?.toLowerCase() === 'pending').length; }
  get approvedCount(): number { return this.refunds.filter((r) => r.status?.toLowerCase() === 'approved').length; }
  get rejectedCount(): number { return this.refunds.filter((r) => r.status?.toLowerCase() === 'rejected').length; }
}

import { Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';

export interface Refund {
  id: number;
  student: string;
  amount: number;
  reason: string;
  requestedAt: string;
  processedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

type ModalMode = 'view' | 'approve' | 'reject' | null;

@Component({
  selector: 'app-refunds',
  standalone: false,
  templateUrl: './refunds.component.html',
  styleUrls: ['../../../shared-page.css', './refunds.component.css']
})
export class RefundsComponent {
  searchQuery = '';
  statusFilter = '';

  modalMode: ModalMode = null;
  selectedRefund: Refund | null = null;

  refunds: Refund[] = [
    { id: 1, student: 'Aarav Singh',    amount: 4999,  reason: 'Duplicate payment made accidentally via UPI',            requestedAt: '2026-03-14', processedAt: '2026-03-15', status: 'approved' },
    { id: 2, student: 'Priya Sharma',   amount: 1499,  reason: 'Course cancelled by institution due to low enrolment',   requestedAt: '2026-03-13', processedAt: '',           status: 'pending' },
    { id: 3, student: 'Rahul Verma',    amount: 3500,  reason: 'Batch fee charged twice in March billing cycle',         requestedAt: '2026-03-12', processedAt: '',           status: 'pending' },
    { id: 4, student: 'Neha Patel',     amount: 8000,  reason: 'Medical emergency – unable to continue the course',      requestedAt: '2026-03-10', processedAt: '2026-03-12', status: 'rejected' },
    { id: 5, student: 'Kiran Mehta',    amount: 14999, reason: 'Annual subscription downgraded to monthly plan',         requestedAt: '2026-03-08', processedAt: '2026-03-10', status: 'approved' },
    { id: 6, student: 'Divya Nair',     amount: 3999,  reason: 'Payment gateway error resulted in double deduction',     requestedAt: '2026-03-05', processedAt: '2026-03-07', status: 'approved' },
    { id: 7, student: 'Arjun Desai',    amount: 9999,  reason: 'Enrolled in wrong batch, requesting transfer refund',    requestedAt: '2026-03-16', processedAt: '',           status: 'pending' },
    { id: 8, student: 'Sneha Kulkarni', amount: 4999,  reason: 'Subscription auto-renewed without consent',              requestedAt: '2026-03-15', processedAt: '',           status: 'pending' },
  ];

  constructor(private commonService: CommonService) {}

  get filteredRefunds(): Refund[] {
    const q = this.searchQuery.toLowerCase();
    return this.refunds.filter(r => {
      const matchSearch = !q || r.student.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q);
      const matchStatus = !this.statusFilter || r.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  get pendingCount(): number { return this.refunds.filter(r => r.status === 'pending').length; }
  get approvedCount(): number { return this.refunds.filter(r => r.status === 'approved').length; }
  get rejectedCount(): number { return this.refunds.filter(r => r.status === 'rejected').length; }

  openViewModal(refund: Refund): void { this.modalMode = 'view'; this.selectedRefund = refund; }
  openApproveModal(refund: Refund): void { this.modalMode = 'approve'; this.selectedRefund = refund; }
  openRejectModal(refund: Refund): void { this.modalMode = 'reject'; this.selectedRefund = refund; }
  closeModal(): void { this.modalMode = null; this.selectedRefund = null; }

  confirmApprove(): void {
    if (!this.selectedRefund) return;
    const idx = this.refunds.findIndex(r => r.id === this.selectedRefund!.id);
    if (idx > -1) {
      this.refunds[idx].status = 'approved';
      this.refunds[idx].processedAt = new Date().toISOString().split('T')[0];
    }
    this.commonService.success(`Refund of ${this.formatAmount(this.selectedRefund.amount)} approved for "${this.selectedRefund.student}".`);
    this.closeModal();
  }

  confirmReject(): void {
    if (!this.selectedRefund) return;
    const idx = this.refunds.findIndex(r => r.id === this.selectedRefund!.id);
    if (idx > -1) {
      this.refunds[idx].status = 'rejected';
      this.refunds[idx].processedAt = new Date().toISOString().split('T')[0];
    }
    this.commonService.warning(`Refund request from "${this.selectedRefund.student}" rejected.`);
    this.closeModal();
  }

  truncate(text: string, limit = 50): string {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = { pending: 'pg-badge--yellow', approved: 'pg-badge--green', rejected: 'pg-badge--red' };
    return map[status] || 'pg-badge--gray';
  }

  formatAmount(amount: number): string { return '₹' + amount.toLocaleString('en-IN'); }
}

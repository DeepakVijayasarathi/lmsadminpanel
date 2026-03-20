import { Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';

export interface Subscription {
  id: number;
  student: string;
  plan: 'Monthly' | 'Quarterly' | 'Annual';
  amount: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

type ModalMode = 'create' | 'edit' | 'view' | 'cancel' | null;

@Component({
  selector: 'app-subscriptions',
  standalone: false,
  templateUrl: './subscriptions.component.html',
  styleUrls: ['../../../shared-page.css', './subscriptions.component.css']
})
export class SubscriptionsComponent {
  searchQuery = '';
  planFilter = '';

  // Modal
  modalMode: ModalMode = null;
  selectedSub: Subscription | null = null;

  // Form fields
  formStudent = '';
  formPlan: 'Monthly' | 'Quarterly' | 'Annual' = 'Monthly';
  formStartDate = '';
  formAutoRenew = false;
  formStudentError = '';
  formStartDateError = '';

  nextId = 7;

  subscriptions: Subscription[] = [
    { id: 1, student: 'Aarav Singh',   plan: 'Annual',    amount: 14999, startDate: '2026-01-01', endDate: '2026-12-31', autoRenew: true,  status: 'active' },
    { id: 2, student: 'Priya Sharma',  plan: 'Monthly',   amount: 1499,  startDate: '2026-03-01', endDate: '2026-03-31', autoRenew: false, status: 'active' },
    { id: 3, student: 'Rahul Verma',   plan: 'Quarterly', amount: 3999,  startDate: '2026-01-01', endDate: '2026-03-31', autoRenew: true,  status: 'active' },
    { id: 4, student: 'Neha Patel',    plan: 'Monthly',   amount: 1499,  startDate: '2026-02-01', endDate: '2026-02-28', autoRenew: false, status: 'expired' },
    { id: 5, student: 'Kiran Mehta',   plan: 'Annual',    amount: 14999, startDate: '2025-04-01', endDate: '2026-03-31', autoRenew: true,  status: 'active' },
    { id: 6, student: 'Saurabh Joshi', plan: 'Quarterly', amount: 3999,  startDate: '2025-10-01', endDate: '2025-12-31', autoRenew: false, status: 'cancelled' },
  ];

  constructor(private commonService: CommonService) {}

  get filteredSubscriptions(): Subscription[] {
    const q = this.searchQuery.toLowerCase();
    return this.subscriptions.filter(s => {
      const matchSearch = !q || s.student.toLowerCase().includes(q);
      const matchPlan = !this.planFilter || s.plan === this.planFilter;
      return matchSearch && matchPlan;
    });
  }

  get activeCount(): number { return this.subscriptions.filter(s => s.status === 'active').length; }
  get monthlyCount(): number { return this.subscriptions.filter(s => s.plan === 'Monthly').length; }
  get annualCount(): number { return this.subscriptions.filter(s => s.plan === 'Annual').length; }
  get expiringCount(): number {
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    return this.subscriptions.filter(s => s.status === 'active' && new Date(s.endDate) <= in30).length;
  }

  planAmount(plan: string): number {
    return plan === 'Monthly' ? 1499 : plan === 'Quarterly' ? 3999 : 14999;
  }

  calcEndDate(start: string, plan: string): string {
    const d = new Date(start);
    if (plan === 'Monthly') d.setMonth(d.getMonth() + 1);
    else if (plan === 'Quarterly') d.setMonth(d.getMonth() + 3);
    else d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedSub = null;
    this.formStudent = ''; this.formPlan = 'Monthly'; this.formStartDate = ''; this.formAutoRenew = false;
    this.formStudentError = ''; this.formStartDateError = '';
  }

  openEditModal(sub: Subscription): void {
    this.modalMode = 'edit';
    this.selectedSub = sub;
    this.formStudent = sub.student; this.formPlan = sub.plan; this.formStartDate = sub.startDate; this.formAutoRenew = sub.autoRenew;
    this.formStudentError = ''; this.formStartDateError = '';
  }

  openViewModal(sub: Subscription): void { this.modalMode = 'view'; this.selectedSub = sub; }
  openCancelModal(sub: Subscription): void { this.modalMode = 'cancel'; this.selectedSub = sub; }

  closeModal(): void { this.modalMode = null; this.selectedSub = null; this.formStudentError = ''; this.formStartDateError = ''; }

  validateForm(): boolean {
    this.formStudentError = ''; this.formStartDateError = '';
    let valid = true;
    if (!this.formStudent.trim()) { this.formStudentError = 'Student name is required.'; valid = false; }
    if (!this.formStartDate) { this.formStartDateError = 'Start date is required.'; valid = false; }
    return valid;
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    const endDate = this.calcEndDate(this.formStartDate, this.formPlan);
    const amount = this.planAmount(this.formPlan);
    if (this.modalMode === 'create') {
      this.subscriptions.push({
        id: this.nextId++,
        student: this.formStudent.trim(),
        plan: this.formPlan,
        amount,
        startDate: this.formStartDate,
        endDate,
        autoRenew: this.formAutoRenew,
        status: 'active'
      });
      this.commonService.success(`Subscription for "${this.formStudent.trim()}" created.`);
    } else if (this.modalMode === 'edit' && this.selectedSub) {
      const idx = this.subscriptions.findIndex(s => s.id === this.selectedSub!.id);
      if (idx > -1) {
        this.subscriptions[idx] = { ...this.subscriptions[idx], student: this.formStudent.trim(), plan: this.formPlan, amount, startDate: this.formStartDate, endDate, autoRenew: this.formAutoRenew };
      }
      this.commonService.success(`Subscription updated.`);
    }
    this.closeModal();
  }

  confirmCancel(): void {
    if (!this.selectedSub) return;
    const idx = this.subscriptions.findIndex(s => s.id === this.selectedSub!.id);
    if (idx > -1) this.subscriptions[idx].status = 'cancelled';
    this.commonService.warning(`Subscription for "${this.selectedSub.student}" cancelled.`);
    this.closeModal();
  }

  planBadge(plan: string): string {
    const map: Record<string, string> = { Monthly: 'pg-badge--blue', Quarterly: 'pg-badge--purple', Annual: 'pg-badge--indigo' };
    return map[plan] || 'pg-badge--gray';
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = { active: 'pg-badge--green', expired: 'pg-badge--yellow', cancelled: 'pg-badge--red' };
    return map[status] || 'pg-badge--gray';
  }

  formatAmount(amount: number): string { return '₹' + amount.toLocaleString('en-IN'); }
}

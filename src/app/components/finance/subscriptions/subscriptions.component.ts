import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface Payment {
  id: string;
  subscriptionName: string | null;
  amount: number;
  currency: string;
  transactionReference: string;
  providerResponseJson: string;
  status: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
}

export interface Installment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
}

export interface SubscriptionDetail {
  id: string;
  userId: string;
  courseId: string;
  batchId: string | null;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  isCompleted: boolean;
  isPartialAllowed: boolean;
  startDate: string;
  endDate: string;
  payments: Payment[];
  installments: Installment[];
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
  // Resolved names (from users/courses/batches)
  userName?: string;
  courseName?: string;
  batchName?: string;
}

export interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface CourseRef {
  id: string;
  title: string;
}

export interface BatchRef {
  id: string;
  name?: string;
  batchName?: string;
}

type ModalMode = 'view' | null;

@Component({
  selector: 'app-subscriptions',
  standalone: false,
  templateUrl: './subscriptions.component.html',
  styleUrls: ['../../../shared-page.css', './subscriptions.component.css'],
})
export class SubscriptionsComponent implements OnInit {
  readonly Math = Math;

  subscriptions: SubscriptionDetail[] = [];
  filteredSubscriptions: SubscriptionDetail[] = [];

  users: UserRef[] = [];
  courses: CourseRef[] = [];
  batches: BatchRef[] = [];

  searchQuery: string = '';
  statusFilter: string = '';
  isLoading: boolean = false;

  // Modal
  modalMode: ModalMode = null;
  selectedSub: SubscriptionDetail | null = null;
  activeTab: 'payments' | 'installments' = 'payments';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
  }

  // ─── API ─────────────────────────────────────────────────────

  loadReferenceData(): void {
    // Load users, courses, batches in parallel then load subscriptions
    let usersLoaded = false;
    let coursesLoaded = false;
    let batchesLoaded = false;

    const tryLoad = () => {
      if (usersLoaded && coursesLoaded && batchesLoaded)
        this.loadSubscriptions();
    };

    this.httpService.getData(BASE_URL, '/users').subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res) ? res : (res?.data ?? []);
        usersLoaded = true;
        tryLoad();
      },
      error: () => {
        usersLoaded = true;
        tryLoad();
      },
    });

    this.httpService.getData(BASE_URL, '/courses').subscribe({
      next: (res: any) => {
        this.courses = Array.isArray(res) ? res : (res?.data ?? []);
        coursesLoaded = true;
        tryLoad();
      },
      error: () => {
        coursesLoaded = true;
        tryLoad();
      },
    });

    this.httpService.getData(BASE_URL, '/batches').subscribe({
      next: (res: any) => {
        this.batches = Array.isArray(res) ? res : (res?.data ?? []);
        batchesLoaded = true;
        tryLoad();
      },
      error: () => {
        batchesLoaded = true;
        tryLoad();
      },
    });
  }

  loadSubscriptions(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/subscription/details').subscribe({
      next: (res: any) => {
        const raw: SubscriptionDetail[] = Array.isArray(res)
          ? res
          : (res?.data ?? []);
        // Enrich with resolved names
        this.subscriptions = raw.map((s) => ({
          ...s,
          userName: this.getUserName(s.userId),
          courseName: this.getCourseName(s.courseId),
          batchName: s.batchId ? this.getBatchName(s.batchId) : '—',
        }));
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load subscriptions.');
        this.isLoading = false;
      },
    });
  }

  // ─── Modal ───────────────────────────────────────────────────

  openViewModal(sub: SubscriptionDetail): void {
    this.modalMode = 'view';
    this.selectedSub = sub;
    this.activeTab = 'payments';
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedSub = null;
  }

  // ─── Filters ─────────────────────────────────────────────────

  onSearch(): void {
    this.applyFilters();
  }
  onStatusFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.subscriptions];

    if (this.statusFilter === 'completed') {
      list = list.filter((s) => s.isCompleted);
    } else if (this.statusFilter === 'pending') {
      list = list.filter((s) => !s.isCompleted);
    } else if (this.statusFilter === 'partial') {
      list = list.filter((s) => s.isPartialAllowed && !s.isCompleted);
    } else if (this.statusFilter === 'overpaid') {
      list = list.filter((s) => s.pendingAmount < 0);
    }

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          s.userName?.toLowerCase().includes(q) ||
          s.courseName?.toLowerCase().includes(q) ||
          s.batchName?.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      );
    }
    this.filteredSubscriptions = list;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getUserName(userId: string): string {
    const u = this.users.find((u) => u.id === userId);
    return u
      ? `${u.firstName} ${u.lastName}`.trim()
      : userId.substring(0, 8) + '…';
  }

  getUserInitial(userId: string): string {
    const u = this.users.find((u) => u.id === userId);
    return u ? u.firstName.charAt(0).toUpperCase() : '?';
  }

  getCourseName(courseId: string): string {
    return (
      this.courses.find((c) => c.id === courseId)?.title ??
      courseId.substring(0, 8) + '…'
    );
  }

  getBatchName(batchId: string): string {
    const b = this.batches.find((b) => b.id === batchId);
    return b ? b.batchName || b.name || batchId.substring(0, 8) + '…' : '—';
  }

  formatAmount(amount: number): string {
    return (
      '₹' +
      Math.abs(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getPaymentProgress(sub: SubscriptionDetail): number {
    if (!sub.totalAmount || sub.totalAmount === 0) return 100;
    const pct = (sub.paidAmount / sub.totalAmount) * 100;
    return Math.min(Math.max(Math.round(pct), 0), 100);
  }

  getStatusLabel(sub: SubscriptionDetail): string {
    if (sub.isCompleted) return 'Completed';
    if (sub.pendingAmount < 0) return 'Overpaid';
    if (sub.isPartialAllowed) return 'Partial';
    return 'Pending';
  }

  getStatusBadge(sub: SubscriptionDetail): string {
    if (sub.isCompleted) return 'pg-badge--green';
    if (sub.pendingAmount < 0) return 'pg-badge--blue';
    if (sub.isPartialAllowed) return 'pg-badge--amber';
    return 'pg-badge--yellow';
  }

  getPaymentStatusBadge(status: string): string {
    const map: Record<string, string> = {
      Success: 'pg-badge--green',
      Failed: 'pg-badge--red',
      Pending: 'pg-badge--yellow',
    };
    return map[status] || 'pg-badge--gray';
  }

  sortedInstallments(sub: SubscriptionDetail): Installment[] {
    return [...sub.installments].sort(
      (a, b) => a.installmentNumber - b.installmentNumber,
    );
  }

  // Stats
  get totalRevenue(): number {
    return this.subscriptions.reduce((s, r) => s + r.paidAmount, 0);
  }
  get totalPending(): number {
    return this.subscriptions.reduce(
      (s, r) => s + Math.max(r.pendingAmount, 0),
      0,
    );
  }
  get completedCount(): number {
    return this.subscriptions.filter((s) => s.isCompleted).length;
  }
  get pendingCount(): number {
    return this.subscriptions.filter((s) => !s.isCompleted).length;
  }
}
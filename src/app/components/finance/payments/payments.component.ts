import { Component } from '@angular/core';

export interface Payment {
  id: number;
  student: string;
  amount: number;
  method: 'UPI' | 'Card' | 'Net Banking' | 'Cash';
  purpose: 'Subscription' | 'Course Fee' | 'Batch Fee';
  transactionId: string;
  date: string;
  status: 'success' | 'pending' | 'failed';
}

@Component({
  selector: 'app-payments',
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrls: ['../../../shared-page.css', './payments.component.css']
})
export class PaymentsComponent {
  searchQuery = '';
  statusFilter = '';

  // Modal state
  showViewModal = false;
  selectedPayment: Payment | null = null;

  payments: Payment[] = [
    { id: 1, student: 'Aarav Singh',   amount: 4999,  method: 'UPI',         purpose: 'Subscription', transactionId: 'TXN8820014', date: '2026-03-16', status: 'success' },
    { id: 2, student: 'Priya Sharma',  amount: 12000, method: 'Card',        purpose: 'Course Fee',   transactionId: 'TXN8820015', date: '2026-03-16', status: 'success' },
    { id: 3, student: 'Rahul Verma',   amount: 3500,  method: 'Net Banking', purpose: 'Batch Fee',    transactionId: 'TXN8820016', date: '2026-03-15', status: 'pending' },
    { id: 4, student: 'Neha Patel',    amount: 4999,  method: 'UPI',         purpose: 'Subscription', transactionId: 'TXN8820017', date: '2026-03-15', status: 'success' },
    { id: 5, student: 'Kiran Mehta',   amount: 8000,  method: 'Cash',        purpose: 'Course Fee',   transactionId: 'TXN8820018', date: '2026-03-14', status: 'failed' },
    { id: 6, student: 'Saurabh Joshi', amount: 14999, method: 'Card',        purpose: 'Subscription', transactionId: 'TXN8820019', date: '2026-03-14', status: 'success' },
    { id: 7, student: 'Divya Nair',    amount: 3500,  method: 'UPI',         purpose: 'Batch Fee',    transactionId: 'TXN8820020', date: '2026-03-13', status: 'success' },
    { id: 8, student: 'Arjun Desai',   amount: 9999,  method: 'Card',        purpose: 'Course Fee',   transactionId: 'TXN8820021', date: '2026-03-12', status: 'success' },
    { id: 9, student: 'Sneha Kulkarni',amount: 4999,  method: 'UPI',         purpose: 'Subscription', transactionId: 'TXN8820022', date: '2026-03-11', status: 'pending' },
    { id: 10,student: 'Rohan Mehta',   amount: 3500,  method: 'Net Banking', purpose: 'Batch Fee',    transactionId: 'TXN8820023', date: '2026-03-10', status: 'failed' },
  ];

  get filteredPayments(): Payment[] {
    const q = this.searchQuery.toLowerCase();
    return this.payments.filter(p => {
      const matchSearch = !q || p.student.toLowerCase().includes(q) || p.transactionId.toLowerCase().includes(q) || p.purpose.toLowerCase().includes(q);
      const matchStatus = !this.statusFilter || p.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  get totalReceived(): number { return this.payments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0); }
  get totalPending(): number { return this.payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0); }
  get totalFailed(): number { return this.payments.filter(p => p.status === 'failed').reduce((s, p) => s + p.amount, 0); }

  openViewModal(payment: Payment): void {
    this.selectedPayment = payment;
    this.showViewModal = true;
  }

  closeModal(): void {
    this.showViewModal = false;
    this.selectedPayment = null;
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      success: 'pg-badge--green',
      pending: 'pg-badge--yellow',
      failed: 'pg-badge--red'
    };
    return map[status] || 'pg-badge--gray';
  }

  formatAmount(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }
}

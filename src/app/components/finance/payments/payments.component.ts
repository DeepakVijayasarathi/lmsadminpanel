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
  payments: Payment[] = [
    { id: 1, student: 'Aarav Singh', amount: 4999, method: 'UPI', purpose: 'Subscription', transactionId: 'TXN8820014', date: '2026-03-16', status: 'success' },
    { id: 2, student: 'Priya Sharma', amount: 12000, method: 'Card', purpose: 'Course Fee', transactionId: 'TXN8820015', date: '2026-03-16', status: 'success' },
    { id: 3, student: 'Rahul Verma', amount: 3500, method: 'Net Banking', purpose: 'Batch Fee', transactionId: 'TXN8820016', date: '2026-03-15', status: 'pending' },
    { id: 4, student: 'Neha Patel', amount: 4999, method: 'UPI', purpose: 'Subscription', transactionId: 'TXN8820017', date: '2026-03-15', status: 'success' },
    { id: 5, student: 'Kiran Mehta', amount: 8000, method: 'Cash', purpose: 'Course Fee', transactionId: 'TXN8820018', date: '2026-03-14', status: 'failed' },
    { id: 6, student: 'Saurabh Joshi', amount: 14999, method: 'Card', purpose: 'Subscription', transactionId: 'TXN8820019', date: '2026-03-14', status: 'success' },
    { id: 7, student: 'Divya Nair', amount: 3500, method: 'UPI', purpose: 'Batch Fee', transactionId: 'TXN8820020', date: '2026-03-13', status: 'success' }
  ];

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

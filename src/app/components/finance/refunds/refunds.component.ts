import { Component } from '@angular/core';

export interface Refund {
  id: number;
  student: string;
  amount: number;
  reason: string;
  requestedAt: string;
  processedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

@Component({
  selector: 'app-refunds',
  standalone: false,
  templateUrl: './refunds.component.html',
  styleUrls: ['../../../shared-page.css', './refunds.component.css']
})
export class RefundsComponent {
  refunds: Refund[] = [
    { id: 1, student: 'Aarav Singh', amount: 4999, reason: 'Duplicate payment made accidentally via UPI', requestedAt: '2026-03-14', processedAt: '2026-03-15', status: 'approved' },
    { id: 2, student: 'Priya Sharma', amount: 1499, reason: 'Course cancelled by institution due to low enrolment', requestedAt: '2026-03-13', processedAt: '', status: 'pending' },
    { id: 3, student: 'Rahul Verma', amount: 3500, reason: 'Batch fee charged twice in March billing cycle', requestedAt: '2026-03-12', processedAt: '', status: 'pending' },
    { id: 4, student: 'Neha Patel', amount: 8000, reason: 'Medical emergency – unable to continue the course', requestedAt: '2026-03-10', processedAt: '2026-03-12', status: 'rejected' },
    { id: 5, student: 'Kiran Mehta', amount: 14999, reason: 'Annual subscription downgraded to monthly plan', requestedAt: '2026-03-08', processedAt: '2026-03-10', status: 'approved' },
    { id: 6, student: 'Divya Nair', amount: 3999, reason: 'Payment gateway error resulted in double deduction', requestedAt: '2026-03-05', processedAt: '2026-03-07', status: 'approved' }
  ];

  truncate(text: string, limit = 45): string {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      pending: 'pg-badge--yellow',
      approved: 'pg-badge--green',
      rejected: 'pg-badge--red'
    };
    return map[status] || 'pg-badge--gray';
  }

  formatAmount(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }
}

import { Component } from '@angular/core';

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

@Component({
  selector: 'app-subscriptions',
  standalone: false,
  templateUrl: './subscriptions.component.html',
  styleUrls: ['../../../shared-page.css', './subscriptions.component.css']
})
export class SubscriptionsComponent {
  subscriptions: Subscription[] = [
    { id: 1, student: 'Aarav Singh', plan: 'Annual', amount: 14999, startDate: '2026-01-01', endDate: '2026-12-31', autoRenew: true, status: 'active' },
    { id: 2, student: 'Priya Sharma', plan: 'Monthly', amount: 1499, startDate: '2026-03-01', endDate: '2026-03-31', autoRenew: false, status: 'active' },
    { id: 3, student: 'Rahul Verma', plan: 'Quarterly', amount: 3999, startDate: '2026-01-01', endDate: '2026-03-31', autoRenew: true, status: 'active' },
    { id: 4, student: 'Neha Patel', plan: 'Monthly', amount: 1499, startDate: '2026-02-01', endDate: '2026-02-28', autoRenew: false, status: 'expired' },
    { id: 5, student: 'Kiran Mehta', plan: 'Annual', amount: 14999, startDate: '2025-04-01', endDate: '2026-03-31', autoRenew: true, status: 'active' },
    { id: 6, student: 'Saurabh Joshi', plan: 'Quarterly', amount: 3999, startDate: '2025-10-01', endDate: '2025-12-31', autoRenew: false, status: 'cancelled' }
  ];

  planBadge(plan: string): string {
    const map: Record<string, string> = {
      Monthly: 'pg-badge--blue',
      Quarterly: 'pg-badge--purple',
      Annual: 'pg-badge--indigo'
    };
    return map[plan] || 'pg-badge--gray';
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      active: 'pg-badge--green',
      expired: 'pg-badge--yellow',
      cancelled: 'pg-badge--red'
    };
    return map[status] || 'pg-badge--gray';
  }

  formatAmount(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }
}

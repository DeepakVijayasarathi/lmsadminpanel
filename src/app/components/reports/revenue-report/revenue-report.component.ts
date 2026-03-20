import { Component } from '@angular/core';

export interface RevenueRecord {
  month: string;
  year: string;
  subscriptions: number;
  courseFees: number;
  batchFees: number;
  total: number;
  growth: number;
}

@Component({
  selector: 'app-revenue-report',
  standalone: false,
  templateUrl: './revenue-report.component.html',
  styleUrls: ['../../../shared-page.css', './revenue-report.component.css']
})
export class RevenueReportComponent {
  yearFilter = '';

  records: RevenueRecord[] = [
    { month: 'October 2025',  year: '2025', subscriptions: 240000, courseFees: 162000, batchFees: 58000, total: 460000, growth: 5.2 },
    { month: 'November 2025', year: '2025', subscriptions: 255000, courseFees: 175000, batchFees: 62000, total: 492000, growth: 6.9 },
    { month: 'December 2025', year: '2025', subscriptions: 210000, courseFees: 148000, batchFees: 48000, total: 406000, growth: -17.4 },
    { month: 'January 2026',  year: '2026', subscriptions: 310000, courseFees: 198000, batchFees: 72000, total: 580000, growth: 42.8 },
    { month: 'February 2026', year: '2026', subscriptions: 285000, courseFees: 182000, batchFees: 68000, total: 535000, growth: -7.7 },
    { month: 'March 2026',    year: '2026', subscriptions: 340000, courseFees: 210000, batchFees: 82000, total: 632000, growth: 18.1 },
  ];

  get filteredRecords(): RevenueRecord[] {
    return this.yearFilter ? this.records.filter(r => r.year === this.yearFilter) : this.records;
  }

  get totalRevenue(): number { return this.filteredRecords.reduce((s, r) => s + r.total, 0); }
  get totalSubscriptions(): number { return this.filteredRecords.reduce((s, r) => s + r.subscriptions, 0); }
  get totalCourseFees(): number { return this.filteredRecords.reduce((s, r) => s + r.courseFees, 0); }
  get latestMonth(): RevenueRecord | null { return this.filteredRecords.length ? this.filteredRecords[this.filteredRecords.length - 1] : null; }

  formatAmount(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }

  growthColor(growth: number): string {
    return growth >= 0 ? '#10b981' : '#ef4444';
  }

  growthIcon(growth: number): string {
    return growth >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
  }
}

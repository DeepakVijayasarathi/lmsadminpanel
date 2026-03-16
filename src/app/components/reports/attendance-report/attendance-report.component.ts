import { Component } from '@angular/core';

export interface AttendanceRecord {
  id: number;
  student: string;
  batch: string;
  class: string;
  presentDays: number;
  totalDays: number;
  percentage: number;
  lastAttended: string;
  status: 'regular' | 'irregular' | 'absent';
}

@Component({
  selector: 'app-attendance-report',
  standalone: false,
  templateUrl: './attendance-report.component.html',
  styleUrls: ['../../../shared-page.css', './attendance-report.component.css']
})
export class AttendanceReportComponent {
  records: AttendanceRecord[] = [
    { id: 1, student: 'Aarav Singh', batch: 'Batch A', class: 'Class 10', presentDays: 24, totalDays: 26, percentage: 92, lastAttended: '2026-03-15', status: 'regular' },
    { id: 2, student: 'Priya Sharma', batch: 'Batch B', class: 'Class 8', presentDays: 22, totalDays: 26, percentage: 85, lastAttended: '2026-03-16', status: 'regular' },
    { id: 3, student: 'Rahul Verma', batch: 'Batch A', class: 'Class 10', presentDays: 18, totalDays: 26, percentage: 69, lastAttended: '2026-03-14', status: 'irregular' },
    { id: 4, student: 'Neha Patel', batch: 'Batch C', class: 'Class 12', presentDays: 25, totalDays: 26, percentage: 96, lastAttended: '2026-03-16', status: 'regular' },
    { id: 5, student: 'Kiran Mehta', batch: 'Batch B', class: 'Class 9', presentDays: 14, totalDays: 26, percentage: 54, lastAttended: '2026-03-10', status: 'irregular' },
    { id: 6, student: 'Saurabh Joshi', batch: 'Batch D', class: 'Class 11', presentDays: 5, totalDays: 26, percentage: 19, lastAttended: '2026-03-01', status: 'absent' },
    { id: 7, student: 'Divya Nair', batch: 'Batch C', class: 'Class 12', presentDays: 23, totalDays: 26, percentage: 88, lastAttended: '2026-03-15', status: 'regular' }
  ];

  percentageColor(pct: number): string {
    if (pct >= 85) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      regular: 'pg-badge--green',
      irregular: 'pg-badge--yellow',
      absent: 'pg-badge--red'
    };
    return map[status] || 'pg-badge--gray';
  }
}

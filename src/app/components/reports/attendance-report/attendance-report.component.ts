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
  searchQuery = '';
  statusFilter = '';

  records: AttendanceRecord[] = [
    { id: 1,  student: 'Aarav Singh',    batch: 'Batch A', class: 'Grade 10', presentDays: 24, totalDays: 26, percentage: 92, lastAttended: '2026-03-15', status: 'regular' },
    { id: 2,  student: 'Priya Sharma',   batch: 'Batch B', class: 'Grade 8',  presentDays: 22, totalDays: 26, percentage: 85, lastAttended: '2026-03-16', status: 'regular' },
    { id: 3,  student: 'Rahul Verma',    batch: 'Batch A', class: 'Grade 10', presentDays: 18, totalDays: 26, percentage: 69, lastAttended: '2026-03-14', status: 'irregular' },
    { id: 4,  student: 'Neha Patel',     batch: 'Batch C', class: 'Grade 12', presentDays: 25, totalDays: 26, percentage: 96, lastAttended: '2026-03-16', status: 'regular' },
    { id: 5,  student: 'Kiran Mehta',    batch: 'Batch B', class: 'Grade 9',  presentDays: 14, totalDays: 26, percentage: 54, lastAttended: '2026-03-10', status: 'irregular' },
    { id: 6,  student: 'Saurabh Joshi',  batch: 'Batch D', class: 'Grade 11', presentDays: 5,  totalDays: 26, percentage: 19, lastAttended: '2026-03-01', status: 'absent' },
    { id: 7,  student: 'Divya Nair',     batch: 'Batch C', class: 'Grade 12', presentDays: 23, totalDays: 26, percentage: 88, lastAttended: '2026-03-15', status: 'regular' },
    { id: 8,  student: 'Arjun Desai',    batch: 'Batch D', class: 'Grade 11', presentDays: 20, totalDays: 26, percentage: 77, lastAttended: '2026-03-13', status: 'irregular' },
    { id: 9,  student: 'Sneha Kulkarni', batch: 'Batch A', class: 'Grade 10', presentDays: 11, totalDays: 26, percentage: 42, lastAttended: '2026-03-08', status: 'absent' },
    { id: 10, student: 'Rohan Mehta',    batch: 'Batch B', class: 'Grade 11', presentDays: 26, totalDays: 26, percentage: 100,lastAttended: '2026-03-16', status: 'regular' },
  ];

  get filteredRecords(): AttendanceRecord[] {
    const q = this.searchQuery.toLowerCase();
    return this.records.filter(r => {
      const matchSearch = !q || r.student.toLowerCase().includes(q) || r.batch.toLowerCase().includes(q) || r.class.toLowerCase().includes(q);
      const matchStatus = !this.statusFilter || r.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  get regularCount(): number { return this.filteredRecords.filter(r => r.status === 'regular').length; }
  get irregularCount(): number { return this.filteredRecords.filter(r => r.status === 'irregular').length; }
  get absentCount(): number { return this.filteredRecords.filter(r => r.status === 'absent').length; }
  get avgAttendance(): number {
    if (!this.filteredRecords.length) return 0;
    return Math.round(this.filteredRecords.reduce((s, r) => s + r.percentage, 0) / this.filteredRecords.length);
  }

  percentageColor(pct: number): string {
    if (pct >= 85) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = { regular: 'pg-badge--green', irregular: 'pg-badge--yellow', absent: 'pg-badge--red' };
    return map[status] || 'pg-badge--gray';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

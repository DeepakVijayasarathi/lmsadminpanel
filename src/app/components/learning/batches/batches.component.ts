import { Component } from '@angular/core';

interface Batch {
  id: number;
  name: string;
  class: string;
  board: string;
  teacher: string;
  students: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
}

@Component({
  selector: 'app-batches',
  standalone: false,
  templateUrl: './batches.component.html',
  styleUrls: ['../../../shared-page.css', './batches.component.css']
})
export class BatchesComponent {
  searchQuery = '';
  statusFilter = '';

  batches: Batch[] = [
    { id: 1, name: 'Science Elite – Batch A', class: 'Class 12', board: 'CBSE', teacher: 'Dr. Anita Sharma', students: 42, startDate: '2025-06-01', endDate: '2026-03-31', status: 'active' },
    { id: 2, name: 'Commerce Pro – Batch B', class: 'Class 11', board: 'CBSE', teacher: 'Mr. Rajesh Kumar', students: 38, startDate: '2025-06-01', endDate: '2026-03-31', status: 'active' },
    { id: 3, name: 'Humanities Plus – Batch C', class: 'Class 10', board: 'ICSE', teacher: 'Ms. Priya Nair', students: 35, startDate: '2025-07-01', endDate: '2026-04-30', status: 'active' },
    { id: 4, name: 'Foundation – Batch D', class: 'Class 9', board: 'CBSE', teacher: 'Dr. Suresh Menon', students: 50, startDate: '2025-06-15', endDate: '2026-04-15', status: 'active' },
    { id: 5, name: 'JEE Advanced – Batch E', class: 'Class 12', board: 'CBSE', teacher: 'Ms. Kavitha Rao', students: 30, startDate: '2026-04-01', endDate: '2027-03-31', status: 'upcoming' },
    { id: 6, name: 'NEET Prep – Batch F', class: 'Class 12', board: 'State', teacher: 'Mr. Arun Pillai', students: 28, startDate: '2026-04-15', endDate: '2027-04-14', status: 'upcoming' },
    { id: 7, name: 'Class 8 – Regular', class: 'Class 8', board: 'CBSE', teacher: 'Ms. Deepa Iyer', students: 45, startDate: '2024-06-01', endDate: '2025-03-31', status: 'completed' }
  ];

  get filteredBatches(): Batch[] {
    return this.batches.filter(b => {
      const matchesSearch = !this.searchQuery ||
        b.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        b.teacher.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        b.class.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = !this.statusFilter || b.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      active: 'pg-badge pg-badge--green',
      upcoming: 'pg-badge pg-badge--blue',
      completed: 'pg-badge pg-badge--gray'
    };
    return map[status] || 'pg-badge';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

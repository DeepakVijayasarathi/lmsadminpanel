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
    { id: 1, name: 'NEET 2025 – Batch A',        class: 'Class 12', board: 'CBSE',  teacher: 'Dr. Vikram Sharma',  students: 48, startDate: '2025-04-01', endDate: '2026-05-31', status: 'active' },
    { id: 2, name: 'NEET 2025 – Batch B',        class: 'Class 12', board: 'CBSE',  teacher: 'Dr. Meena Krishnan', students: 44, startDate: '2025-04-01', endDate: '2026-05-31', status: 'active' },
    { id: 3, name: 'JEE Main 2025 – Batch A',    class: 'Class 12', board: 'CBSE',  teacher: 'Mr. Arjun Verma',    students: 42, startDate: '2025-05-01', endDate: '2026-01-31', status: 'active' },
    { id: 4, name: 'JEE Main 2025 – Batch B',    class: 'Class 12', board: 'CBSE',  teacher: 'Dr. Kiran Patel',    students: 40, startDate: '2025-05-01', endDate: '2026-01-31', status: 'active' },
    { id: 5, name: 'JEE Advanced 2025',          class: 'Class 12', board: 'CBSE',  teacher: 'Dr. Vikram Sharma',  students: 22, startDate: '2025-06-01', endDate: '2026-05-31', status: 'active' },
    { id: 6, name: 'NEET 2026 – Batch A',        class: 'Class 11', board: 'CBSE',  teacher: 'Ms. Pooja Iyer',     students: 50, startDate: '2026-04-01', endDate: '2027-05-31', status: 'upcoming' },
    { id: 7, name: 'JEE Main 2026 – Batch A',    class: 'Class 11', board: 'CBSE',  teacher: 'Mr. Rahul Gupta',    students: 46, startDate: '2026-05-01', endDate: '2027-01-31', status: 'upcoming' },
    { id: 8, name: 'NEET 2024 – Batch A',        class: 'Class 12', board: 'State', teacher: 'Dr. Sanjay Mishra',  students: 52, startDate: '2024-04-01', endDate: '2025-05-31', status: 'completed' },
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

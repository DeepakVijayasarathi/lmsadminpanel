import { Component } from '@angular/core';

interface Course {
  id: number;
  title: string;
  subject: string;
  teacher: string;
  batch: string;
  duration: string;
  enrolled: number;
  status: 'active' | 'draft' | 'archived';
  thumbnail: string;
}

@Component({
  selector: 'app-courses',
  standalone: false,
  templateUrl: './courses.component.html',
  styleUrls: ['../../../shared-page.css', './courses.component.css']
})
export class CoursesComponent {
  searchQuery = '';
  statusFilter = '';

  courses: Course[] = [
    { id: 1,  title: 'Physics Complete Course – NEET',           subject: 'Physics',           teacher: 'Dr. Vikram Sharma',  batch: 'NEET 2025 – Batch A',     duration: '120 hrs', enrolled: 186, status: 'active',   thumbnail: '#0ea5e9' },
    { id: 2,  title: 'Chemistry Complete Course – NEET',         subject: 'Chemistry',         teacher: 'Ms. Pooja Iyer',     batch: 'NEET 2025 – Batch A',     duration: '110 hrs', enrolled: 178, status: 'active',   thumbnail: '#10b981' },
    { id: 3,  title: 'Biology – Botany & Zoology (NEET)',        subject: 'Biology',           teacher: 'Dr. Meena Krishnan', batch: 'NEET 2025 – Batch B',     duration: '130 hrs', enrolled: 162, status: 'active',   thumbnail: '#f59e0b' },
    { id: 4,  title: 'Physics Complete Course – JEE Main',       subject: 'Physics',           teacher: 'Mr. Rahul Gupta',    batch: 'JEE Main 2025 – Batch A', duration: '140 hrs', enrolled: 148, status: 'active',   thumbnail: '#6366f1' },
    { id: 5,  title: 'Mathematics Complete Course – JEE',        subject: 'Mathematics',       teacher: 'Mr. Arjun Verma',    batch: 'JEE Main 2025 – Batch A', duration: '150 hrs', enrolled: 142, status: 'active',   thumbnail: '#8b5cf6' },
    { id: 6,  title: 'Chemistry – Organic & Inorganic (JEE)',    subject: 'Chemistry',         teacher: 'Dr. Sanjay Mishra',  batch: 'JEE Main 2025 – Batch B', duration: '115 hrs', enrolled: 136, status: 'active',   thumbnail: '#f43f5e' },
    { id: 7,  title: 'JEE Advanced – Physics Masterclass',       subject: 'Physics',           teacher: 'Dr. Vikram Sharma',  batch: 'JEE Advanced 2025',       duration: '160 hrs', enrolled:  88, status: 'active',   thumbnail: '#ef4444' },
    { id: 8,  title: 'JEE Advanced – Mathematics Deep Dive',     subject: 'Mathematics',       teacher: 'Dr. Kiran Patel',    batch: 'JEE Advanced 2025',       duration: '170 hrs', enrolled:  84, status: 'active',   thumbnail: '#a21caf' },
    { id: 9,  title: 'NEET Biology Crash Course 2026',           subject: 'Biology',           teacher: 'Ms. Divya Nair',     batch: 'NEET 2026 – Batch A',     duration: '60 hrs',  enrolled:  0,  status: 'draft',    thumbnail: '#16a34a' },
    { id: 10, title: 'Physical Chemistry – All Topics',          subject: 'Chemistry',         teacher: 'Ms. Pooja Iyer',     batch: 'NEET 2025 – Batch B',     duration: '55 hrs',  enrolled: 122, status: 'archived', thumbnail: '#0891b2' },
  ];

  get filteredCourses(): Course[] {
    return this.courses.filter(c => {
      const matchesSearch = !this.searchQuery ||
        c.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.teacher.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = !this.statusFilter || c.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      active: 'pg-badge pg-badge--green',
      draft: 'pg-badge pg-badge--yellow',
      archived: 'pg-badge pg-badge--gray'
    };
    return map[status] || 'pg-badge';
  }
}

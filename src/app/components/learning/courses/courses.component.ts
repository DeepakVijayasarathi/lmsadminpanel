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
    { id: 1, title: 'Mathematics – Algebra & Calculus', subject: 'Mathematics', teacher: 'Dr. Anita Sharma', batch: 'Class 10-A', duration: '48 hrs', enrolled: 124, status: 'active', thumbnail: '#4f46e5' },
    { id: 2, title: 'Physics – Mechanics & Waves', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', batch: 'Class 11-B', duration: '52 hrs', enrolled: 98, status: 'active', thumbnail: '#0ea5e9' },
    { id: 3, title: 'Chemistry – Organic Compounds', subject: 'Chemistry', teacher: 'Ms. Priya Nair', batch: 'Class 12-A', duration: '40 hrs', enrolled: 87, status: 'active', thumbnail: '#10b981' },
    { id: 4, title: 'Biology – Cell Biology & Genetics', subject: 'Biology', teacher: 'Dr. Suresh Menon', batch: 'Class 11-A', duration: '36 hrs', enrolled: 76, status: 'active', thumbnail: '#f59e0b' },
    { id: 5, title: 'English – Literature & Grammar', subject: 'English', teacher: 'Ms. Kavitha Rao', batch: 'Class 9-C', duration: '30 hrs', enrolled: 112, status: 'draft', thumbnail: '#f43f5e' },
    { id: 6, title: 'History – Modern India', subject: 'History', teacher: 'Mr. Arun Pillai', batch: 'Class 10-B', duration: '28 hrs', enrolled: 65, status: 'archived', thumbnail: '#8b5cf6' },
    { id: 7, title: 'Computer Science – Data Structures', subject: 'CS', teacher: 'Ms. Deepa Iyer', batch: 'Class 12-B', duration: '44 hrs', enrolled: 58, status: 'active', thumbnail: '#06b6d4' }
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

import { Component } from '@angular/core';

export interface Exam {
  id: number;
  title: string;
  subject: string;
  class: string;
  teacher: string;
  duration: number;
  totalMarks: number;
  scheduled: string;
  status: 'upcoming' | 'live' | 'completed' | 'draft';
  attempts: number;
}

@Component({
  selector: 'app-exams',
  standalone: false,
  templateUrl: './exams.component.html',
  styleUrls: ['../../../shared-page.css', './exams.component.css']
})
export class ExamsComponent {
  exams: Exam[] = [
    { id: 1, title: 'Mid-Term Mathematics', subject: 'Mathematics', class: 'Class 10', teacher: 'Ravi Sharma', duration: 90, totalMarks: 100, scheduled: '2026-03-20', status: 'upcoming', attempts: 0 },
    { id: 2, title: 'Science Unit Test', subject: 'Science', class: 'Class 8', teacher: 'Priya Nair', duration: 60, totalMarks: 50, scheduled: '2026-03-16', status: 'live', attempts: 24 },
    { id: 3, title: 'English Grammar Quiz', subject: 'English', class: 'Class 6', teacher: 'Anita Patel', duration: 30, totalMarks: 25, scheduled: '2026-03-15', status: 'completed', attempts: 38 },
    { id: 4, title: 'History Chapter Test', subject: 'History', class: 'Class 9', teacher: 'Suresh Kumar', duration: 45, totalMarks: 40, scheduled: '2026-03-22', status: 'upcoming', attempts: 0 },
    { id: 5, title: 'Physics Final Exam', subject: 'Physics', class: 'Class 12', teacher: 'Deepak Verma', duration: 180, totalMarks: 100, scheduled: '2026-04-05', status: 'draft', attempts: 0 },
    { id: 6, title: 'Chemistry Practical', subject: 'Chemistry', class: 'Class 11', teacher: 'Meena Iyer', duration: 120, totalMarks: 60, scheduled: '2026-03-28', status: 'upcoming', attempts: 0 },
    { id: 7, title: 'Computer Science Quiz', subject: 'Computer Science', class: 'Class 10', teacher: 'Ajay Menon', duration: 45, totalMarks: 30, scheduled: '2026-03-14', status: 'completed', attempts: 32 }
  ];

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      live: 'pg-badge--red',
      upcoming: 'pg-badge--blue',
      completed: 'pg-badge--green',
      draft: 'pg-badge--gray'
    };
    return map[status] || 'pg-badge--gray';
  }
}

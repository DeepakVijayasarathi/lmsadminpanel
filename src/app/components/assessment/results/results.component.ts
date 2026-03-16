import { Component } from '@angular/core';

export interface ExamResult {
  id: number;
  student: string;
  exam: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'F';
  submittedAt: string;
  status: 'pass' | 'fail';
}

@Component({
  selector: 'app-results',
  standalone: false,
  templateUrl: './results.component.html',
  styleUrls: ['../../../shared-page.css', './results.component.css']
})
export class ResultsComponent {
  results: ExamResult[] = [
    { id: 1, student: 'Aarav Singh', exam: 'Mid-Term Mathematics', subject: 'Mathematics', score: 95, totalMarks: 100, percentage: 95, grade: 'A+', submittedAt: '2026-03-15', status: 'pass' },
    { id: 2, student: 'Priya Sharma', exam: 'English Grammar Quiz', subject: 'English', score: 21, totalMarks: 25, percentage: 84, grade: 'A', submittedAt: '2026-03-15', status: 'pass' },
    { id: 3, student: 'Rahul Verma', exam: 'Science Unit Test', subject: 'Science', score: 35, totalMarks: 50, percentage: 70, grade: 'B', submittedAt: '2026-03-16', status: 'pass' },
    { id: 4, student: 'Neha Patel', exam: 'History Chapter Test', subject: 'History', score: 28, totalMarks: 40, percentage: 70, grade: 'B', submittedAt: '2026-03-14', status: 'pass' },
    { id: 5, student: 'Kiran Mehta', exam: 'Computer Science Quiz', subject: 'Computer Science', score: 18, totalMarks: 30, percentage: 60, grade: 'C', submittedAt: '2026-03-14', status: 'pass' },
    { id: 6, student: 'Saurabh Joshi', exam: 'Physics Final Exam', subject: 'Physics', score: 98, totalMarks: 100, percentage: 98, grade: 'A+', submittedAt: '2026-03-13', status: 'pass' },
    { id: 7, student: 'Divya Nair', exam: 'Chemistry Practical', subject: 'Chemistry', score: 22, totalMarks: 60, percentage: 37, grade: 'F', submittedAt: '2026-03-12', status: 'fail' }
  ];

  gradeBadge(grade: string): string {
    const map: Record<string, string> = {
      'A+': 'pg-badge--purple',
      'A': 'pg-badge--indigo',
      'B': 'pg-badge--blue',
      'C': 'pg-badge--yellow',
      'F': 'pg-badge--red'
    };
    return map[grade] || 'pg-badge--gray';
  }
}

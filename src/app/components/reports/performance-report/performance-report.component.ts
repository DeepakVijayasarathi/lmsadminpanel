import { Component } from '@angular/core';

export interface PerformanceRecord {
  id: number;
  student: string;
  subject: string;
  avgScore: number;
  quizzesTaken: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-performance-report',
  standalone: false,
  templateUrl: './performance-report.component.html',
  styleUrls: ['../../../shared-page.css', './performance-report.component.css']
})
export class PerformanceReportComponent {
  records: PerformanceRecord[] = [
    { id: 1, student: 'Aarav Singh', subject: 'Mathematics', avgScore: 91, quizzesTaken: 14, rank: 2, trend: 'up' },
    { id: 2, student: 'Priya Sharma', subject: 'English', avgScore: 88, quizzesTaken: 12, rank: 4, trend: 'stable' },
    { id: 3, student: 'Rahul Verma', subject: 'Science', avgScore: 65, quizzesTaken: 10, rank: 18, trend: 'down' },
    { id: 4, student: 'Neha Patel', subject: 'History', avgScore: 78, quizzesTaken: 11, rank: 7, trend: 'up' },
    { id: 5, student: 'Kiran Mehta', subject: 'Computer Science', avgScore: 55, quizzesTaken: 9, rank: 26, trend: 'down' },
    { id: 6, student: 'Saurabh Joshi', subject: 'Physics', avgScore: 95, quizzesTaken: 15, rank: 1, trend: 'up' },
    { id: 7, student: 'Divya Nair', subject: 'Chemistry', avgScore: 72, quizzesTaken: 13, rank: 9, trend: 'stable' }
  ];

  scoreColor(score: number): string {
    if (score >= 85) return '#10b981';
    if (score >= 65) return '#f59e0b';
    return '#ef4444';
  }
}

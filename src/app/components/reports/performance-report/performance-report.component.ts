import { Component } from '@angular/core';

export interface PerformanceRecord {
  id: number;
  student: string;
  batch: string;
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
  searchQuery = '';
  subjectFilter = '';

  records: PerformanceRecord[] = [
    { id: 1,  student: 'Aarav Singh',    batch: 'Grade 10 – Batch A', subject: 'Mathematics',    avgScore: 91, quizzesTaken: 14, rank: 2,  trend: 'up' },
    { id: 2,  student: 'Priya Sharma',   batch: 'Grade 11 – Batch A', subject: 'Physics',        avgScore: 88, quizzesTaken: 12, rank: 4,  trend: 'stable' },
    { id: 3,  student: 'Rahul Verma',    batch: 'Grade 10 – Batch B', subject: 'English',        avgScore: 65, quizzesTaken: 10, rank: 18, trend: 'down' },
    { id: 4,  student: 'Neha Patel',     batch: 'Grade 12 – Batch A', subject: 'Chemistry',      avgScore: 78, quizzesTaken: 11, rank: 7,  trend: 'up' },
    { id: 5,  student: 'Kiran Mehta',    batch: 'Grade 9 – Batch A',  subject: 'Biology',        avgScore: 55, quizzesTaken: 9,  rank: 26, trend: 'down' },
    { id: 6,  student: 'Saurabh Joshi',  batch: 'Grade 11 – Batch B', subject: 'Mathematics',    avgScore: 95, quizzesTaken: 15, rank: 1,  trend: 'up' },
    { id: 7,  student: 'Divya Nair',     batch: 'Grade 12 – Batch A', subject: 'History',        avgScore: 72, quizzesTaken: 13, rank: 9,  trend: 'stable' },
    { id: 8,  student: 'Arjun Desai',    batch: 'Grade 12 – Batch B', subject: 'Physics',        avgScore: 83, quizzesTaken: 14, rank: 5,  trend: 'up' },
    { id: 9,  student: 'Sneha Kulkarni', batch: 'Grade 10 – Batch A', subject: 'Computer Science',avgScore: 47, quizzesTaken: 8,  rank: 34, trend: 'down' },
    { id: 10, student: 'Rohan Mehta',    batch: 'Grade 11 – Batch A', subject: 'Economics',      avgScore: 79, quizzesTaken: 11, rank: 6,  trend: 'stable' },
  ];

  get subjects(): string[] {
    return [...new Set(this.records.map(r => r.subject))].sort();
  }

  get filteredRecords(): PerformanceRecord[] {
    const q = this.searchQuery.toLowerCase();
    return this.records.filter(r => {
      const matchSearch = !q || r.student.toLowerCase().includes(q) || r.batch.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q);
      const matchSubject = !this.subjectFilter || r.subject === this.subjectFilter;
      return matchSearch && matchSubject;
    });
  }

  get avgScore(): number {
    if (!this.filteredRecords.length) return 0;
    return Math.round(this.filteredRecords.reduce((s, r) => s + r.avgScore, 0) / this.filteredRecords.length);
  }

  get topPerformers(): number { return this.filteredRecords.filter(r => r.avgScore >= 85).length; }
  get needSupport(): number { return this.filteredRecords.filter(r => r.avgScore < 60).length; }

  scoreColor(score: number): string {
    if (score >= 85) return '#10b981';
    if (score >= 65) return '#f59e0b';
    return '#ef4444';
  }
}

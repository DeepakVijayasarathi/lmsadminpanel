import { Component } from '@angular/core';

export interface ExamResult {
  id: number;
  student: string;
  exam: string;
  subject: string;
  batch: string;
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
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
    { id: 1,  student: 'Aarav Singh',    exam: 'NEET Full Mock Test #6',       subject: 'Physics + Chemistry + Biology', batch: 'NEET 2025 – Batch A',     score: 648, totalMarks: 720, percentage: 90, rank: 3,   grade: 'A+', submittedAt: '2026-03-15', status: 'pass' },
    { id: 2,  student: 'Priya Sharma',   exam: 'NEET Full Mock Test #6',       subject: 'Physics + Chemistry + Biology', batch: 'NEET 2025 – Batch A',     score: 612, totalMarks: 720, percentage: 85, rank: 8,   grade: 'A',  submittedAt: '2026-03-15', status: 'pass' },
    { id: 3,  student: 'Rohan Mehta',    exam: 'JEE Main Mock Test #4',        subject: 'Physics + Chemistry + Maths',   batch: 'JEE Main 2025 – Batch A', score: 261, totalMarks: 300, percentage: 87, rank: 5,   grade: 'A+', submittedAt: '2026-03-14', status: 'pass' },
    { id: 4,  student: 'Kavya Reddy',    exam: 'JEE Main Mock Test #4',        subject: 'Physics + Chemistry + Maths',   batch: 'JEE Main 2025 – Batch A', score: 234, totalMarks: 300, percentage: 78, rank: 12,  grade: 'A',  submittedAt: '2026-03-14', status: 'pass' },
    { id: 5,  student: 'Saurabh Joshi',  exam: 'NEET Chapter Test – Mechanics', subject: 'Physics',                      batch: 'NEET 2025 – Batch B',     score: 156, totalMarks: 180, percentage: 87, rank: 2,   grade: 'A+', submittedAt: '2026-03-15', status: 'pass' },
    { id: 6,  student: 'Neha Patel',     exam: 'NEET Chapter Test – Mechanics', subject: 'Physics',                      batch: 'NEET 2025 – Batch B',     score: 108, totalMarks: 180, percentage: 60, rank: 28,  grade: 'C',  submittedAt: '2026-03-15', status: 'pass' },
    { id: 7,  student: 'Arjun Desai',    exam: 'JEE Adv Mock Test #2',         subject: 'Physics + Chemistry + Maths',   batch: 'JEE Advanced 2025',       score: 298, totalMarks: 360, percentage: 83, rank: 4,   grade: 'A',  submittedAt: '2026-03-13', status: 'pass' },
    { id: 8,  student: 'Divya Nair',     exam: 'NEET Full Mock Test #6',       subject: 'Physics + Chemistry + Biology', batch: 'NEET 2025 – Batch A',     score: 360, totalMarks: 720, percentage: 50, rank: 44,  grade: 'C',  submittedAt: '2026-03-15', status: 'pass' },
    { id: 9,  student: 'Kiran Mehta',    exam: 'JEE Main Mock Test #4',        subject: 'Physics + Chemistry + Maths',   batch: 'JEE Main 2025 – Batch B', score: 105, totalMarks: 300, percentage: 35, rank: 38,  grade: 'F',  submittedAt: '2026-03-14', status: 'fail' },
    { id: 10, student: 'Sneha Kulkarni', exam: 'NEET Full Mock Test #6',       subject: 'Physics + Chemistry + Biology', batch: 'NEET 2025 – Batch B',     score: 576, totalMarks: 720, percentage: 80, rank: 14,  grade: 'A',  submittedAt: '2026-03-15', status: 'pass' },
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

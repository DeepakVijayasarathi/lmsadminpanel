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
  searchQuery = '';
  gradeFilter = '';

  // Modal state
  showViewModal = false;
  selectedResult: ExamResult | null = null;

  results: ExamResult[] = [
    { id: 1,  student: 'Aarav Singh',    exam: 'Mid-Term Exam – Term 2',    subject: 'Mathematics + Science + English', batch: 'Grade 10 – Batch A', score: 272, totalMarks: 300, percentage: 91, rank: 3,  grade: 'A+', submittedAt: '2026-03-15', status: 'pass' },
    { id: 2,  student: 'Priya Sharma',   exam: 'Mid-Term Exam – Term 2',    subject: 'Mathematics + Science + English', batch: 'Grade 10 – Batch A', score: 255, totalMarks: 300, percentage: 85, rank: 8,  grade: 'A',  submittedAt: '2026-03-15', status: 'pass' },
    { id: 3,  student: 'Rohan Mehta',    exam: 'Unit Test 4 – Mathematics', subject: 'Mathematics',                     batch: 'Grade 11 – Batch A', score: 87,  totalMarks: 100, percentage: 87, rank: 5,  grade: 'A+', submittedAt: '2026-03-14', status: 'pass' },
    { id: 4,  student: 'Kavya Reddy',    exam: 'Unit Test 4 – Mathematics', subject: 'Mathematics',                     batch: 'Grade 11 – Batch A', score: 78,  totalMarks: 100, percentage: 78, rank: 12, grade: 'A',  submittedAt: '2026-03-14', status: 'pass' },
    { id: 5,  student: 'Saurabh Joshi',  exam: 'Chapter Test – Physics',    subject: 'Physics',                         batch: 'Grade 11 – Batch B', score: 156, totalMarks: 180, percentage: 87, rank: 2,  grade: 'A+', submittedAt: '2026-03-15', status: 'pass' },
    { id: 6,  student: 'Neha Patel',     exam: 'Chapter Test – Physics',    subject: 'Physics',                         batch: 'Grade 11 – Batch B', score: 108, totalMarks: 180, percentage: 60, rank: 28, grade: 'C',  submittedAt: '2026-03-15', status: 'pass' },
    { id: 7,  student: 'Arjun Desai',    exam: 'Annual Mock Exam #2',       subject: 'All Subjects',                    batch: 'Grade 12 – Batch A', score: 298, totalMarks: 360, percentage: 83, rank: 4,  grade: 'A',  submittedAt: '2026-03-13', status: 'pass' },
    { id: 8,  student: 'Divya Nair',     exam: 'Mid-Term Exam – Term 2',    subject: 'Mathematics + Science + English', batch: 'Grade 10 – Batch A', score: 150, totalMarks: 300, percentage: 50, rank: 44, grade: 'C',  submittedAt: '2026-03-15', status: 'pass' },
    { id: 9,  student: 'Kiran Mehta',    exam: 'Unit Test 4 – Mathematics', subject: 'Mathematics',                     batch: 'Grade 11 – Batch B', score: 35,  totalMarks: 100, percentage: 35, rank: 38, grade: 'F',  submittedAt: '2026-03-14', status: 'fail' },
    { id: 10, student: 'Sneha Kulkarni', exam: 'Annual Mock Exam #2',       subject: 'All Subjects',                    batch: 'Grade 12 – Batch B', score: 288, totalMarks: 360, percentage: 80, rank: 14, grade: 'A',  submittedAt: '2026-03-15', status: 'pass' },
  ];

  get filteredResults(): ExamResult[] {
    const q = this.searchQuery.toLowerCase();
    return this.results.filter(r => {
      const matchSearch = !q || r.student.toLowerCase().includes(q) || r.exam.toLowerCase().includes(q) || r.batch.toLowerCase().includes(q);
      const matchGrade = !this.gradeFilter || r.grade === this.gradeFilter;
      return matchSearch && matchGrade;
    });
  }

  get passCount(): number { return this.filteredResults.filter(r => r.status === 'pass').length; }
  get avgPercentage(): number {
    if (!this.filteredResults.length) return 0;
    return Math.round(this.filteredResults.reduce((s, r) => s + r.percentage, 0) / this.filteredResults.length);
  }

  openViewModal(result: ExamResult): void {
    this.selectedResult = result;
    this.showViewModal = true;
  }

  closeModal(): void {
    this.showViewModal = false;
    this.selectedResult = null;
  }

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

  scoreColor(pct: number): string {
    if (pct >= 85) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  }
}

// Utility to extract userId and roleName from JWT
function getUserFromToken(): { userId: string | null, roleName: string | null } {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return { userId: null, roleName: null };
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId ?? null,
      roleName: payload.roleName ?? null
    };
  } catch {
    return { userId: null, roleName: null };
  }
}
// student-dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PerformanceService, StudentDetail, HomeworkBreakdownItem } from '../../services/performance.service';

// ── API response shape (matches StudentDashboardDto from backend) ─────────────

interface StudentDashboardApiResponse {
  student: {
    name: string;
    class: string;
    avatar: string;
    streak: number;
  };
  stats: {
    coursesEnrolled: number;
    attendance: string;
    assignmentsDue: number;
    avgQuizScore: string;
  };
  todaysClasses: {
    time: string;
    subject: string;
    topic: string;
    teacher: string;
    status: string;      // done | live | upcoming
    duration: string;
    meetingUrl?: string;
  }[];
  courses: {
    name: string;
    icon: string;
    progress: number;
    color: string;
    lessons: number;
    done: number;
  }[];
  assignments: {
    homeworkId: string;
    subject: string;
    title: string;
    due: string;
    priority: string;   // high | medium | low
    submitted: boolean;
  }[];
  recentResults: {
    subject: string;
    quiz: string;
    score: number;
    total: number;
    date: string;
  }[];
}

@Component({
  selector: 'app-student-dashboard',
  standalone: false,
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit, OnDestroy {

  // ── UI state ──────────────────────────────────────────────────────────────
  loading = true;
  error   = '';

  currentDate = new Date();
  currentTime = '';
  private timeInterval: any;

  // ── Component data (skeleton defaults) ────────────────────────────────────
  student = { name: '...', class: '...', avatar: '?', streak: 0 };
  // Performance details
  performanceDetail: StudentDetail | null = null;
  homeworkBreakdown: HomeworkBreakdownItem[] = [];

  stats = [
    { label: 'Courses Enrolled', value: '—', icon: 'fa-solid fa-book-open',       color: '#0d9488', bg: '#ccfbf1' },
    { label: 'Attendance',       value: '—', icon: 'fa-solid fa-calendar-check',  color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Assignments Due',  value: '—', icon: 'fa-solid fa-file-pen',        color: '#d97706', bg: '#fef3c7' },
    { label: 'Avg. Quiz Score',  value: '—', icon: 'fa-solid fa-trophy',          color: '#db2777', bg: '#fce7f3' },
  ];

  todaysClasses: {
    time: string; subject: string; topic: string; teacher: string;
    status: string; duration: string; meetingUrl?: string;
  }[] = [];

  courses: {
    name: string; icon: string; progress: number;
    color: string; lessons: number; done: number;
  }[] = [];

  assignments: {
    homeworkId: string; subject: string; title: string;
    due: string; priority: string; submitted: boolean;
  }[] = [];

  recentResults: {
    subject: string; quiz: string; score: number; total: number; date: string;
  }[] = [];

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor(
    private http:   HttpClient,
    private router: Router,
    private performanceService: PerformanceService
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    this.loadDashboard();
    this.loadPerformance();
  }
  // ── Load performance details ─────────────────────────────────────────────
  loadPerformance(): void {
    const { userId, roleName } = getUserFromToken();
    console.log('Decoded JWT:', { userId, roleName });
    if ((roleName?.toLowerCase() !== 'student') || !userId) {
      console.warn('User is not a student or userId missing');
      return;
    }
    this.performanceService.getStudent(userId).subscribe({
      next: (data) => {
        console.log('Performance API response:', data);
        this.performanceDetail = data;
        this.homeworkBreakdown = data.homeworkBreakdown;
      },
      error: (err) => {
        console.error('Performance API error:', err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  // ── API call (public → Retry button) ─────────────────────────────────────
  loadDashboard(): void {
    this.loading = true;
    this.error   = '';

    this.http
      .get<StudentDashboardApiResponse>(`${environment.apiUrl}/dashboard/student`)
      .subscribe({
        next:  data => this.mapToComponent(data),
        error: err  => {
          this.error   = err?.error?.message ?? 'Failed to load dashboard.';
          this.loading = false;
        },
      });
  }

  // ── Map API → component ───────────────────────────────────────────────────
  private mapToComponent(data: StudentDashboardApiResponse): void {
    this.student = data.student;

    const s = data.stats;
    this.stats[0].value = s.coursesEnrolled.toString();
    this.stats[1].value = s.attendance;
    this.stats[2].value = s.assignmentsDue.toString();
    this.stats[3].value = s.avgQuizScore;

    this.todaysClasses  = data.todaysClasses;
    this.courses        = data.courses;
    this.assignments    = data.assignments.filter(a => !a.submitted);
    this.recentResults  = data.recentResults;

    this.loading = false;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getScoreColor(score: number): string {
    if (score >= 85) return '#059669';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  }

  getScoreBg(score: number): string {
    if (score >= 85) return '#dcfce7';
    if (score >= 70) return '#fef9c3';
    return '#fee2e2';
  }

  joinClass(url?: string): void {
    if (url) window.open(url, '_blank');
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
    this.currentDate = now;
  }
}

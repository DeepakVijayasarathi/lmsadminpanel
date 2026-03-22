// teacher-dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpGeneralService } from '../../services/http.service';

// ── API response interface (matches TeacherDashboardDto from backend) ─────────

interface TeacherDashboardApiResponse {
  teacher: {
    name: string;
    subject: string;
    avatar: string;
    totalClasses: number;
  };
  stats: {
    myStudents: number;
    activeBatches: number;
    todaysClasses: number;
    pendingReviews: number;
  };
  timetable: {
    time: string;
    batch: string;
    topic: string;
    status: string;        // live | upcoming | done
    duration: string;
    meetingLink: string;
    students: number;
  }[];
  batches: {
    batchId: string;
    name: string;
    students: number;
    attendance: number;
    pending: number;
    color: string;
  }[];
  pendingSubmissions: {
    submissionId: string;
    student: string;
    batch: string;
    assignment: string;
    submitted: string;
    avatar: string;
  }[];
  performanceData: {
    label: string;
    score: number;
    color: string;
  }[];
  recentActivity: {
    type: string;
    msg: string;
    time: string;
    icon: string;
    color: string;
  }[];
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: false,
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css',
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {

  // ── UI state ──────────────────────────────────────────────────────────────
  loading = true;
  error   = '';

  currentDate = new Date();
  currentTime = '';
  private timeInterval: any;

  // ── Component data (skeleton defaults) ────────────────────────────────────
  teacher = {
    name: '...',
    subject: '...',
    avatar: '?',
    totalClasses: 0,
  };

  stats = [
    { label: 'My Students',      value: '—', icon: 'fa-solid fa-user-graduate',  color: '#4f46e5', bg: '#eef2ff', trend: '' },
    { label: 'Active Batches',   value: '—', icon: 'fa-solid fa-layer-group',    color: '#0d9488', bg: '#ccfbf1', trend: '' },
    { label: "Today's Classes",  value: '—', icon: 'fa-solid fa-video',          color: '#d97706', bg: '#fef3c7', trend: '' },
    { label: 'Pending Reviews',  value: '—', icon: 'fa-solid fa-clipboard-check',color: '#dc2626', bg: '#fee2e2', trend: '' },
  ];

  timetable: {
    time: string; batch: string; topic: string; status: string;
    duration: string; meetingLink: string; students: number;
  }[] = [];

  batches: {
    batchId: string; name: string; students: number;
    attendance: number; pending: number; color: string;
  }[] = [];

  pendingSubmissions: {
    submissionId: string; student: string; batch: string;
    assignment: string; submitted: string; avatar: string;
  }[] = [];

  performanceData: { label: string; score: number; color: string }[] = [];

  recentActivity: {
    type: string; msg: string; time: string; icon: string; color: string;
  }[] = [];

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor(
    private http:   HttpClient,
    private router: Router,
    private httpService: HttpGeneralService<any>
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  // ── API ───────────────────────────────────────────────────────────────────
  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.httpService.getData(environment.apiUrl, '/dashboard/teacher')
      .subscribe({
        next: (data) => this.mapToComponent(data),
        error: (err) => {
          this.error = err?.error?.message ?? 'Failed to load dashboard.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  // ── Map API → component properties ───────────────────────────────────────
  private mapToComponent(data: TeacherDashboardApiResponse): void {

    // Teacher info
    this.teacher = data.teacher;

    // Stat strip
    const s = data.stats;
    this.stats[0].value = s.myStudents.toLocaleString('en-IN');
    this.stats[1].value = s.activeBatches.toString();
    this.stats[2].value = s.todaysClasses.toString();
    this.stats[3].value = s.pendingReviews.toString();

    // Timetable
    this.timetable = data.timetable;

    // Batches
    this.batches = data.batches;

    // Pending submissions
    this.pendingSubmissions = data.pendingSubmissions;

    // Performance bars
    this.performanceData = data.performanceData;

    // Activity feed
    this.recentActivity = data.recentActivity;

    this.loading = false;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getAttColor(val: number): string {
    if (val >= 85) return '#059669';
    if (val >= 70) return '#d97706';
    return '#dc2626';
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
    this.currentDate = now;
  }

  goToTimetable(): void {
    this.router.navigate(['/timetable']);
  }

  joinMeeting(link: string): void {
    if (link) window.open(link, '_blank');
  }
}

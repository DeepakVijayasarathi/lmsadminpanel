// dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexDataLabels, ApexStroke, ApexFill, ApexTooltip,
  ApexGrid, ApexMarkers
} from 'ng-apexcharts';

// ── Local interfaces ──────────────────────────────────────────────────────────

interface StatCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  trend: number;
  trendLabel: string;
  colorClass: string;
}

interface UpcomingClass {
  subject: string;
  teacher: string;
  batch: string;
  time: string;
  endTime: string;
  duration: string;
  students: number;
  status: 'live' | 'upcoming' | 'scheduled';
}

interface RecentActivity {
  type: 'user' | 'course' | 'payment' | 'exam' | 'alert';
  message: string;
  time: string;
  icon: string;
}

interface QuickStat {
  label: string;
  value: number;
  max: number;
  color: string;
}

// ── API response shape (matches AdminDashboardDto from backend) ───────────────

interface AdminDashboardApiResponse {
  statCards: {
    totalStudents: number;
    totalTeachers: number;
    activeBatches: number;
    onlineCourses: number;
    todaysLiveSessions: number;
    monthlyRevenue: number;
  };
  upcomingClasses: {
    liveSessionId: string;
    subject: string;
    teacher: string;
    batch: string;
    time: string;
    endTime: string;
    students: number;
    status: string;
  }[];
  recentActivities: {
    type: string;
    message: string;
    time: string;
    icon: string;
  }[];
  quickStats: {
    label: string;
    value: number;
    color: string;
  }[];
  enrollmentTrend: {
    month: string;
    value: number;
  }[];
  roleDistribution: {
    role: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  curriculum: {
    boards: number;
    classes: number;
    subjects: number;
    topics: number;
  };
  examSummary: {
    totalQuizzes: number;
    quizzesAttemptedToday: number;
    averageScoreThisWeek: number;
    pendingResultReviews: number;
  };
  paymentSummary: {
    totalReceived: number;
    totalPending: number;
    refundRequests: number;
    activeSubscriptions: number;
  };
  notificationSummary: {
    whatsAppToday: number;
    classReminders: number;
    assignmentAlerts: number;
    missedClassCalls: number;
  };
  systemAlerts: {
    type: string;
    message: string;
    icon: string;
  }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── UI state ──────────────────────────────────────────────────────────────
  loading = true;
  error   = '';

  currentDate = new Date();
  currentTime = '';
  private timeInterval: any;

  // ── Bottom-row data ───────────────────────────────────────────────────────
  curriculum = { boards: 0, classes: 0, subjects: 0, topics: 0 };

  examSummary = {
    totalQuizzes: 0,
    quizzesAttemptedToday: 0,
    averageScoreThisWeek: 0,
    pendingResultReviews: 0,
  };

  paymentSummary = {
    totalReceived: 0,
    totalPending: 0,
    refundRequests: 0,
    activeSubscriptions: 0,
  };

  notificationSummary = {
    whatsAppToday: 0,
    classReminders: 0,
    assignmentAlerts: 0,
    missedClassCalls: 0,
  };

  // ── Stat cards (skeleton '—' replaced after API load) ─────────────────────
  statCards: StatCard[] = [
    {
      title: 'Total Students',
      value: '—',
      subtitle: 'Active students enrolled',
      icon: 'fa-solid fa-user-graduate',
      trend: 0, trendLabel: 'vs last month',
      colorClass: 'card-indigo',
    },
    {
      title: 'Expert Faculty',
      value: '—',
      subtitle: 'Subject specialists',
      icon: 'fa-solid fa-chalkboard-user',
      trend: 0, trendLabel: 'vs last month',
      colorClass: 'card-emerald',
    },
    {
      title: 'Active Batches',
      value: '—',
      subtitle: 'Across all grades',
      icon: 'fa-solid fa-layer-group',
      trend: 0, trendLabel: 'vs last month',
      colorClass: 'card-orange',
    },
    {
      title: 'Online Courses',
      value: '—',
      subtitle: 'Published on BBB',
      icon: 'fa-solid fa-book-open',
      trend: 0, trendLabel: 'vs last month',
      colorClass: 'card-purple',
    },
    {
      title: "Today's Live Sessions",
      value: '—',
      subtitle: 'BigBlueButton sessions',
      icon: 'fa-solid fa-video',
      trend: 0, trendLabel: 'same as yesterday',
      colorClass: 'card-sky',
    },
    {
      title: 'Monthly Revenue',
      value: '—',
      subtitle: 'Course fee collected',
      icon: 'fa-solid fa-indian-rupee-sign',
      trend: 0, trendLabel: 'vs last month',
      colorClass: 'card-rose',
    },
  ];

  // ── Main data arrays ──────────────────────────────────────────────────────
  upcomingClasses:  UpcomingClass[]  = [];
  recentActivities: RecentActivity[] = [];
  quickStats:       QuickStat[]      = [];
  enrollmentData:   { month: string; value: number }[] = [];
  roleDistribution: { role: string; count: number; percentage: number; color: string }[] = [];
  systemAlerts:     { type: string; message: string; icon: string }[] = [];

  // ── Dynamic donut SVG ─────────────────────────────────────────────────────
  donutTotal    = 0;
  donutSegments: { color: string; dasharray: string; dashoffset: string }[] = [];

  // ── ApexCharts ────────────────────────────────────────────────────────────
  chartSeries: ApexAxisChartSeries = [{ name: 'Students Enrolled', data: [] }];

  chartConfig: ApexChart = {
    type: 'area', height: 200,
    toolbar: { show: false },
    sparkline: { enabled: false },
    animations: { enabled: true, speed: 800 },
  };

  chartXAxis: ApexXAxis = {
    categories: [],
    axisBorder: { show: false },
    axisTicks:  { show: false },
    labels: { style: { colors: '#9ca3af', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600 } },
  };

  chartYAxis: ApexYAxis = {
    labels: {
      style: { colors: '#9ca3af', fontSize: '11px', fontFamily: 'inherit' },
      formatter: (val: number) => val.toString(),
    },
    min: 0,
  };

  chartStroke: ApexStroke = { curve: 'smooth', width: 2.5 };

  chartFill: ApexFill = {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] },
  };

  chartColors       = ['#4f46e5'];
  chartDataLabels: ApexDataLabels = { enabled: false };

  chartGrid: ApexGrid = {
    borderColor: '#f1f4f9', strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true  } },
    padding: { top: 0, right: 10, bottom: 0, left: 10 },
  };

  chartMarkers: ApexMarkers = {
    size: 4, colors: ['#fff'],
    strokeColors: ['#4f46e5'], strokeWidth: 2,
    hover: { size: 6 },
  };

  chartTooltip: ApexTooltip = {
    theme: 'light',
    y: { formatter: (val: number) => `${val} students` },
  };

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor(
    private http:   HttpClient,
    private router: Router,
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

  // ── API call (public so the Retry button can call it) ─────────────────────
  loadDashboard(): void {
    this.loading = true;
    this.error   = '';

    this.http
      .get<AdminDashboardApiResponse>(`${environment.apiUrl}/dashboard/admin`)
      .subscribe({
        next:  data => this.mapToComponent(data),
        error: err  => {
          this.error   = err?.error?.message ?? 'Failed to load dashboard data.';
          this.loading = false;
        },
      });
  }

  // ── Map API → component properties ───────────────────────────────────────
  private mapToComponent(data: AdminDashboardApiResponse): void {

    // Stat cards
    const sc = data.statCards;
    this.statCards[0].value = sc.totalStudents.toLocaleString('en-IN');
    this.statCards[1].value = sc.totalTeachers.toLocaleString('en-IN');
    this.statCards[2].value = sc.activeBatches.toString();
    this.statCards[3].value = sc.onlineCourses.toString();
    this.statCards[4].value = sc.todaysLiveSessions.toString();
    this.statCards[5].value = this.formatCurrency(sc.monthlyRevenue);

    // Today's classes table
    this.upcomingClasses = data.upcomingClasses.map(c => ({
      subject:  c.subject,
      teacher:  c.teacher,
      batch:    c.batch,
      time:     c.time,
      endTime:  c.endTime,
      duration: this.calcDuration(c.time, c.endTime),
      students: c.students,
      status:   c.status as 'live' | 'upcoming' | 'scheduled',
    }));

    // Recent activity feed
    this.recentActivities = data.recentActivities.map(a => ({
      type:    a.type as RecentActivity['type'],
      message: a.message,
      time:    a.time,
      icon:    a.icon,
    }));

    // Platform performance bars
    this.quickStats = data.quickStats.map(q => ({
      label: q.label,
      value: q.value,
      max:   100,
      color: q.color,
    }));

    // Enrollment area chart
    this.enrollmentData = data.enrollmentTrend;
    this.chartSeries    = [{ name: 'Students Enrolled', data: data.enrollmentTrend.map(e => e.value) }];
    this.chartXAxis     = { ...this.chartXAxis, categories: data.enrollmentTrend.map(e => e.month) };

    // Role distribution + dynamic donut
    this.roleDistribution = data.roleDistribution;
    this.buildDonut(data.roleDistribution);

    // Alert strip
    this.systemAlerts = data.systemAlerts;

    // Bottom row
    this.curriculum          = data.curriculum;
    this.examSummary         = data.examSummary;
    this.paymentSummary      = data.paymentSummary;
    this.notificationSummary = data.notificationSummary;

    this.loading = false;
  }

  // ── Donut SVG builder ─────────────────────────────────────────────────────
  // Circle circumference at r = 38:  2 * π * 38 ≈ 238.76
  private buildDonut(roles: { count: number; percentage: number; color: string }[]): void {
    const CIRC  = 238.76;
    this.donutTotal = roles.reduce((sum, r) => sum + r.count, 0);

    let offset = 0;
    this.donutSegments = roles.map(r => {
      const arc = (r.percentage / 100) * CIRC;
      const seg = {
        color:      r.color,
        dasharray:  `${arc.toFixed(1)} ${CIRC}`,
        dashoffset: `-${offset.toFixed(1)}`,
      };
      offset += arc;
      return seg;
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** "07:00 AM" + "08:30 AM" → "90 min" */
  private calcDuration(start: string, end: string): string {
    const toMins = (t: string): number => {
      const parts  = t.trim().split(' ');
      const period = parts[1] ?? '';
      const [hStr, mStr] = (parts[0] ?? '').split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    const diff = toMins(end) - toMins(start);
    return diff > 0 ? `${diff} min` : '';
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
    this.currentDate = now;
  }

  formatCurrency(amount: number): string {
    return '₹' + Number(amount).toLocaleString('en-IN');
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpGeneralService } from '../../services/http.service';
import { CommonService } from '../../services/common.service';
import { Router } from '@angular/router';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexDataLabels, ApexStroke, ApexFill, ApexTooltip,
  ApexGrid, ApexMarkers
} from 'ng-apexcharts';

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

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  currentTime = '';
  private timeInterval: any;

  statCards: StatCard[] = [
    {
      title: 'Total Students',
      value: '3,214',
      subtitle: 'Active students enrolled',
      icon: 'fa-solid fa-user-graduate',
      trend: 14.2,
      trendLabel: 'vs last month',
      colorClass: 'card-indigo',
    },
    {
      title: 'Expert Faculty',
      value: '58',
      subtitle: 'Subject specialists',
      icon: 'fa-solid fa-chalkboard-user',
      trend: 6.3,
      trendLabel: 'vs last month',
      colorClass: 'card-emerald',
    },
    {
      title: 'Active Batches',
      value: '24',
      subtitle: 'Across all grades',
      icon: 'fa-solid fa-layer-group',
      trend: 9.5,
      trendLabel: 'vs last month',
      colorClass: 'card-orange',
    },
    {
      title: 'Online Courses',
      value: '86',
      subtitle: 'Published on BBB',
      icon: 'fa-solid fa-book-open',
      trend: 21.0,
      trendLabel: 'vs last month',
      colorClass: 'card-purple',
    },
    {
      title: "Today's Live Sessions",
      value: '18',
      subtitle: 'BigBlueButton sessions',
      icon: 'fa-solid fa-video',
      trend: 0,
      trendLabel: 'same as yesterday',
      colorClass: 'card-sky',
    },
    {
      title: 'Monthly Revenue',
      value: '₹8,64,000',
      subtitle: 'Course fee collected',
      icon: 'fa-solid fa-indian-rupee-sign',
      trend: 28.4,
      trendLabel: 'vs last month',
      colorClass: 'card-rose',
    },
  ];

  upcomingClasses: UpcomingClass[] = [
    {
      subject: 'Physics – Electrostatics',
      teacher: 'Dr. Vikram Sharma',
      batch: 'Grade 10 – Batch A',
      time: '07:00 AM',
      endTime: '08:30 AM',
      duration: '90 min',
      students: 48,
      status: 'live',
    },
    {
      subject: 'Mathematics – Calculus',
      teacher: 'Mr. Arjun Verma',
      batch: 'Grade 11 – Batch A',
      time: '09:00 AM',
      endTime: '10:30 AM',
      duration: '90 min',
      students: 42,
      status: 'live',
    },
    {
      subject: 'Chemistry – Organic Reactions',
      teacher: 'Ms. Pooja Iyer',
      batch: 'Grade 10 – Batch B',
      time: '11:00 AM',
      endTime: '12:30 PM',
      duration: '90 min',
      students: 38,
      status: 'upcoming',
    },
    {
      subject: 'Biology – Genetics',
      teacher: 'Dr. Meena Krishnan',
      batch: 'Grade 9 – Batch A',
      time: '14:00 PM',
      endTime: '15:30 PM',
      duration: '90 min',
      students: 36,
      status: 'scheduled',
    },
    {
      subject: 'Computer Science – Data Structures',
      teacher: 'Dr. Kiran Patel',
      batch: 'Grade 12 – Batch A',
      time: '18:00 PM',
      endTime: '19:30 PM',
      duration: '90 min',
      students: 22,
      status: 'scheduled',
    },
  ];

  recentActivities: RecentActivity[] = [
    {
      type: 'user',
      message: '12 new students enrolled in Grade 10 – Batch A',
      time: '5 min ago',
      icon: 'fa-solid fa-user-plus',
    },
    {
      type: 'payment',
      message: 'Course fee ₹18,000 received from Rohan Mehta (Grade 11)',
      time: '22 min ago',
      icon: 'fa-solid fa-circle-check',
    },
    {
      type: 'exam',
      message: 'Mid-Term Exam – Term 2 results published – Avg 68%',
      time: '1 hr ago',
      icon: 'fa-solid fa-file-circle-check',
    },
    {
      type: 'course',
      message: 'New course "Thermodynamics Masterclass" uploaded by Dr. Vikram',
      time: '2 hrs ago',
      icon: 'fa-solid fa-book',
    },
    {
      type: 'alert',
      message: '5 students missed Unit Test 4 – Mathematics session',
      time: '3 hrs ago',
      icon: 'fa-solid fa-triangle-exclamation',
    },
    {
      type: 'user',
      message: 'Faculty account created for Dr. Kiran Patel (Mathematics)',
      time: '5 hrs ago',
      icon: 'fa-solid fa-user-tie',
    },
    {
      type: 'payment',
      message: 'Refund request submitted by Priya Desai (Grade 10 – Batch B)',
      time: 'Yesterday',
      icon: 'fa-solid fa-rotate-left',
    },
  ];

  quickStats: QuickStat[] = [
    { label: 'Mock Test Attempt Rate',    value: 82, max: 100, color: '#4f46e5' },
    { label: 'Avg. Session Attendance',   value: 88, max: 100, color: '#10b981' },
    { label: 'Syllabus Completion Rate',  value: 67, max: 100, color: '#f59e0b' },
    { label: 'Student Satisfaction',      value: 94, max: 100, color: '#06b6d4' },
  ];

  enrollmentData = [
    { month: 'Oct', value: 310 },
    { month: 'Nov', value: 420 },
    { month: 'Dec', value: 390 },
    { month: 'Jan', value: 510 },
    { month: 'Feb', value: 620 },
    { month: 'Mar', value: 740 },
  ];

  chartSeries: ApexAxisChartSeries = [
    { name: 'Students Enrolled', data: [310, 420, 390, 510, 620, 740] }
  ];

  chartConfig: ApexChart = {
    type: 'area',
    height: 200,
    toolbar: { show: false },
    sparkline: { enabled: false },
    animations: { enabled: true, speed: 800 }
  };

  chartXAxis: ApexXAxis = {
    categories: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#9ca3af', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600 } }
  };

  chartYAxis: ApexYAxis = {
    labels: {
      style: { colors: '#9ca3af', fontSize: '11px', fontFamily: 'inherit' },
      formatter: (val: number) => val.toString()
    },
    min: 0
  };

  chartStroke: ApexStroke = { curve: 'smooth', width: 2.5 };

  chartFill: ApexFill = {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.02,
      stops: [0, 100]
    }
  };

  chartColors = ['#4f46e5'];

  chartDataLabels: ApexDataLabels = { enabled: false };

  chartGrid: ApexGrid = {
    borderColor: '#f1f4f9',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { top: 0, right: 10, bottom: 0, left: 10 }
  };

  chartMarkers: ApexMarkers = {
    size: 4,
    colors: ['#fff'],
    strokeColors: ['#4f46e5'],
    strokeWidth: 2,
    hover: { size: 6 }
  };

  chartTooltip: ApexTooltip = {
    theme: 'light',
    y: { formatter: (val: number) => `${val} students` }
  };

  roleDistribution = [
    { role: 'Secondary (Grade 8-10)', count: 1842, percentage: 57, color: '#10b981' },
    { role: 'Senior (Grade 11-12)',   count: 1186, percentage: 37, color: '#4f46e5' },
    { role: 'Faculty',                count: 58,   percentage: 4,  color: '#f59e0b' },
    { role: 'Parents',                count: 128,  percentage: 2,  color: '#06b6d4' },
  ];

  systemAlerts = [
    { type: 'warning', message: '4 faculty accounts pending subject verification', icon: 'fa-solid fa-clock' },
    { type: 'info',    message: '8 refund requests awaiting review',               icon: 'fa-solid fa-info-circle' },
    { type: 'success', message: 'BBB server health: all 18 rooms running smoothly', icon: 'fa-solid fa-circle-check' },
    { type: 'error',   message: '1 live session had BBB connection drop – resolved', icon: 'fa-solid fa-circle-xmark' },
  ];

  constructor(
    private readonly httpService: HttpGeneralService<any>,
    private common: CommonService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    this.currentDate = now;
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}

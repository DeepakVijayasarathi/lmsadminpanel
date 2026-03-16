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
      value: '2,847',
      subtitle: 'Enrolled students',
      icon: 'fa-solid fa-user-graduate',
      trend: 12.5,
      trendLabel: 'vs last month',
      colorClass: 'card-indigo',
    },
    {
      title: 'Total Teachers',
      value: '143',
      subtitle: 'Active educators',
      icon: 'fa-solid fa-chalkboard-user',
      trend: 4.2,
      trendLabel: 'vs last month',
      colorClass: 'card-emerald',
    },
    {
      title: 'Active Batches',
      value: '68',
      subtitle: 'Running batches',
      icon: 'fa-solid fa-layer-group',
      trend: 8.1,
      trendLabel: 'vs last month',
      colorClass: 'card-orange',
    },
    {
      title: 'Total Courses',
      value: '312',
      subtitle: 'Published courses',
      icon: 'fa-solid fa-book-open',
      trend: 18.3,
      trendLabel: 'vs last month',
      colorClass: 'card-purple',
    },
    {
      title: "Today's Live Classes",
      value: '24',
      subtitle: 'Classes in session',
      icon: 'fa-solid fa-video',
      trend: 0,
      trendLabel: 'same as yesterday',
      colorClass: 'card-sky',
    },
    {
      title: 'Monthly Revenue',
      value: '₹4,82,500',
      subtitle: 'Payments received',
      icon: 'fa-solid fa-indian-rupee-sign',
      trend: 22.7,
      trendLabel: 'vs last month',
      colorClass: 'card-rose',
    },
  ];

  upcomingClasses: UpcomingClass[] = [
    {
      subject: 'Mathematics - Calculus',
      teacher: 'Dr. Priya Sharma',
      batch: 'Batch A - Class 12',
      time: '10:00 AM',
      endTime: '11:00 AM',
      duration: '60 min',
      students: 42,
      status: 'live',
    },
    {
      subject: 'Physics - Mechanics',
      teacher: 'Mr. Arjun Nair',
      batch: 'Batch B - Class 11',
      time: '11:30 AM',
      endTime: '12:15 PM',
      duration: '45 min',
      students: 38,
      status: 'upcoming',
    },
    {
      subject: 'Chemistry - Organic',
      teacher: 'Ms. Kavitha Reddy',
      batch: 'Batch C - Class 12',
      time: '02:00 PM',
      endTime: '03:00 PM',
      duration: '60 min',
      students: 46,
      status: 'scheduled',
    },
    {
      subject: 'English Literature',
      teacher: 'Mr. Rajan Pillai',
      batch: 'Batch D - Class 10',
      time: '03:30 PM',
      endTime: '04:15 PM',
      duration: '45 min',
      students: 34,
      status: 'scheduled',
    },
    {
      subject: 'Biology - Cell Division',
      teacher: 'Dr. Meena Iyer',
      batch: 'Batch A - Class 11',
      time: '04:30 PM',
      endTime: '05:30 PM',
      duration: '60 min',
      students: 40,
      status: 'scheduled',
    },
  ];

  recentActivities: RecentActivity[] = [
    {
      type: 'user',
      message: '15 new students enrolled in Batch A - Class 12',
      time: '5 min ago',
      icon: 'fa-solid fa-user-plus',
    },
    {
      type: 'payment',
      message: 'Payment of ₹12,500 received from Rahul Verma',
      time: '18 min ago',
      icon: 'fa-solid fa-circle-check',
    },
    {
      type: 'course',
      message: 'New course "Advanced Physics" published by Dr. Arjun',
      time: '1 hr ago',
      icon: 'fa-solid fa-book',
    },
    {
      type: 'exam',
      message: 'Quiz results for "Math Unit 5" are now available',
      time: '2 hrs ago',
      icon: 'fa-solid fa-file-circle-check',
    },
    {
      type: 'alert',
      message: '3 students missed today\'s Chemistry live class',
      time: '3 hrs ago',
      icon: 'fa-solid fa-triangle-exclamation',
    },
    {
      type: 'user',
      message: 'Teacher account created for Ms. Deepa Krishnan',
      time: '5 hrs ago',
      icon: 'fa-solid fa-user-tie',
    },
    {
      type: 'payment',
      message: 'Refund request submitted by Ananya Singh',
      time: 'Yesterday',
      icon: 'fa-solid fa-rotate-left',
    },
  ];

  quickStats: QuickStat[] = [
    { label: 'Assignment Submission Rate', value: 78, max: 100, color: '#4f46e5' },
    { label: 'Avg. Class Attendance', value: 85, max: 100, color: '#10b981' },
    { label: 'Course Completion Rate', value: 62, max: 100, color: '#f59e0b' },
    { label: 'Student Satisfaction Score', value: 91, max: 100, color: '#06b6d4' },
  ];

  enrollmentData = [
    { month: 'Oct', value: 180 },
    { month: 'Nov', value: 240 },
    { month: 'Dec', value: 210 },
    { month: 'Jan', value: 290 },
    { month: 'Feb', value: 340 },
    { month: 'Mar', value: 380 },
  ];

  chartSeries: ApexAxisChartSeries = [
    { name: 'Students Enrolled', data: [180, 240, 210, 290, 340, 380] }
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
    { role: 'Students', count: 2847, percentage: 93, color: '#4f46e5' },
    { role: 'Teachers', count: 143, percentage: 5, color: '#10b981' },
    { role: 'Parents', count: 62, percentage: 2, color: '#f59e0b' },
  ];

  systemAlerts = [
    { type: 'warning', message: '5 teacher accounts pending verification', icon: 'fa-solid fa-clock' },
    { type: 'info', message: '12 refund requests awaiting review', icon: 'fa-solid fa-info-circle' },
    { type: 'success', message: 'All scheduled backups completed successfully', icon: 'fa-solid fa-circle-check' },
    { type: 'error', message: '2 live class sessions reported technical issues', icon: 'fa-solid fa-circle-xmark' },
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

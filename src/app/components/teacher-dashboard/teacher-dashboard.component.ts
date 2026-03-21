import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TimetableService } from '../../services/timetable.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: false,
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css',
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  currentTime = '';
  private timeInterval: any;

  constructor(private router: Router, private timetableService: TimetableService) {}

  teacher = {
    name: 'Dr. Priya Sharma',
    subject: 'Mathematics',
    avatar: 'P',
    totalClasses: 842,
  };

  stats = [
    { label: 'My Students', value: '186', icon: 'fa-solid fa-user-graduate', color: '#4f46e5', bg: '#eef2ff', trend: '+12' },
    { label: 'Active Batches', value: '6', icon: 'fa-solid fa-layer-group', color: '#0d9488', bg: '#ccfbf1', trend: '+1' },
    { label: "Today's Classes", value: '0', icon: 'fa-solid fa-video', color: '#d97706', bg: '#fef3c7', trend: '' },
    { label: 'Pending Reviews', value: '23', icon: 'fa-solid fa-clipboard-check', color: '#dc2626', bg: '#fee2e2', trend: '-5' },
  ];

  timetable: { time: string; batch: string; topic: string; status: string; duration: string; meetingLink: string; students: number }[] = [];

  batches = [
    { name: 'Batch A — Class 12', students: 42, attendance: 88, pending: 3, color: '#4f46e5' },
    { name: 'Batch B — Class 11', students: 38, attendance: 74, pending: 8, color: '#0d9488' },
    { name: 'Batch C — Class 10', students: 46, attendance: 91, pending: 1, color: '#f97316' },
    { name: 'Batch D — Class 12', students: 40, attendance: 82, pending: 5, color: '#a855f7' },
    { name: 'Batch E — Class 9', students: 35, attendance: 67, pending: 11, color: '#db2777' },
    { name: 'Batch F — Class 11', students: 44, attendance: 95, pending: 0, color: '#059669' },
  ];

  pendingSubmissions = [
    { student: 'Rahul Verma', batch: 'Batch A', assignment: 'Integration Practice Set 4', submitted: '2 hrs ago', avatar: 'R' },
    { student: 'Sneha Patel', batch: 'Batch B', assignment: 'Trigonometry Worksheet', submitted: '4 hrs ago', avatar: 'S' },
    { student: 'Aditya Kumar', batch: 'Batch C', assignment: 'Algebra Problem Set', submitted: '5 hrs ago', avatar: 'A' },
    { student: 'Priya Singh', batch: 'Batch A', assignment: 'Practice Test 3', submitted: 'Yesterday', avatar: 'P' },
    { student: 'Kiran Rao', batch: 'Batch D', assignment: 'Statistics Assignment', submitted: 'Yesterday', avatar: 'K' },
  ];

  performanceData = [
    { label: 'Batch A', score: 84, color: '#4f46e5' },
    { label: 'Batch B', score: 71, color: '#0d9488' },
    { label: 'Batch C', score: 90, color: '#f97316' },
    { label: 'Batch D', score: 78, color: '#a855f7' },
    { label: 'Batch E', score: 63, color: '#db2777' },
    { label: 'Batch F', score: 95, color: '#059669' },
  ];

  recentActivity = [
    { type: 'upload', msg: 'You uploaded "Calculus Notes Chapter 7"', time: '1 hr ago', icon: 'fa-solid fa-upload', color: '#4f46e5' },
    { type: 'homework', msg: 'Homework assigned to Batch A — Due tonight', time: '3 hrs ago', icon: 'fa-solid fa-file-pen', color: '#0d9488' },
    { type: 'quiz', msg: 'Quiz "Unit 5 Test" published for Batch C', time: '5 hrs ago', icon: 'fa-solid fa-circle-question', color: '#f97316' },
    { type: 'attendance', msg: 'Attendance marked for Batch B (38/38)', time: 'Yesterday', icon: 'fa-solid fa-calendar-check', color: '#059669' },
    { type: 'alert', msg: '3 students flagged for low attendance in Batch E', time: 'Yesterday', icon: 'fa-solid fa-triangle-exclamation', color: '#d97706' },
  ];

  getAttColor(val: number): string {
    if (val >= 85) return '#059669';
    if (val >= 70) return '#d97706';
    return '#dc2626';
  }

  ngOnInit(): void {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    this.loadTimetable();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    this.currentDate = now;
  }

  private loadTimetable(): void {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    this.timetableService.getAll().subscribe({
      next: (raw: any[]) => {
        const todaySlots = raw.filter(r => {
          const tt = r.timetable ?? r;
          return (tt.day ?? '').toLowerCase() === today.toLowerCase();
        });
        this.timetable = todaySlots.map(r => {
          const tt = r.timetable ?? r;
          const rawStatus = (tt.status ?? r.status ?? 'scheduled').toLowerCase();
          const status = rawStatus === 'completed' ? 'done'
                       : rawStatus === 'scheduled'  ? 'upcoming'
                       : rawStatus;
          return {
            time: this.toAmPm(tt.startTime ?? ''),
            batch: tt.batch ?? '',
            topic: `${tt.subject ?? ''}${tt.topic ? ': ' + tt.topic : ''}`,
            status,
            duration: (tt.startTime && tt.endTime) ? this.calcDuration(tt.startTime, tt.endTime) : '',
            meetingLink: tt.meetingLink ?? r.meetingUrl ?? '',
            students: 0,
          };
        });
        // Update "Today's Classes" stat
        this.stats[2].value = String(this.timetable.length);
      },
      error: () => {}
    });
  }

  private toAmPm(t: string): string {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }

  private calcDuration(start: string, end: string): string {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return mins > 0 ? `${mins} min` : '';
  }

  goToTimetable(): void {
    this.router.navigate(['/timetable']);
  }

  joinMeeting(link: string): void {
    if (link) window.open(link, '_blank');
  }
}

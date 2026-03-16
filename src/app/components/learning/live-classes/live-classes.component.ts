import { Component } from '@angular/core';

interface LiveClass {
  id: number;
  subject: string;
  teacher: string;
  batch: string;
  date: string;
  startTime: string;
  endTime: string;
  students: number;
  status: 'live' | 'upcoming' | 'completed' | 'cancelled';
  meetingLink: string;
}

@Component({
  selector: 'app-live-classes',
  standalone: false,
  templateUrl: './live-classes.component.html',
  styleUrls: ['../../../shared-page.css', './live-classes.component.css']
})
export class LiveClassesComponent {
  searchQuery = '';
  statusFilter = '';

  liveClasses: LiveClass[] = [
    { id: 1, subject: 'Mathematics – Calculus', teacher: 'Dr. Anita Sharma', batch: 'Class 12-A', date: '2026-03-16', startTime: '10:00 AM', endTime: '11:30 AM', students: 42, status: 'live', meetingLink: 'https://meet.example.com/math-calc' },
    { id: 2, subject: 'Physics – Electromagnetism', teacher: 'Mr. Rajesh Kumar', batch: 'Class 11-B', date: '2026-03-16', startTime: '12:00 PM', endTime: '01:00 PM', students: 38, status: 'live', meetingLink: 'https://meet.example.com/phy-em' },
    { id: 3, subject: 'Chemistry – Organic Reactions', teacher: 'Ms. Priya Nair', batch: 'Class 12-B', date: '2026-03-16', startTime: '02:00 PM', endTime: '03:30 PM', students: 35, status: 'upcoming', meetingLink: 'https://meet.example.com/chem-org' },
    { id: 4, subject: 'Biology – Genetics', teacher: 'Dr. Suresh Menon', batch: 'Class 11-A', date: '2026-03-16', startTime: '04:00 PM', endTime: '05:00 PM', students: 30, status: 'upcoming', meetingLink: 'https://meet.example.com/bio-gen' },
    { id: 5, subject: 'English – Poetry Analysis', teacher: 'Ms. Kavitha Rao', batch: 'Class 10-A', date: '2026-03-15', startTime: '09:00 AM', endTime: '10:00 AM', students: 48, status: 'completed', meetingLink: 'https://meet.example.com/eng-poetry' },
    { id: 6, subject: 'History – World War II', teacher: 'Mr. Arun Pillai', batch: 'Class 10-B', date: '2026-03-15', startTime: '11:00 AM', endTime: '12:00 PM', students: 40, status: 'completed', meetingLink: 'https://meet.example.com/hist-ww2' },
    { id: 7, subject: 'Computer Science – Algorithms', teacher: 'Ms. Deepa Iyer', batch: 'Class 12-C', date: '2026-03-14', startTime: '03:00 PM', endTime: '04:30 PM', students: 25, status: 'cancelled', meetingLink: 'https://meet.example.com/cs-algo' }
  ];

  get filteredClasses(): LiveClass[] {
    return this.liveClasses.filter(lc => {
      const matchesSearch = !this.searchQuery ||
        lc.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        lc.teacher.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        lc.batch.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = !this.statusFilter || lc.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  getDuration(start: string, end: string): string {
    const parseTime = (t: string) => {
      const [time, meridiem] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (meridiem === 'PM' && h !== 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    const diff = parseTime(end) - parseTime(start);
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      live: 'pg-badge pg-badge--red',
      upcoming: 'pg-badge pg-badge--blue',
      completed: 'pg-badge pg-badge--green',
      cancelled: 'pg-badge pg-badge--gray'
    };
    return map[status] || 'pg-badge';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

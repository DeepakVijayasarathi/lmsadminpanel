import { Component } from '@angular/core';

interface LiveClass {
  id: number;
  subject: string;
  topic: string;
  teacher: string;
  batch: string;
  examType: 'NEET' | 'JEE Main' | 'JEE Advanced';
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
    { id: 1,  subject: 'Physics',     topic: 'Electrostatics',          teacher: 'Dr. Vikram Sharma',  batch: 'NEET 2025 – Batch A',     examType: 'NEET',         date: '2026-03-17', startTime: '07:00 AM', endTime: '08:30 AM', students: 48, status: 'live',      meetingLink: 'https://bbb.edulanz.com/b/neet-2025-batch-a-physics-monday-s1' },
    { id: 2,  subject: 'Mathematics', topic: 'Calculus – Integration',  teacher: 'Mr. Arjun Verma',    batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     date: '2026-03-17', startTime: '09:00 AM', endTime: '10:30 AM', students: 42, status: 'live',      meetingLink: 'https://bbb.edulanz.com/b/jee-main-2025-batch-a-mathematics-monday-s2' },
    { id: 3,  subject: 'Chemistry',   topic: 'Organic Reactions',       teacher: 'Ms. Pooja Iyer',     batch: 'NEET 2025 – Batch B',     examType: 'NEET',         date: '2026-03-17', startTime: '11:00 AM', endTime: '12:30 PM', students: 44, status: 'upcoming',  meetingLink: 'https://bbb.edulanz.com/b/neet-2025-batch-b-chemistry-monday-s3' },
    { id: 4,  subject: 'Physics',     topic: 'Mechanics – Dynamics',    teacher: 'Mr. Rahul Gupta',    batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     date: '2026-03-17', startTime: '02:00 PM', endTime: '03:30 PM', students: 42, status: 'upcoming',  meetingLink: 'https://bbb.edulanz.com/b/jee-main-2025-batch-a-physics-monday-s4' },
    { id: 5,  subject: 'Biology',     topic: 'Genetics & Evolution',    teacher: 'Dr. Meena Krishnan', batch: 'NEET 2025 – Batch A',     examType: 'NEET',         date: '2026-03-17', startTime: '04:00 PM', endTime: '05:30 PM', students: 48, status: 'upcoming',  meetingLink: 'https://bbb.edulanz.com/b/neet-2025-batch-a-biology-monday-s5' },
    { id: 6,  subject: 'Mathematics', topic: 'Matrices & Determinants', teacher: 'Dr. Kiran Patel',    batch: 'JEE Advanced 2025',       examType: 'JEE Advanced', date: '2026-03-17', startTime: '06:00 PM', endTime: '07:30 PM', students: 22, status: 'upcoming',  meetingLink: 'https://bbb.edulanz.com/b/jee-advanced-2025-mathematics-monday-s6' },
    { id: 7,  subject: 'Physics',     topic: 'Thermodynamics',          teacher: 'Dr. Vikram Sharma',  batch: 'NEET 2025 – Batch A',     examType: 'NEET',         date: '2026-03-16', startTime: '07:00 AM', endTime: '08:30 AM', students: 46, status: 'completed', meetingLink: 'https://bbb.edulanz.com/b/neet-2025-batch-a-physics-sunday-s1' },
    { id: 8,  subject: 'Chemistry',   topic: 'Inorganic Chemistry',     teacher: 'Dr. Sanjay Mishra',  batch: 'JEE Main 2025 – Batch B', examType: 'JEE Main',     date: '2026-03-16', startTime: '09:00 AM', endTime: '10:30 AM', students: 40, status: 'completed', meetingLink: 'https://bbb.edulanz.com/b/jee-main-2025-batch-b-chemistry-sunday-s2' },
    { id: 9,  subject: 'Biology',     topic: 'Human Physiology',        teacher: 'Ms. Divya Nair',     batch: 'NEET 2025 – Batch B',     examType: 'NEET',         date: '2026-03-16', startTime: '11:00 AM', endTime: '12:30 PM', students: 44, status: 'completed', meetingLink: 'https://bbb.edulanz.com/b/neet-2025-batch-b-biology-sunday-s3' },
    { id: 10, subject: 'Mathematics', topic: 'Coordinate Geometry',     teacher: 'Mr. Arjun Verma',    batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     date: '2026-03-15', startTime: '09:00 AM', endTime: '10:30 AM', students: 42, status: 'cancelled', meetingLink: 'https://bbb.edulanz.com/b/jee-main-2025-batch-a-mathematics-saturday-s2' },
  ];

  get filteredClasses(): LiveClass[] {
    return this.liveClasses.filter(lc => {
      const q = this.searchQuery.toLowerCase();
      const matchesSearch = !q ||
        lc.subject.toLowerCase().includes(q) ||
        lc.topic.toLowerCase().includes(q) ||
        lc.teacher.toLowerCase().includes(q) ||
        lc.batch.toLowerCase().includes(q) ||
        lc.examType.toLowerCase().includes(q);
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

import { Component } from '@angular/core';

export interface Exam {
  id: number;
  title: string;
  subject: string;
  class: string;
  teacher: string;
  duration: number;
  totalMarks: number;
  scheduled: string;
  status: 'upcoming' | 'live' | 'completed' | 'draft';
  attempts: number;
}

@Component({
  selector: 'app-exams',
  standalone: false,
  templateUrl: './exams.component.html',
  styleUrls: ['../../../shared-page.css', './exams.component.css']
})
export class ExamsComponent {
  exams: Exam[] = [
    { id: 1,  title: 'NEET Full Mock Test #7',              subject: 'Physics + Chemistry + Biology', class: 'NEET 2025 – Batch A', teacher: 'Dr. Vikram Sharma',  duration: 200, totalMarks: 720, scheduled: '2026-03-20', status: 'upcoming',  attempts: 0  },
    { id: 2,  title: 'JEE Main Mock Test #5 (Live)',        subject: 'Physics + Chemistry + Maths',   class: 'JEE Main 2025 – Batch A', teacher: 'Mr. Arjun Verma', duration: 180, totalMarks: 300, scheduled: '2026-03-17', status: 'live',      attempts: 38 },
    { id: 3,  title: 'NEET Chapter Test – Mechanics',       subject: 'Physics',                       class: 'NEET 2025 – Batch B', teacher: 'Mr. Rahul Gupta',   duration: 60,  totalMarks: 180, scheduled: '2026-03-15', status: 'completed', attempts: 44 },
    { id: 4,  title: 'JEE Adv Mock Test #3',               subject: 'Physics + Chemistry + Maths',   class: 'JEE Advanced 2025',       teacher: 'Dr. Kiran Patel',  duration: 180, totalMarks: 360, scheduled: '2026-03-22', status: 'upcoming',  attempts: 0  },
    { id: 5,  title: 'NEET Biology Grand Test',             subject: 'Biology',                       class: 'NEET 2025 – Batch A', teacher: 'Dr. Meena Krishnan', duration: 90,  totalMarks: 360, scheduled: '2026-04-05', status: 'draft',     attempts: 0  },
    { id: 6,  title: 'Chemistry Chapter Test – Organic',    subject: 'Chemistry',                     class: 'NEET 2025 – Batch B', teacher: 'Ms. Pooja Iyer',    duration: 60,  totalMarks: 180, scheduled: '2026-03-25', status: 'upcoming',  attempts: 0  },
    { id: 7,  title: 'JEE Main Mock Test #4',              subject: 'Physics + Chemistry + Maths',   class: 'JEE Main 2025 – Batch B', teacher: 'Dr. Sanjay Mishra', duration: 180, totalMarks: 300, scheduled: '2026-03-14', status: 'completed', attempts: 40 },
    { id: 8,  title: 'Maths Chapter Test – Calculus (JEE)', subject: 'Mathematics',                   class: 'JEE Main 2025 – Batch A', teacher: 'Mr. Arjun Verma', duration: 60,  totalMarks: 100, scheduled: '2026-03-28', status: 'upcoming',  attempts: 0  },
  ];

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      live: 'pg-badge--red',
      upcoming: 'pg-badge--blue',
      completed: 'pg-badge--green',
      draft: 'pg-badge--gray'
    };
    return map[status] || 'pg-badge--gray';
  }
}

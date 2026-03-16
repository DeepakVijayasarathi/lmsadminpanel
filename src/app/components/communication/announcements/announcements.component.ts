import { Component } from '@angular/core';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: 'students' | 'teachers' | 'all';
  postedBy: string;
  postedAt: string;
  pinned: boolean;
  status: 'active' | 'expired';
}

@Component({
  selector: 'app-announcements',
  standalone: false,
  templateUrl: './announcements.component.html',
  styleUrls: ['../../../shared-page.css', './announcements.component.css']
})
export class AnnouncementsComponent {
  announcements: Announcement[] = [
    { id: 1, title: 'Mid-Term Exams Begin March 20', content: 'All students are informed that mid-term examinations will commence from March 20. Detailed schedule has been shared via the app.', audience: 'students', postedBy: 'Admin', postedAt: '2026-03-15', pinned: true, status: 'active' },
    { id: 2, title: 'Staff Training on March 18', content: 'All teaching staff are required to attend the mandatory training session on March 18 in the conference room.', audience: 'teachers', postedBy: 'Principal', postedAt: '2026-03-14', pinned: true, status: 'active' },
    { id: 3, title: 'New Library Hours Effective April', content: 'Library will now remain open from 7 AM to 8 PM on all working days starting April 1.', audience: 'all', postedBy: 'Admin', postedAt: '2026-03-13', pinned: false, status: 'active' },
    { id: 4, title: 'Annual Sports Day Registration', content: 'Registration for the Annual Sports Day is now open. Last date for registration is March 25.', audience: 'students', postedBy: 'Sports Coordinator', postedAt: '2026-03-12', pinned: true, status: 'active' },
    { id: 5, title: 'Winter Break Schedule', content: 'School will be closed for winter break from December 25 to January 5. Classes resume January 6.', audience: 'all', postedBy: 'Admin', postedAt: '2025-12-20', pinned: false, status: 'expired' },
    { id: 6, title: 'Q3 Exam Results Published', content: 'Q3 examination results have been published. Students can view their scores in the results section.', audience: 'students', postedBy: 'Admin', postedAt: '2025-11-30', pinned: false, status: 'expired' }
  ];

  audienceBadge(audience: string): string {
    const map: Record<string, string> = {
      students: 'pg-badge--blue',
      teachers: 'pg-badge--purple',
      all: 'pg-badge--indigo'
    };
    return map[audience] || 'pg-badge--gray';
  }

  statusBadge(status: string): string {
    return status === 'active' ? 'pg-badge--green' : 'pg-badge--gray';
  }
}

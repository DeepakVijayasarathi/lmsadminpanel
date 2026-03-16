import { Component } from '@angular/core';

export interface Notification {
  id: number;
  title: string;
  type: 'push' | 'whatsapp' | 'sms' | 'email';
  target: string;
  sentAt: string;
  recipients: number;
  status: 'sent' | 'scheduled' | 'draft';
  message: string;
}

@Component({
  selector: 'app-notifications',
  standalone: false,
  templateUrl: './notifications.component.html',
  styleUrls: ['../../../shared-page.css', './notifications.component.css']
})
export class NotificationsComponent {
  notifications: Notification[] = [
    { id: 1, title: 'Exam Schedule Released', type: 'push', target: 'All Students', sentAt: '2026-03-16 09:00', recipients: 2847, status: 'sent', message: 'The mid-term exam schedule has been released. Please check your timetable.' },
    { id: 2, title: 'Fee Due Reminder', type: 'whatsapp', target: 'All Students', sentAt: '2026-03-16 08:30', recipients: 640, status: 'sent', message: 'Your monthly fee is due by March 20. Please complete your payment to avoid late fees.' },
    { id: 3, title: 'New Batch Starting', type: 'sms', target: 'Batch A - Class 10', sentAt: '2026-03-15 11:00', recipients: 42, status: 'sent', message: 'New batch for Class 10 starts on March 20. Ensure attendance.' },
    { id: 4, title: 'Parent Meeting Notice', type: 'email', target: 'All Teachers', sentAt: '2026-03-15 10:00', recipients: 85, status: 'sent', message: 'Parent-teacher meeting scheduled for March 22. Please prepare student progress reports.' },
    { id: 5, title: 'Holiday Announcement', type: 'push', target: 'All Students', sentAt: '2026-03-17 09:00', recipients: 2847, status: 'scheduled', message: 'School will remain closed on March 21 due to a public holiday.' },
    { id: 6, title: 'Result Publication Alert', type: 'whatsapp', target: 'Batch B - Class 12', sentAt: '', recipients: 0, status: 'draft', message: 'Class 12 results are now available. Log in to view your scores.' },
    { id: 7, title: 'App Update Available', type: 'push', target: 'All Students', sentAt: '2026-03-14 14:00', recipients: 2847, status: 'sent', message: 'A new version of the B2P app is available. Update now for the latest features.' }
  ];

  truncate(text: string, limit = 40): string {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  typeBadge(type: string): string {
    const map: Record<string, string> = {
      push: 'pg-badge--blue',
      whatsapp: 'pg-badge--green',
      sms: 'pg-badge--yellow',
      email: 'pg-badge--indigo'
    };
    return map[type] || 'pg-badge--gray';
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      sent: 'pg-badge--green',
      scheduled: 'pg-badge--blue',
      draft: 'pg-badge--gray'
    };
    return map[status] || 'pg-badge--gray';
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      push: 'fa-bell',
      whatsapp: 'fa-brands fa-whatsapp',
      sms: 'fa-comment-sms',
      email: 'fa-envelope'
    };
    return map[type] || 'fa-bell';
  }
}

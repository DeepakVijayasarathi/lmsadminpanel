import { Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';

export interface LiveClass {
  id: number;
  subject: string;
  topic: string;
  teacher: string;
  batch: string;
  date: string;
  startTime: string;
  endTime: string;
  students: number;
  status: 'live' | 'upcoming' | 'completed' | 'cancelled';
  meetingLink: string;
}

type ModalMode = 'create' | 'edit' | 'view' | 'cancel' | null;

@Component({
  selector: 'app-live-classes',
  standalone: false,
  templateUrl: './live-classes.component.html',
  styleUrls: ['../../../shared-page.css', './live-classes.component.css']
})
export class LiveClassesComponent {
  searchQuery = '';
  statusFilter = '';

  modalMode: ModalMode = null;
  selectedClass: LiveClass | null = null;

  // Form fields
  formSubject = '';
  formTopic = '';
  formTeacher = '';
  formBatch = '';
  formDate = '';
  formStartTime = '';
  formEndTime = '';
  formStudents = 40;

  formSubjectError = '';
  formTopicError = '';
  formTeacherError = '';
  formBatchError = '';
  formDateError = '';
  formStartTimeError = '';
  formEndTimeError = '';

  nextId = 11;

  liveClasses: LiveClass[] = [
    { id: 1,  subject: 'Mathematics',    topic: 'Algebra – Quadratic Equations', teacher: 'Dr. Vikram Sharma',  batch: 'Grade 10 – Batch A', date: '2026-03-17', startTime: '07:00 AM', endTime: '08:30 AM', students: 42, status: 'live',      meetingLink: 'https://bbb.example.com/b/grade10-batch-a-math-monday' },
    { id: 2,  subject: 'Physics',        topic: 'Mechanics – Newton\'s Laws',    teacher: 'Mr. Arjun Verma',    batch: 'Grade 11 – Batch A', date: '2026-03-17', startTime: '09:00 AM', endTime: '10:30 AM', students: 38, status: 'live',      meetingLink: 'https://bbb.example.com/b/grade11-batch-a-physics-monday' },
    { id: 3,  subject: 'Chemistry',      topic: 'Periodic Table & Trends',       teacher: 'Ms. Pooja Iyer',     batch: 'Grade 10 – Batch B', date: '2026-03-17', startTime: '11:00 AM', endTime: '12:30 PM', students: 40, status: 'upcoming',  meetingLink: 'https://bbb.example.com/b/grade10-batch-b-chem-monday' },
    { id: 4,  subject: 'English',        topic: 'Essay Writing – Argumentative', teacher: 'Mr. Rahul Gupta',    batch: 'Grade 9 – Batch A',  date: '2026-03-17', startTime: '02:00 PM', endTime: '03:30 PM', students: 35, status: 'upcoming',  meetingLink: 'https://bbb.example.com/b/grade9-batch-a-english-monday' },
    { id: 5,  subject: 'Biology',        topic: 'Cell Structure & Functions',    teacher: 'Dr. Meena Krishnan', batch: 'Grade 10 – Batch A', date: '2026-03-17', startTime: '04:00 PM', endTime: '05:30 PM', students: 42, status: 'upcoming',  meetingLink: 'https://bbb.example.com/b/grade10-batch-a-bio-monday' },
    { id: 6,  subject: 'Computer Sci.',  topic: 'Data Structures – Arrays',      teacher: 'Dr. Kiran Patel',    batch: 'Grade 12 – Batch A', date: '2026-03-17', startTime: '06:00 PM', endTime: '07:30 PM', students: 28, status: 'upcoming',  meetingLink: 'https://bbb.example.com/b/grade12-batch-a-cs-monday' },
    { id: 7,  subject: 'Mathematics',    topic: 'Trigonometry – Identities',     teacher: 'Dr. Vikram Sharma',  batch: 'Grade 11 – Batch B', date: '2026-03-16', startTime: '07:00 AM', endTime: '08:30 AM', students: 36, status: 'completed', meetingLink: 'https://bbb.example.com/b/grade11-batch-b-math-sunday' },
    { id: 8,  subject: 'History',        topic: 'World War II – Causes & Effects',teacher: 'Dr. Sanjay Mishra',  batch: 'Grade 9 – Batch B',  date: '2026-03-16', startTime: '09:00 AM', endTime: '10:30 AM', students: 32, status: 'completed', meetingLink: 'https://bbb.example.com/b/grade9-batch-b-history-sunday' },
    { id: 9,  subject: 'Biology',        topic: 'Human Digestive System',        teacher: 'Ms. Divya Nair',     batch: 'Grade 10 – Batch B', date: '2026-03-16', startTime: '11:00 AM', endTime: '12:30 PM', students: 40, status: 'completed', meetingLink: 'https://bbb.example.com/b/grade10-batch-b-bio-sunday' },
    { id: 10, subject: 'Economics',      topic: 'Supply & Demand Curves',        teacher: 'Mr. Arjun Verma',    batch: 'Grade 12 – Batch B', date: '2026-03-15', startTime: '09:00 AM', endTime: '10:30 AM', students: 30, status: 'cancelled', meetingLink: 'https://bbb.example.com/b/grade12-batch-b-eco-saturday' },
  ];

  constructor(private commonService: CommonService) {}

  get filteredClasses(): LiveClass[] {
    const q = this.searchQuery.toLowerCase();
    return this.liveClasses.filter(lc => {
      const matchSearch = !q || lc.subject.toLowerCase().includes(q) || lc.topic.toLowerCase().includes(q) || lc.teacher.toLowerCase().includes(q) || lc.batch.toLowerCase().includes(q);
      const matchStatus = !this.statusFilter || lc.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  get liveCount(): number { return this.liveClasses.filter(c => c.status === 'live').length; }
  get upcomingCount(): number { return this.liveClasses.filter(c => c.status === 'upcoming').length; }

  openScheduleModal(): void {
    this.modalMode = 'create';
    this.selectedClass = null;
    this.resetForm();
  }

  openEditModal(cls: LiveClass): void {
    this.modalMode = 'edit';
    this.selectedClass = cls;
    this.formSubject = cls.subject; this.formTopic = cls.topic; this.formTeacher = cls.teacher;
    this.formBatch = cls.batch; this.formDate = cls.date;
    this.formStartTime = cls.startTime; this.formEndTime = cls.endTime; this.formStudents = cls.students;
    this.clearErrors();
  }

  openViewModal(cls: LiveClass): void { this.modalMode = 'view'; this.selectedClass = cls; }
  openCancelModal(cls: LiveClass): void { this.modalMode = 'cancel'; this.selectedClass = cls; }
  closeModal(): void { this.modalMode = null; this.selectedClass = null; this.clearErrors(); }

  resetForm(): void {
    this.formSubject = ''; this.formTopic = ''; this.formTeacher = ''; this.formBatch = '';
    this.formDate = ''; this.formStartTime = ''; this.formEndTime = ''; this.formStudents = 40;
    this.clearErrors();
  }

  clearErrors(): void {
    this.formSubjectError = ''; this.formTopicError = ''; this.formTeacherError = '';
    this.formBatchError = ''; this.formDateError = ''; this.formStartTimeError = ''; this.formEndTimeError = '';
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;
    if (!this.formSubject.trim()) { this.formSubjectError = 'Subject is required.'; valid = false; }
    if (!this.formTopic.trim()) { this.formTopicError = 'Topic is required.'; valid = false; }
    if (!this.formTeacher.trim()) { this.formTeacherError = 'Teacher is required.'; valid = false; }
    if (!this.formBatch.trim()) { this.formBatchError = 'Batch is required.'; valid = false; }
    if (!this.formDate) { this.formDateError = 'Date is required.'; valid = false; }
    if (!this.formStartTime) { this.formStartTimeError = 'Start time is required.'; valid = false; }
    if (!this.formEndTime) { this.formEndTimeError = 'End time is required.'; valid = false; }
    return valid;
  }

  buildMeetingLink(batch: string, subject: string): string {
    const slug = (batch + '-' + subject).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `https://bbb.example.com/b/${slug}`;
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.liveClasses.unshift({
        id: this.nextId++,
        subject: this.formSubject.trim(), topic: this.formTopic.trim(),
        teacher: this.formTeacher.trim(), batch: this.formBatch.trim(),
        date: this.formDate, startTime: this.formStartTime, endTime: this.formEndTime,
        students: this.formStudents, status: 'upcoming',
        meetingLink: this.buildMeetingLink(this.formBatch, this.formSubject)
      });
      this.commonService.success(`Session "${this.formTopic.trim()}" scheduled.`);
    } else if (this.modalMode === 'edit' && this.selectedClass) {
      const idx = this.liveClasses.findIndex(c => c.id === this.selectedClass!.id);
      if (idx > -1) {
        this.liveClasses[idx] = {
          ...this.liveClasses[idx],
          subject: this.formSubject.trim(), topic: this.formTopic.trim(),
          teacher: this.formTeacher.trim(), batch: this.formBatch.trim(),
          date: this.formDate, startTime: this.formStartTime, endTime: this.formEndTime, students: this.formStudents
        };
      }
      this.commonService.success('Session updated.');
    }
    this.closeModal();
  }

  confirmCancel(): void {
    if (!this.selectedClass) return;
    const idx = this.liveClasses.findIndex(c => c.id === this.selectedClass!.id);
    if (idx > -1) this.liveClasses[idx].status = 'cancelled';
    this.commonService.warning(`Session "${this.selectedClass.topic}" cancelled.`);
    this.closeModal();
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

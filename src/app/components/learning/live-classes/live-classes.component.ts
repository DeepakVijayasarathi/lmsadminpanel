import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { LiveSessionService, LiveSessionDto } from '../../../services/live-session.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface LiveClass {
  id: string;
  batchId: string;
  courseId: string;
  teacherId: string;
  title: string;
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
export class LiveClassesComponent implements OnInit {
  searchQuery = '';
  statusFilter = '';
  isLoading = false;
  joiningId = '';

  modalMode: ModalMode = null;
  selectedClass: LiveClass | null = null;

  // Form fields
  formTitle = '';
  formBatchId = '';
  formCourseId = '';
  formTeacherId = '';
  formDate = '';
  formStartTime = '';
  formEndTime = '';

  formTitleError = '';
  formBatchIdError = '';
  formCourseIdError = '';
  formTeacherIdError = '';
  formDateError = '';
  formStartTimeError = '';
  formEndTimeError = '';

  liveClasses: LiveClass[] = [];

  batches: { id: string; name: string }[] = [];
  courses: { id: string; title: string }[] = [];
  teachers: { id: string; name: string }[] = [];

  private currentUserName = 'User';
  private currentUserRole: 'admin' | 'teacher' | 'student' = 'admin';

  constructor(
    private commonService: CommonService,
    private liveSessionService: LiveSessionService,
    private httpService: HttpGeneralService<any>
  ) {}

  ngOnInit(): void {
    this.loadSessions();
    this.loadDropdownData();
    this.loadCurrentUser();
  }

  // ─── API ────────────────────────────────────────────────────

  loadCurrentUser(): void {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      const roleName = (payload.roleName ?? '').toString().toLowerCase();
      this.currentUserRole =
        roleName === 'teacher' ? 'teacher' :
        roleName === 'student' ? 'student' : 'admin';
      if (userId) {
        this.httpService.getData(BASE_URL, `/users/${userId}`).subscribe({
          next: (res: any) => {
            const first = res.firstName ?? '';
            const last  = res.lastName  ?? '';
            this.currentUserName = (`${first} ${last}`).trim() || res.userName || res.sub || 'User';
          },
          error: () => {
            this.currentUserName = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? payload.sub ?? 'User';
          }
        });
      }
    } catch {}
  }

  loadDropdownData(): void {
    this.httpService.getData(BASE_URL, '/batches').subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.batches = raw.map(b => ({ id: b.id, name: b.name || b.batchName || b.id }));
        this.refreshNames();
      },
      error: () => {}
    });
    this.httpService.getData(BASE_URL, '/courses').subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.courses = raw.map(c => ({ id: c.id, title: c.title || c.name || c.id }));
      },
      error: () => {}
    });
    this.httpService.getData(BASE_URL, '/users').subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.teachers = raw
          .filter(u => (u.roleDto?.name ?? '').toLowerCase() === 'teacher')
          .map(u => ({
            id: u.id,
            name: (`${u.firstName ?? ''} ${u.lastName ?? ''}`).trim() || u.username || u.id
          }));
        this.refreshNames();
      },
      error: () => {}
    });
  }

  /** After batches/teachers load, patch names on already-loaded sessions */
  private refreshNames(): void {
    this.liveClasses = this.liveClasses.map(cls => ({
      ...cls,
      batch: this.batches.find(b => b.id === cls.batchId)?.name || cls.batch,
      teacher: this.teachers.find(t => t.id === cls.teacherId)?.name || cls.teacher
    }));
  }

  loadSessions(): void {
    this.isLoading = true;
    this.liveSessionService.getAll().subscribe({
      next: (dtos) => {
        this.liveClasses = (Array.isArray(dtos) ? dtos : []).map(d => this.mapDto(d));
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load sessions.');
        this.isLoading = false;
      }
    });
  }

  joinLive(cls: LiveClass): void {
    this.joiningId = cls.id;
    this.liveSessionService.getJoinUrl(cls.id, this.currentUserName, this.currentUserRole).subscribe({
      next: ({ joinUrl }) => {
        window.open(joinUrl, '_blank');
        this.joiningId = '';
      },
      error: () => {
        if (cls.meetingLink) window.open(cls.meetingLink, '_blank');
        this.commonService.error('Could not fetch join URL. Opening meeting link directly.');
        this.joiningId = '';
      }
    });
  }


  // ─── Filters ────────────────────────────────────────────────

  get filteredClasses(): LiveClass[] {
    const q = this.searchQuery.toLowerCase();
    return this.liveClasses.filter(lc => {
      const matchSearch = !q ||
        lc.title.toLowerCase().includes(q) ||
        lc.subject.toLowerCase().includes(q) ||
        lc.topic.toLowerCase().includes(q) ||
        lc.teacher.toLowerCase().includes(q) ||
        lc.batch.toLowerCase().includes(q);
      const matchStatus = !this.statusFilter || lc.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  get liveCount(): number { return this.liveClasses.filter(c => c.status === 'live').length; }
  get upcomingCount(): number { return this.liveClasses.filter(c => c.status === 'upcoming').length; }

  // ─── Modal ──────────────────────────────────────────────────

  openScheduleModal(): void {
    this.modalMode = 'create';
    this.selectedClass = null;
    this.resetForm();
  }

  openEditModal(cls: LiveClass): void {
    this.modalMode = 'edit';
    this.selectedClass = cls;
    this.formTitle = cls.title;
    this.formBatchId = cls.batchId;
    this.formCourseId = cls.courseId;
    this.formTeacherId = cls.teacherId;
    this.formDate = cls.date;
    this.formStartTime = this.toTime24(cls.startTime);
    this.formEndTime = this.toTime24(cls.endTime);
    this.clearErrors();
  }

  openViewModal(cls: LiveClass): void { this.modalMode = 'view'; this.selectedClass = cls; }
  openCancelModal(cls: LiveClass): void { this.modalMode = 'cancel'; this.selectedClass = cls; }
  closeModal(): void { this.modalMode = null; this.selectedClass = null; this.clearErrors(); }

  resetForm(): void {
    this.formTitle = '';
    this.formBatchId = '';
    this.formCourseId = '';
    this.formTeacherId = '';
    this.formDate = '';
    this.formStartTime = '';
    this.formEndTime = '';
    this.clearErrors();
  }

  clearErrors(): void {
    this.formTitleError = '';
    this.formBatchIdError = '';
    this.formCourseIdError = '';
    this.formTeacherIdError = '';
    this.formDateError = '';
    this.formStartTimeError = '';
    this.formEndTimeError = '';
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;
    if (!this.formTitle.trim()) { this.formTitleError = 'Title is required.'; valid = false; }
    if (!this.formBatchId.trim()) { this.formBatchIdError = 'Batch ID is required.'; valid = false; }
    if (!this.formCourseId.trim()) { this.formCourseIdError = 'Course ID is required.'; valid = false; }
    if (!this.formTeacherId.trim()) { this.formTeacherIdError = 'Teacher ID is required.'; valid = false; }
    if (!this.formDate) { this.formDateError = 'Date is required.'; valid = false; }
    if (!this.formStartTime) { this.formStartTimeError = 'Start time is required.'; valid = false; }
    if (!this.formEndTime) { this.formEndTimeError = 'End time is required.'; valid = false; }
    return valid;
  }

  submitForm(): void {
    if (!this.validateForm()) return;

    if (this.modalMode === 'create') {
      const dto = {
        batchId: this.formBatchId.trim(),
        courseId: this.formCourseId.trim(),
        teacherId: this.formTeacherId.trim(),
        title: this.formTitle.trim(),
        startTime: this.buildIso(this.formDate, this.formStartTime),
        endTime: this.buildIso(this.formDate, this.formEndTime)
      };
      this.liveSessionService.create(dto).subscribe({
        next: (res) => {
          this.liveClasses.unshift(this.mapDto(res));
          this.commonService.success(`Session "${res.title}" scheduled.`);
          this.closeModal();
        },
        error: () => this.commonService.error('Failed to schedule session.')
      });
    } else if (this.modalMode === 'edit' && this.selectedClass) {
      // Local update only — no generic PUT endpoint in the API
      const titleParts = this.formTitle.trim().split(' – ');
      const idx = this.liveClasses.findIndex(c => c.id === this.selectedClass!.id);
      if (idx > -1) {
        this.liveClasses[idx] = {
          ...this.liveClasses[idx],
          title: this.formTitle.trim(),
          subject: titleParts[0] ?? this.formTitle,
          topic: titleParts.slice(1).join(' – ') || titleParts[0],
          batchId: this.formBatchId.trim(),
          courseId: this.formCourseId.trim(),
          teacherId: this.formTeacherId.trim(),
          date: this.formDate,
          startTime: this.toTime12(this.formStartTime),
          endTime: this.toTime12(this.formEndTime)
        };
      }
      this.commonService.success('Session updated.');
      this.closeModal();
    }
  }

  confirmCancel(): void {
    if (!this.selectedClass) return;
    this.liveSessionService.updateStatus(this.selectedClass.id, 4).subscribe({
      next: () => {
        const idx = this.liveClasses.findIndex(c => c.id === this.selectedClass!.id);
        if (idx > -1) this.liveClasses[idx].status = 'cancelled';
        this.commonService.warning(`Session "${this.selectedClass!.topic}" cancelled.`);
        this.closeModal();
      },
      error: () => this.commonService.error('Failed to cancel session.')
    });
  }

  // ─── Helpers ────────────────────────────────────────────────

  private mapDto(dto: LiveSessionDto): LiveClass {
    const titleParts = (dto.title ?? '').split(' – ');
    const subject = titleParts[0] ?? dto.title;
    const topic = titleParts.slice(1).join(' – ') || subject;

    const batchName =
      this.batches.find(b => b.id === dto.batchId)?.name
      ?? dto.batch?.name ?? dto.batch?.batchName
      ?? '';
    const teacherName =
      this.teachers.find(t => t.id === dto.teacherId)?.name
      ?? (dto.teacher ? (`${dto.teacher.firstName ?? ''} ${dto.teacher.lastName ?? ''}`).trim() : '')
      ?? '';

    return {
      id: dto.id,
      batchId: dto.batchId ?? '',
      courseId: dto.courseId ?? '',
      teacherId: dto.teacherId ?? '',
      title: dto.title ?? '',
      subject,
      topic,
      teacher: teacherName,
      batch: batchName,
      date: dto.startTime ? dto.startTime.substring(0, 10) : '',
      startTime: dto.startTime ? this.formatTimeFromIso(dto.startTime) : '',
      endTime: dto.endTime ? this.formatTimeFromIso(dto.endTime) : '',
      students: 0,
      status: this.mapApiStatus(dto.status),
      meetingLink: dto.meetingUrl ?? ''
    };
  }

  private mapApiStatus(s: string): 'live' | 'upcoming' | 'completed' | 'cancelled' {
    if (s === 'Started' || s === 'Ongoing') return 'live';
    if (s === 'Completed') return 'completed';
    if (s === 'Cancelled') return 'cancelled';
    return 'upcoming';
  }

  private formatTimeFromIso(iso: string): string {
    const timePart = iso.split('T')[1] ?? '00:00:00';
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const mer = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${mer}`;
  }

  private buildIso(date: string, time24: string): string {
    return `${date}T${time24}:00Z`;
  }

  private toTime24(t: string): string {
    const parts = t.split(' ');
    if (parts.length < 2) return t;
    let [h, m] = parts[0].split(':').map(Number);
    if (parts[1] === 'PM' && h !== 12) h += 12;
    if (parts[1] === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private toTime12(t: string): string {
    const [hStr, mStr] = t.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const mer = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${mer}`;
  }


  getDuration(start: string, end: string): string {
    const parse = (t: string): number => {
      const parts = t.split(' ');
      if (parts.length === 2) {
        let [h, m] = parts[0].split(':').map(Number);
        if (parts[1] === 'PM' && h !== 12) h += 12;
        if (parts[1] === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      }
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const diff = parse(end) - parse(start);
    if (diff <= 0) return '—';
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
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

import { Component, OnInit } from '@angular/core';
import { TimetableService } from '../../../services/timetable.service';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface TimetableSlot {
  id: string;
  day: string;
  session: number;
  subject: string;
  topic: string;
  teacher: string;
  batch: string;
  category: 'Foundation' | 'Standard' | 'Advanced';
  startTime: string;
  endTime: string;
  meetingId: string;
  meetingLink: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface TimetablePayload {
  day: string;
  session: number;
  subject: string;
  topic: string;
  teacher: string;
  batch: string;
  category: 'Foundation' | 'Standard' | 'Advanced';
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-timetable',
  standalone: false,
  templateUrl: './timetable.component.html',
  styleUrls: ['../../../shared-page.css', './timetable.component.css']
})
export class TimetableComponent implements OnInit {

  // ── Filters ───────────────────────────────────────────────────────────────
  batchFilter = '';
  categoryFilter = '';
  viewMode: 'grid' | 'list' = 'grid';

  // ── Loading ───────────────────────────────────────────────────────────────
  isLoading = false;
  isSaving = false;
  joiningId = '';

  // ── Form validation ───────────────────────────────────────────────────────
  formErrors: Record<string, string> = {};
  readonly Object = Object;

  // ── Dynamic reference data (from API) ─────────────────────────────────────
  apiBatches: any[]   = [];
  apiTeachers: any[]  = [];
  apiSubjects: any[]  = [];
  apiTopics: any[]    = [];
  filteredTopicsList: any[] = [];

  // ── Static reference data ─────────────────────────────────────────────────
  readonly days     = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  readonly sessions = [1, 2, 3, 4, 5, 6, 7];
  readonly categories: Array<'Foundation' | 'Standard' | 'Advanced'> = ['Foundation', 'Standard', 'Advanced'];
  readonly statuses:   Array<'scheduled' | 'live' | 'completed' | 'cancelled'> = ['scheduled', 'live', 'completed', 'cancelled'];

  readonly sessionTimes: Record<number, { start: string; end: string }> = {
    1: { start: '07:00', end: '08:30' },
    2: { start: '09:00', end: '10:30' },
    3: { start: '11:00', end: '12:30' },
    4: { start: '14:00', end: '15:30' },
    5: { start: '16:00', end: '17:30' },
    6: { start: '18:00', end: '19:30' },
    7: { start: '20:00', end: '21:30' },
  };

  // ── Slots ─────────────────────────────────────────────────────────────────
  slots: TimetableSlot[] = [];

  // ── Display helpers ───────────────────────────────────────────────────────
  getBatchName(b: any): string {
    return b?.name ?? b?.batchName ?? '';
  }

  getTeacherName(t: any): string {
    return `${t?.firstName ?? ''} ${t?.lastName ?? ''}`.trim();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  get totalSlots(): number     { return this.slots.length; }
  get liveNow(): number        { return this.slots.filter(s => s.status === 'live').length; }
  get scheduledCount(): number { return this.slots.filter(s => s.status === 'scheduled').length; }
  get activeBatches(): number  { return new Set(this.slots.map(s => s.batch)).size; }

  // ── Filtered slots ────────────────────────────────────────────────────────
  get filteredSlots(): TimetableSlot[] {
    return this.slots.filter(s => {
      const matchBatch    = !this.batchFilter    || s.batch === this.batchFilter;
      const matchCategory = !this.categoryFilter || s.category === this.categoryFilter;
      return matchBatch && matchCategory;
    });
  }

  getSlot(day: string, session: number): TimetableSlot | undefined {
    return this.filteredSlots.find(s => s.day === day && s.session === session);
  }

  getSubjectColor(subject: string): string {
    const map: Record<string, string> = {
      'Physics':       'slot-physics',
      'Chemistry':     'slot-chemistry',
      'Biology':       'slot-biology',
      'Mathematics':   'slot-math',
      'Science':       'slot-biology',
      'English':       'slot-default',
      'History':       'slot-default',
      'Computer Sci.': 'slot-zoology',
      'Economics':     'slot-zoology',
    };
    return map[subject] || 'slot-default';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      live:      'pg-badge pg-badge--red',
      scheduled: 'pg-badge pg-badge--blue',
      completed: 'pg-badge pg-badge--green',
      cancelled: 'pg-badge pg-badge--gray',
    };
    return map[status] || 'pg-badge';
  }

  getCategoryChip(category: string): string {
    const map: Record<string, string> = {
      'Foundation': 'chip-emerald',
      'Standard':   'chip-sky',
      'Advanced':   'chip-rose',
    };
    return map[category] || 'chip-indigo';
  }

  canJoin(status: string): boolean {
    return status === 'live' || status === 'scheduled';
  }

  // ── Clipboard ─────────────────────────────────────────────────────────────
  copiedId: string | null = null;

  copyLink(slot: TimetableSlot): void {
    navigator.clipboard.writeText(slot.meetingLink).then(() => {
      this.copiedId = slot.id;
      setTimeout(() => { this.copiedId = null; }, 2000);
    });
  }

  // ── Join (BBB signed URL) ─────────────────────────────────────────────────
  joinSlot(slot: TimetableSlot, isModerator = false): void {
    this.joiningId = slot.id;
    this.timetableService.getJoinUrl(slot.id, 'Admin', isModerator).subscribe({
      next: ({ joinUrl }) => {
        window.open(joinUrl, '_blank');
        this.joiningId = '';
      },
      error: () => {
        if (slot.meetingLink) window.open(slot.meetingLink, '_blank');
        this.joiningId = '';
      }
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalMode: ModalMode = null;
  selectedSlot: TimetableSlot | null = null;

  form: TimetablePayload = this.emptyForm();

  emptyForm(): TimetablePayload {
    return {
      day: '', session: 1, subject: '', topic: '', teacher: '',
      batch: '', category: 'Foundation',
      startTime: '07:00', endTime: '08:30',
      status: 'scheduled'
    };
  }

  openCreate(day?: string, session?: number): void {
    this.form = this.emptyForm();
    this.filteredTopicsList = [];
    if (day)     this.form.day = day;
    if (session) {
      this.form.session = session;
      const st = this.sessionTimes[session];
      if (st) { this.form.startTime = st.start; this.form.endTime = st.end; }
    }
    if (this.batchFilter)    this.form.batch    = this.batchFilter;
    if (this.categoryFilter) this.form.category = this.categoryFilter as any;
    this.modalMode = 'create';
  }

  openEdit(slot: TimetableSlot): void {
    this.selectedSlot = slot;
    this.form = {
      day: slot.day, session: slot.session, subject: slot.subject,
      topic: slot.topic, teacher: slot.teacher, batch: slot.batch,
      category: slot.category, startTime: slot.startTime, endTime: slot.endTime,
      status: slot.status
    };
    // Pre-populate filtered topics for the slot's subject
    const subj = this.apiSubjects.find(s => s.name === slot.subject);
    this.filteredTopicsList = subj
      ? this.apiTopics.filter(t => t.subjectId === subj.id)
      : this.apiTopics;
    this.modalMode = 'edit';
  }

  openView(slot: TimetableSlot): void   { this.selectedSlot = slot; this.modalMode = 'view'; }
  openDelete(slot: TimetableSlot): void { this.selectedSlot = slot; this.modalMode = 'delete'; }

  closeModal(): void { this.modalMode = null; this.selectedSlot = null; this.formErrors = {}; }

  onSessionChange(): void {
    const st = this.sessionTimes[this.form.session];
    if (st) { this.form.startTime = st.start; this.form.endTime = st.end; }
  }

  onCategoryChange(): void {
    this.form.subject = '';
    this.form.topic   = '';
    this.filteredTopicsList = [];
  }

  onSubjectChange(): void {
    this.form.topic = '';
    const subj = this.apiSubjects.find(s => s.name === this.form.subject);
    this.filteredTopicsList = subj
      ? this.apiTopics.filter(t => t.subjectId === subj.id)
      : this.apiTopics;
  }

  // ── Save (API) ────────────────────────────────────────────────────────────
  saveSlot(): void {
    this.formErrors = {};
    if (!this.form.day)     this.formErrors['day']     = 'Day is required.';
    if (!this.form.batch)   this.formErrors['batch']   = 'Batch is required.';
    if (!this.form.subject) this.formErrors['subject'] = 'Subject is required.';
    if (!this.form.teacher) this.formErrors['teacher'] = 'Teacher is required.';
    if (Object.keys(this.formErrors).length > 0) return;

    const conflict = this.slots.find(s =>
      s.day === this.form.day &&
      s.session === this.form.session &&
      s.batch === this.form.batch &&
      (this.modalMode === 'create' || s.id !== this.selectedSlot?.id)
    );
    if (conflict) {
      this.formErrors['conflict'] = `${this.form.batch} already has Session ${this.form.session} on ${this.form.day}.`;
      return;
    }

    this.isSaving = true;

    if (this.modalMode === 'create') {
      this.timetableService.createSlot(this.form).subscribe({
        next: (result) => {
          this.slots.push({
            id: result.id, day: result.day, session: result.session,
            subject: result.subject, topic: result.topic, teacher: result.teacher,
            batch: result.batch, category: result.category as any,
            startTime: result.startTime, endTime: result.endTime,
            status: result.status as any, meetingId: result.meetingId,
            meetingLink: result.meetingLink,
          });
          this.isSaving = false;
          this.closeModal();
        },
        error: (err) => {
          this.isSaving = false;
          alert('Failed to create session: ' + (err.error?.message ?? 'Unknown error'));
        }
      });

    } else if (this.modalMode === 'edit' && this.selectedSlot) {
      this.timetableService.updateSlot(this.selectedSlot.id, this.form).subscribe({
        next: (result) => {
          const idx = this.slots.findIndex(s => s.id === this.selectedSlot!.id);
          if (idx > -1) {
            this.slots[idx] = {
              ...this.slots[idx],
              day: result.day, session: result.session, subject: result.subject,
              topic: result.topic, teacher: result.teacher, batch: result.batch,
              category: result.category as any, startTime: result.startTime,
              endTime: result.endTime, status: result.status as any,
              meetingId: result.meetingId, meetingLink: result.meetingLink,
            };
          }
          this.isSaving = false;
          this.closeModal();
        },
        error: (err) => {
          this.isSaving = false;
          alert('Failed to update session: ' + (err.error?.message ?? 'Unknown error'));
        }
      });
    }
  }

  confirmDelete(): void {
    if (this.selectedSlot) {
      this.slots = this.slots.filter(s => s.id !== this.selectedSlot!.id);
    }
    this.closeModal();
  }

  formatSessionTime(session: number): string {
    const st = this.sessionTimes[session];
    return st ? `${st.start} – ${st.end}` : '';
  }

  // ── API loaders ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadBatches();
    this.loadTeachers();
    this.loadSubjects();
    this.loadTopics();
  }

  private loadBatches(): void {
    this.httpService.getData(BASE_URL, '/batches').subscribe({
      next: (res: any) => {
        this.apiBatches = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => this.commonService.error('Failed to load batches.')
    });
  }

  private loadTeachers(): void {
    this.httpService.getData(BASE_URL, '/role').subscribe({
      next: (rolesRes: any) => {
        const roles: any[] = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data ?? []);
        const teacherRole = roles.find((r: any) => r.name === 'Teacher');
        this.httpService.getData(BASE_URL, '/users').subscribe({
          next: (res: any) => {
            const users: any[] = Array.isArray(res) ? res : (res?.data ?? []);
            this.apiTeachers = users.filter(u => u.roleDto?.id === teacherRole?.id);
          },
          error: () => {}
        });
      },
      error: () => {
        this.httpService.getData(BASE_URL, '/users').subscribe({
          next: (res: any) => {
            const users: any[] = Array.isArray(res) ? res : (res?.data ?? []);
            this.apiTeachers = users.filter(u =>
              (u.roleDto?.name ?? u.role?.name ?? u.userType ?? '').toLowerCase() === 'teacher'
            );
          },
          error: () => {}
        });
      }
    });
  }

  private loadSubjects(): void {
    this.httpService.getData(BASE_URL, '/subject').subscribe({
      next: (res: any) => {
        this.apiSubjects = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => this.commonService.error('Failed to load subjects.')
    });
  }

  private loadTopics(): void {
    this.httpService.getData(BASE_URL, '/topic').subscribe({
      next: (res: any) => {
        this.apiTopics = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {}
    });
  }

  constructor(
    private timetableService: TimetableService,
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>
  ) {}
}

import { Component, OnInit } from '@angular/core';
import { TimetableService } from '../../../services/timetable.service';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

// ── DayOfWeek enum (matches C# DayOfWeek) ────────────────────────────────────
export enum DayOfWeek {
  Sunday    = 0,
  Monday    = 1,
  Tuesday   = 2,
  Wednesday = 3,
  Thursday  = 4,
  Friday    = 5,
  Saturday  = 6
}

// ── Slot shape returned from / stored in the app ──────────────────────────────
export interface TimetableSlot {
  id: string;
  day: DayOfWeek;    // integer internally
  session: number;   // number internally
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

/**
 * Payload sent to the API (POST / PUT).
 *
 * C# DTO:
 *   public DayOfWeek Day     { get; set; }  → sent as integer (0–6)
 *   public string    Session { get; set; }  → sent as string ("1"–"7")
 */
export interface TimetablePayload {
  day: DayOfWeek;   // integer  → C# DayOfWeek
  session: string;  // string   → C# string Session
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

  // ── Expose enum to template ───────────────────────────────────────────────
  readonly DayOfWeek = DayOfWeek;

  // ── Filters ───────────────────────────────────────────────────────────────
  batchFilter    = '';
  categoryFilter = '';
  viewMode: 'grid' | 'list' = 'grid';

  // ── Loading ───────────────────────────────────────────────────────────────
  isLoading = false;
  isSaving  = false;
  joiningId = '';

  // ── Form validation ───────────────────────────────────────────────────────
  formErrors: Record<string, string> = {};
  readonly Object = Object;

  // ── Dynamic reference data ────────────────────────────────────────────────
  apiBatches: any[]         = [];
  apiTeachers: any[]        = [];
  apiSubjects: any[]        = [];
  apiTopics: any[]          = [];
  filteredTopicsList: any[] = [];

  // ── Static reference data ─────────────────────────────────────────────────
  readonly days: { label: string; value: DayOfWeek }[] = [
    { label: 'Monday',    value: DayOfWeek.Monday    },
    { label: 'Tuesday',   value: DayOfWeek.Tuesday   },
    { label: 'Wednesday', value: DayOfWeek.Wednesday },
    { label: 'Thursday',  value: DayOfWeek.Thursday  },
    { label: 'Friday',    value: DayOfWeek.Friday    },
    { label: 'Saturday',  value: DayOfWeek.Saturday  },
  ];

  readonly sessions  = [1, 2, 3, 4, 5, 6, 7];
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

  // ── Session number (number) kept separately for grid / sessionTimes ───────
  // The form.session is always a string ("1"…"7") to match the C# DTO.
  // sessionNum is the numeric version used internally.
  sessionNum = 1;

  // ── Display helpers ───────────────────────────────────────────────────────
  getBatchName(b: any): string {
    return b?.name ?? b?.batchName ?? '';
  }

  getTeacherName(t: any): string {
    return `${t?.firstName ?? ''} ${t?.lastName ?? ''}`.trim();
  }

  getDayLabel(day: DayOfWeek): string {
    return this.days.find(d => d.value === day)?.label ?? String(day);
  }

  // Arrow-function field required for [compareWith] binding
  compareDayOfWeek = (a: DayOfWeek, b: DayOfWeek): boolean =>
    Number(a) === Number(b);

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

  getSlot(day: DayOfWeek, session: number): TimetableSlot | undefined {
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

  // ── Join ──────────────────────────────────────────────────────────────────
  joinSlot(slot: TimetableSlot, isModerator = false): void {
    this.joiningId = slot.id;
    this.timetableService.getJoinUrl(slot.id, 'Admin', isModerator).subscribe({
      next: ({ joinUrl }) => { window.open(joinUrl, '_blank'); this.joiningId = ''; },
      error: () => { if (slot.meetingLink) window.open(slot.meetingLink, '_blank'); this.joiningId = ''; }
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalMode: ModalMode = null;
  selectedSlot: TimetableSlot | null = null;
  form: TimetablePayload = this.emptyForm();

  emptyForm(): TimetablePayload {
    return {
      day:       DayOfWeek.Monday,
      session:   '1',           // ← string to match C# DTO
      subject:   '',
      topic:     '',
      teacher:   '',
      batch:     '',
      category:  'Foundation',
      startTime: '07:00',
      endTime:   '08:30',
      status:    'scheduled'
    };
  }

  openCreate(day?: DayOfWeek, session?: number): void {
    this.form       = this.emptyForm();
    this.sessionNum = 1;
    this.filteredTopicsList = [];
    this.formErrors = {};

    if (day !== undefined) this.form.day = day;
    if (session !== undefined) {
      this.sessionNum   = session;
      this.form.session = String(session);
      const st = this.sessionTimes[session];
      if (st) { this.form.startTime = st.start; this.form.endTime = st.end; }
    }
    if (this.batchFilter)    this.form.batch    = this.batchFilter;
    if (this.categoryFilter) this.form.category = this.categoryFilter as any;

    this.modalMode = 'create';
  }

  openEdit(slot: TimetableSlot): void {
    this.selectedSlot = slot;
    this.sessionNum   = slot.session;
    this.formErrors   = {};
    this.form = {
      day:       slot.day,
      session:   String(slot.session),  // number → string for DTO
      subject:   slot.subject,
      topic:     slot.topic,
      teacher:   slot.teacher,
      batch:     slot.batch,
      category:  slot.category,
      startTime: slot.startTime,
      endTime:   slot.endTime,
      status:    slot.status
    };
    const subj = this.apiSubjects.find(s => s.name === slot.subject);
    this.filteredTopicsList = subj
      ? this.apiTopics.filter(t => t.subjectId === subj.id)
      : this.apiTopics;
    this.modalMode = 'edit';
  }

  openView(slot: TimetableSlot): void   { this.selectedSlot = slot; this.modalMode = 'view'; }
  openDelete(slot: TimetableSlot): void { this.selectedSlot = slot; this.modalMode = 'delete'; }

  closeModal(): void {
    this.modalMode    = null;
    this.selectedSlot = null;
    this.formErrors   = {};
  }

  /** Session <select> binds to sessionNum; keep form.session (string) in sync */
  onSessionChange(): void {
    this.form.session = String(this.sessionNum);
    const st = this.sessionTimes[this.sessionNum];
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

  // ── Save ──────────────────────────────────────────────────────────────────
  saveSlot(): void {
    this.formErrors = {};
    if (this.form.day === undefined || this.form.day === null)
                            this.formErrors['day']     = 'Day is required.';
    if (!this.form.batch)   this.formErrors['batch']   = 'Batch is required.';
    if (!this.form.subject) this.formErrors['subject'] = 'Subject is required.';
    if (!this.form.teacher) this.formErrors['teacher'] = 'Teacher is required.';
    if (Object.keys(this.formErrors).length > 0) return;

    // Conflict check uses sessionNum (number) to compare against stored slots
    const conflict = this.slots.find(s =>
      s.day     === this.form.day &&
      s.session === this.sessionNum &&
      s.batch   === this.form.batch &&
      (this.modalMode === 'create' || s.id !== this.selectedSlot?.id)
    );
    if (conflict) {
      this.formErrors['conflict'] =
        `${this.form.batch} already has Session ${this.sessionNum} on ${this.getDayLabel(this.form.day)}.`;
      return;
    }

    this.isSaving = true;

    /**
     * Cast to `any` because the service's TimetablePayload still declares
     * day: string and session: number (old types). Our local TimetablePayload
     * is correct. Update timetable.service.ts to remove this cast:
     *   day: number  (or DayOfWeek)
     *   session: string
     */
    if (this.modalMode === 'create') {
      this.timetableService.createSlot(this.form as any).subscribe({
        next: (result: any) => {
          this.slots.push({
            id:          result.id,
            day:         Number(result.day) as DayOfWeek,
            session:     Number(result.session),
            subject:     result.subject,
            topic:       result.topic,
            teacher:     result.teacher,
            batch:       result.batch,
            category:    result.category,
            startTime:   result.startTime,
            endTime:     result.endTime,
            status:      result.status,
            meetingId:   result.meetingId,
            meetingLink: result.meetingLink,
          });
          this.isSaving = false;
          this.closeModal();
        },
        error: (err: any) => {
          this.isSaving = false;
          alert('Failed to create session: ' + (err.error?.message ?? 'Unknown error'));
        }
      });

    } else if (this.modalMode === 'edit' && this.selectedSlot) {
      this.timetableService.updateSlot(this.selectedSlot.id, this.form as any).subscribe({
        next: (result: any) => {
          const idx = this.slots.findIndex(s => s.id === this.selectedSlot!.id);
          if (idx > -1) {
            this.slots[idx] = {
              ...this.slots[idx],
              day:         Number(result.day) as DayOfWeek,
              session:     Number(result.session),
              subject:     result.subject,
              topic:       result.topic,
              teacher:     result.teacher,
              batch:       result.batch,
              category:    result.category,
              startTime:   result.startTime,
              endTime:     result.endTime,
              status:      result.status,
              meetingId:   result.meetingId,
              meetingLink: result.meetingLink,
            };
          }
          this.isSaving = false;
          this.closeModal();
        },
        error: (err: any) => {
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
    this.loadSlots();
    this.loadBatches();
    this.loadTeachers();
    this.loadSubjects();
    this.loadTopics();
  }

  private loadSlots(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/timetable').subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.slots = raw.map(r => ({
          ...r,
          day:     Number(r.day) as DayOfWeek,
          session: Number(r.session),
        }));
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load timetable.');
        this.isLoading = false;
      }
    });
  }

  private loadBatches(): void {
    this.httpService.getData(BASE_URL, '/batches').subscribe({
      next: (res: any) => { this.apiBatches = Array.isArray(res) ? res : (res?.data ?? []); },
      error: () => this.commonService.error('Failed to load batches.')
    });
  }

  private loadTeachers(): void {
    this.httpService.getData(BASE_URL, '/role').subscribe({
      next: (rolesRes: any) => {
        const roles: any[] = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data ?? []);
        const teacherRole  = roles.find((r: any) => r.name === 'Teacher');
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
      next: (res: any) => { this.apiSubjects = Array.isArray(res) ? res : (res?.data ?? []); },
      error: () => this.commonService.error('Failed to load subjects.')
    });
  }

  private loadTopics(): void {
    this.httpService.getData(BASE_URL, '/topic').subscribe({
      next: (res: any) => { this.apiTopics = Array.isArray(res) ? res : (res?.data ?? []); },
      error: () => {}
    });
  }

  constructor(
    private timetableService: TimetableService,
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>
  ) {}
}

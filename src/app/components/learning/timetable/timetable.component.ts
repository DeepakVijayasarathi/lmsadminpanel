import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TimetableService, SessionAnalytic } from '../../../services/timetable.service';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface TimetableSlot {
  id:           string;
  day:          string;
  session:      number;
  subject:      string;
  topic:        string;
  teacher:      string;
  batch:        string;
  category:     'Foundation' | 'Standard' | 'Advanced';
  startTime:    string;
  endTime:      string;
  meetingId:    string;
  meetingLink:  string;
  recordingUrl: string;
  playbackUrl:  string;
  mp4Url:       string;
  status:       'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface TimetablePayload {
  batchId:   string | null;
  teacherId: string | null;
  courseId:  string | null;
  sessionId: string | null;
  day: string;
  session: number;
  subject: string;
  topic: string;
  teacher: string;
  batch: string;
  category: 'Foundation' | 'Standard' | 'Advanced';
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-timetable',
  standalone: false,
  templateUrl: './timetable.component.html',
  styleUrls: ['../../../shared-page.css', './timetable.component.css']
})
export class TimetableComponent implements OnInit, OnDestroy {

  // ── Filters ───────────────────────────────────────────────────────────────
  batchFilter = '';
  categoryFilter = '';
  viewMode: 'grid' | 'list' = 'grid';

  // ── Loading ───────────────────────────────────────────────────────────────
  isLoading = false;
  isSaving = false;
  joiningId    = '';
  startingId   = '';   // slot ID being started  → live
  endingId     = '';   // slot ID being ended    → completed
  recordingId      = '';
  recordingPolling: Record<string, boolean> = {};
  recordingError:   Record<string, string>  = {};
  private pollingIntervals: Record<string, ReturnType<typeof setInterval>> = {};

  // ── Analytics ─────────────────────────────────────────────────────────────
  analytics:        SessionAnalytic[] = [];
  analyticsLoading  = false;

  secsToMin(s: number): string {
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m` : `${s}s`;
  }

  scoreClass(score: number): string {
    if (score >= 75) return 'pg-badge pg-badge--green';
    if (score >= 40) return 'pg-badge pg-badge--blue';
    return 'pg-badge pg-badge--gray';
  }

  // ── Form validation ───────────────────────────────────────────────────────
  formErrors: Record<string, string> = {};
  readonly Object = Object;

  getFormErrorMessages(): string[] {
    return Object.values(this.formErrors).filter(v => !!v);
  }

  // ── Dynamic reference data (from API) ─────────────────────────────────────
  apiBatches: any[]      = [];
  apiTeachers: any[]     = [];
  apiSubjects: any[]     = [];
  apiTopics: any[]       = [];
  apiCourses: any[]      = [];
  apiSessionSlots: any[] = [];
  filteredTopicsList: any[] = [];

  // ── Static reference data ─────────────────────────────────────────────────
  readonly days       = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  readonly categories: Array<'Foundation' | 'Standard' | 'Advanced'> = ['Foundation', 'Standard', 'Advanced'];
  readonly statuses:   Array<'scheduled' | 'live' | 'completed' | 'cancelled'> = ['scheduled', 'live', 'completed', 'cancelled'];

  // ── Session slots (dynamic from API) ────────────────────────────────────
  get sessions(): number[] {
    return this.apiSessionSlots
      .filter(s => s.isActive !== false)
      .map(s => s.slotNumber)
      .sort((a, b) => a - b);
  }

  getSessionSlot(slotNumber: number): any {
    return this.apiSessionSlots.find(s => s.slotNumber === slotNumber);
  }

  trimTime(t: string): string {
    // "18:42:00" → "18:42"
    return t ? t.substring(0, 5) : '';
  }

  toAmPm(t: string): string {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }

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

  // ── Start / End session ───────────────────────────────────────────────────
  startSession(slot: TimetableSlot): void {
    this.startingId = slot.id;
    this.timetableService.start(slot.id).subscribe({
      next: () => { this.startingId = ''; this.loadSlots(); },
      error: () => { this.startingId = ''; }
    });
  }

  endSession(slot: TimetableSlot): void {
    this.endingId = slot.id;
    this.timetableService.end(slot.id).subscribe({
      next: () => {
        this.endingId = '';
        this.loadSlots();
        // Auto-start recording poll after session ends
        this.triggerRecording(slot);
      },
      error: () => { this.endingId = ''; }
    });
  }

  // ── Recording ─────────────────────────────────────────────────────────────
  // Flow: poll GET /recording-ready every 30s → when ready → POST /recording → show player
  triggerRecording(slot: TimetableSlot): void {
    if (this.pollingIntervals[slot.id]) return; // already polling
    this.recordingId    = slot.id;
    this.recordingError[slot.id] = '';
    this.recordingPolling[slot.id] = true;
    // Check once immediately, then every 30s
    this.checkReadyAndFetch(slot);
    this.pollingIntervals[slot.id] = setInterval(() => this.checkReadyAndFetch(slot), 30000);
  }

  private checkReadyAndFetch(slot: TimetableSlot): void {
    this.timetableService.checkRecordingReady(slot.id).subscribe({
      next: (res) => {
        if (res.isReady) {
          this.stopPolling(slot.id);
          this.timetableService.triggerRecording(slot.id).subscribe({
            next: (rec) => {
              this.recordingId = '';
              this.applyRecordingUrls(slot.id, rec.playbackUrl, rec.mp4Url);
            },
            error: (err) => {
              this.recordingId = '';
              this.recordingError[slot.id] = err?.error?.message ?? 'Failed to fetch recording.';
            }
          });
        }
        // isReady: false → keep polling
      },
      error: () => {
        this.stopPolling(slot.id);
        this.recordingId = '';
        this.recordingError[slot.id] = 'Failed to check recording status.';
      }
    });
  }

  private stopPolling(id: string): void {
    clearInterval(this.pollingIntervals[id]);
    delete this.pollingIntervals[id];
    delete this.recordingPolling[id];
  }

  private applyRecordingUrls(id: string, playbackUrl: string | null, mp4Url: string | null): void {
    const found = this.slots.find(s => s.id === id);
    if (found) {
      found.playbackUrl = playbackUrl ?? '';
      found.mp4Url      = mp4Url      ?? '';
      found.recordingUrl = playbackUrl ?? mp4Url ?? '';
    }
  }

  // ── Recording helpers ─────────────────────────────────────────────────────
  isVideo(url: string): boolean {
    return !!(url?.includes('.mp4') || url?.includes('video'));
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalMode: ModalMode = null;
  selectedSlot: TimetableSlot | null = null;

  form: TimetablePayload = this.emptyForm();

  emptyForm(): TimetablePayload {
    return {
      batchId: null, teacherId: null, courseId: null, sessionId: null,
      day: '', session: 1, subject: '', topic: '', teacher: '',
      batch: '', category: 'Foundation',
      status: 'scheduled'
    };
  }

  openCreate(day?: string, session?: number): void {
    this.form = this.emptyForm();
    this.filteredTopicsList = [];
    if (day) this.form.day = day;
    if (session) this.form.session = session;
    // Always resolve sessionId from the current session number
    const sl = this.getSessionSlot(this.form.session);
    if (sl) this.form.sessionId = sl.id;
    if (this.batchFilter)    this.form.batch    = this.batchFilter;
    if (this.categoryFilter) this.form.category = this.categoryFilter as any;
    this.modalMode = 'create';
  }

  openEdit(slot: TimetableSlot): void {
    this.selectedSlot = slot;
    const b = this.apiBatches.find(x => this.getBatchName(x) === slot.batch);
    const t = this.apiTeachers.find(x => this.getTeacherName(x) === slot.teacher);
    // Resolve courseId from batch object (same as onBatchChange)
    const courseId =
      b?.courseId ?? b?.course?.id ?? b?.courseDto?.id ??
      (slot as any).courseId ?? null;
    // Resolve sessionId from apiSessionSlots by slot number
    const sessionSlot = this.getSessionSlot(slot.session);
    const sessionId = sessionSlot?.id ?? (slot as any).sessionId ?? null;
    // Resolve teacherId from batch or teacher list
    const teacherId =
      b?.teacherId ?? b?.teacher?.id ?? b?.teacherDto?.id ?? b?.assignedTeacherId ??
      t?.id ?? null;
    this.form = {
      batchId:   b?.id   ?? null,
      teacherId,
      courseId,
      sessionId,
      day: slot.day, session: slot.session, subject: slot.subject,
      topic: slot.topic, teacher: slot.teacher, batch: slot.batch,
      category: slot.category, status: slot.status
    };
    // Pre-populate filtered topics for the slot's subject
    const subj = this.apiSubjects.find(s => s.name === slot.subject);
    this.filteredTopicsList = subj
      ? this.apiTopics.filter(t => t.subjectId === subj.id)
      : this.apiTopics;
    this.modalMode = 'edit';
  }

  openView(slot: TimetableSlot): void {
    this.selectedSlot = slot;
    this.analytics = [];
    this.modalMode = 'view';
    if (slot.status === 'completed') {
      this.analyticsLoading = true;
      this.timetableService.getAnalytics(slot.id).subscribe({
        next: (res) => { this.analytics = res ?? []; this.analyticsLoading = false; },
        error: ()    => { this.analyticsLoading = false; }
      });
    }
  }
  openDelete(slot: TimetableSlot): void { this.selectedSlot = slot; this.modalMode = 'delete'; }

  closeModal(): void { this.modalMode = null; this.selectedSlot = null; this.formErrors = {}; }

  onSessionChange(): void {
    const sl = this.getSessionSlot(this.form.session);
    if (sl) { this.form.sessionId = sl.id; }
  }

  onBatchChange(): void {
    const b = this.apiBatches.find(x => this.getBatchName(x) === this.form.batch);
    if (!b) return;

    // ── batchId ────────────────────────────────────────────────
    this.form.batchId = b.id ?? null;

    // ── courseId — try multiple field names ────────────────────
    this.form.courseId =
      b.courseId ??
      b.course?.id ??
      b.courseDto?.id ??
      null;

    // ── teacherId + teacher name ───────────────────────────────
    const teacherId: string | null =
      b.teacherId ??
      b.teacher?.id ??
      b.teacherDto?.id ??
      b.assignedTeacherId ??
      null;

    if (teacherId) {
      this.form.teacherId = teacherId;

      // 1. Try to resolve name from inline dto on the batch object
      const inlineDto = b.teacherDto ?? b.teacher ?? b.assignedTeacher;
      if (inlineDto && (inlineDto.firstName || inlineDto.lastName)) {
        this.form.teacher = this.getTeacherName(inlineDto);
      } else {
        // 2. Fall back to apiTeachers list
        const t = this.apiTeachers.find(x => x.id === teacherId);
        if (t) this.form.teacher = this.getTeacherName(t);
      }
    }
  }

  onTeacherChange(): void {
    const t = this.apiTeachers.find(x => this.getTeacherName(x) === this.form.teacher);
    this.form.teacherId = t?.id ?? null;
  }

  getCourseName(c: any): string {
    return c?.title ?? c?.name ?? c?.courseName ?? '';
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
        next: () => {
          this.isSaving = false;
          this.closeModal();
          this.loadSlots();
        },
        error: () => {
          this.isSaving = false;
        }
      });

    } else if (this.modalMode === 'edit' && this.selectedSlot) {
      this.timetableService.updateSlot(this.selectedSlot.id, this.form).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeModal();
          this.loadSlots();
        },
        error: () => {
          this.isSaving = false;
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
    const sl = this.getSessionSlot(session);
    return sl ? `${this.toAmPm(sl.startTime)} – ${this.toAmPm(sl.endTime)}` : '';
  }

  getSessionLabel(slotNumber: number): string {
    const sl = this.getSessionSlot(slotNumber);
    return sl?.name ?? `Session ${slotNumber}`;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnDestroy(): void {
    Object.keys(this.pollingIntervals).forEach(id => clearInterval(this.pollingIntervals[id]));
  }

  // ── API loaders ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadSlots();
    this.loadSessionSlots();
    this.loadBatches();
    this.loadTeachers();
    this.loadSubjects();
    this.loadTopics();
    this.loadCourses();
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

  private loadCourses(): void {
    this.httpService.getData(BASE_URL, '/courses').subscribe({
      next: (res: any) => {
        this.apiCourses = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {}
    });
  }

  private loadSlots(): void {
    this.isLoading = true;
    this.timetableService.getAll().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        this.slots = list.map((r: any) => {
          const tt = r.timetable ?? r;
          return {
            id:          r.id,
            day:         tt.day,
            session:     Number(tt.session),
            subject:     tt.subject,
            topic:       tt.topic,
            teacher:     tt.teacher,
            batch:       tt.batch,
            category:    tt.category,
            startTime:   tt.startTime   ?? '',
            endTime:     tt.endTime     ?? '',
            status:      (tt.status ?? r.status ?? 'scheduled').toLowerCase(),
            meetingId:    tt.meetingId    ?? r.id,
            meetingLink:  tt.meetingLink  ?? r.meetingUrl ?? '',
            recordingUrl: tt.recordingUrl ?? tt.playbackUrl ?? r.recordingUrl ?? '',
            playbackUrl:  tt.playbackUrl  ?? r.playbackUrl ?? '',
            mp4Url:       tt.mp4Url       ?? r.mp4Url      ?? '',
            courseId:     r.courseId      ?? null,
            sessionId:    r.sessionId     ?? null,
          };
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.commonService.error('Failed to load timetable.');
      }
    });
  }

  private loadSessionSlots(): void {
    this.httpService.getData(BASE_URL, '/sessionslot').subscribe({
      next: (res: any) => {
        this.apiSessionSlots = Array.isArray(res) ? res : (res?.data ?? []);
        // Set default session from first slot
        if (this.apiSessionSlots.length > 0) {
          const first = this.apiSessionSlots.find(s => s.slotNumber === 1) ?? this.apiSessionSlots[0];
          this.form.session   = first.slotNumber;
          this.form.sessionId = first.id;
        }
      },
      error: () => {}
    });
  }

  constructor(
    private timetableService: TimetableService,
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private sanitizer: DomSanitizer
  ) {}
}

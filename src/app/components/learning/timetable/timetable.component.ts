import { Component } from '@angular/core';

const BBB_SERVER = 'https://bbb.edulanz.com';

export interface TimetableSlot {
  id: number;
  day: string;
  session: number;
  subject: string;
  topic: string;
  teacher: string;
  batch: string;
  examType: 'NEET' | 'JEE Main' | 'JEE Advanced';
  startTime: string;
  endTime: string;
  meetingId: string;      // auto-generated BBB room ID
  meetingLink: string;    // auto-generated BBB join URL
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface TimetablePayload {
  day: string;
  session: number;
  subject: string;
  topic: string;
  teacher: string;
  batch: string;
  examType: 'NEET' | 'JEE Main' | 'JEE Advanced';
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
export class TimetableComponent {

  // ── Filters ───────────────────────────────────────────────────────────────
  batchFilter = '';
  examFilter = '';
  viewMode: 'grid' | 'list' = 'grid';

  // ── Reference data ────────────────────────────────────────────────────────
  readonly days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  readonly sessions = [1, 2, 3, 4, 5, 6, 7];

  readonly batches = [
    'NEET 2025 – Batch A',
    'NEET 2025 – Batch B',
    'NEET 2026 – Batch A',
    'JEE Main 2025 – Batch A',
    'JEE Main 2025 – Batch B',
    'JEE Advanced 2025',
    'JEE Main 2026 – Batch A',
  ];

  readonly examTypes: Array<'NEET' | 'JEE Main' | 'JEE Advanced'> = ['NEET', 'JEE Main', 'JEE Advanced'];

  readonly subjectsByExam: Record<string, string[]> = {
    'NEET':         ['Physics', 'Chemistry', 'Biology – Botany', 'Biology – Zoology'],
    'JEE Main':     ['Physics', 'Chemistry', 'Mathematics'],
    'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
  };

  readonly topicsBySubject: Record<string, string[]> = {
    'Physics':            ['Mechanics', 'Thermodynamics', 'Optics', 'Electrostatics', 'Magnetism', 'Modern Physics', 'Waves & Sound', 'Fluid Mechanics'],
    'Chemistry':          ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Electrochemistry', 'Chemical Bonding', 'Coordination Compounds'],
    'Biology – Botany':   ['Cell Biology', 'Plant Physiology', 'Genetics', 'Ecology', 'Biotechnology', 'Morphology of Plants'],
    'Biology – Zoology':  ['Human Physiology', 'Animal Kingdom', 'Reproduction', 'Evolution', 'Biomolecules'],
    'Mathematics':        ['Calculus', 'Algebra', 'Coordinate Geometry', 'Trigonometry', 'Vectors & 3D', 'Probability', 'Matrices & Determinants'],
  };

  readonly teachers = [
    'Dr. Vikram Sharma',
    'Mr. Rahul Gupta',
    'Ms. Pooja Iyer',
    'Dr. Sanjay Mishra',
    'Dr. Meena Krishnan',
    'Ms. Divya Nair',
    'Mr. Arjun Verma',
    'Dr. Kiran Patel',
  ];

  readonly statuses: Array<'scheduled' | 'live' | 'completed' | 'cancelled'> = ['scheduled', 'live', 'completed', 'cancelled'];

  readonly sessionTimes: Record<number, { start: string; end: string }> = {
    1: { start: '07:00', end: '08:30' },
    2: { start: '09:00', end: '10:30' },
    3: { start: '11:00', end: '12:30' },
    4: { start: '14:00', end: '15:30' },
    5: { start: '16:00', end: '17:30' },
    6: { start: '18:00', end: '19:30' },
    7: { start: '20:00', end: '21:30' },
  };

  // ── BBB link generation ───────────────────────────────────────────────────
  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  generateMeetingId(batch: string, subject: string, day: string, session: number): string {
    return `${this.slugify(batch)}-${this.slugify(subject)}-${this.slugify(day)}-s${session}`;
  }

  buildMeetingLink(meetingId: string): string {
    return `${BBB_SERVER}/b/${meetingId}`;
  }

  // ── Sample data ───────────────────────────────────────────────────────────
  slots: TimetableSlot[] = [
    // NEET 2025 – Batch A
    { id: 1,  day: 'Monday',    session: 1, subject: 'Physics',           topic: 'Mechanics',              teacher: 'Dr. Vikram Sharma',  batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '07:00', endTime: '08:30', meetingId: 'neet-2025-batch-a-physics-monday-s1',           meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-physics-monday-s1`,           status: 'completed' },
    { id: 2,  day: 'Monday',    session: 3, subject: 'Chemistry',         topic: 'Organic Chemistry',      teacher: 'Ms. Pooja Iyer',     batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '11:00', endTime: '12:30', meetingId: 'neet-2025-batch-a-chemistry-monday-s3',         meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-chemistry-monday-s3`,         status: 'completed' },
    { id: 3,  day: 'Monday',    session: 5, subject: 'Biology – Botany',  topic: 'Cell Biology',           teacher: 'Dr. Meena Krishnan', batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '16:00', endTime: '17:30', meetingId: 'neet-2025-batch-a-biology-botany-monday-s5',    meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-biology-botany-monday-s5`,    status: 'live' },
    { id: 4,  day: 'Tuesday',   session: 1, subject: 'Physics',           topic: 'Thermodynamics',         teacher: 'Dr. Vikram Sharma',  batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '07:00', endTime: '08:30', meetingId: 'neet-2025-batch-a-physics-tuesday-s1',          meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-physics-tuesday-s1`,          status: 'scheduled' },
    { id: 5,  day: 'Tuesday',   session: 3, subject: 'Biology – Zoology', topic: 'Human Physiology',       teacher: 'Ms. Divya Nair',     batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '11:00', endTime: '12:30', meetingId: 'neet-2025-batch-a-biology-zoology-tuesday-s3',  meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-biology-zoology-tuesday-s3`,  status: 'scheduled' },
    { id: 6,  day: 'Wednesday', session: 2, subject: 'Chemistry',         topic: 'Inorganic Chemistry',    teacher: 'Ms. Pooja Iyer',     batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '09:00', endTime: '10:30', meetingId: 'neet-2025-batch-a-chemistry-wednesday-s2',      meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-chemistry-wednesday-s2`,      status: 'scheduled' },
    { id: 7,  day: 'Wednesday', session: 5, subject: 'Physics',           topic: 'Optics',                 teacher: 'Mr. Rahul Gupta',    batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '16:00', endTime: '17:30', meetingId: 'neet-2025-batch-a-physics-wednesday-s5',        meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-physics-wednesday-s5`,        status: 'scheduled' },
    { id: 8,  day: 'Thursday',  session: 1, subject: 'Biology – Botany',  topic: 'Plant Physiology',       teacher: 'Dr. Meena Krishnan', batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '07:00', endTime: '08:30', meetingId: 'neet-2025-batch-a-biology-botany-thursday-s1',  meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-biology-botany-thursday-s1`,  status: 'scheduled' },
    { id: 9,  day: 'Thursday',  session: 4, subject: 'Chemistry',         topic: 'Physical Chemistry',     teacher: 'Dr. Sanjay Mishra',  batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '14:00', endTime: '15:30', meetingId: 'neet-2025-batch-a-chemistry-thursday-s4',       meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-chemistry-thursday-s4`,       status: 'scheduled' },
    { id: 10, day: 'Friday',    session: 2, subject: 'Physics',           topic: 'Electrostatics',         teacher: 'Dr. Vikram Sharma',  batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '09:00', endTime: '10:30', meetingId: 'neet-2025-batch-a-physics-friday-s2',           meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-physics-friday-s2`,           status: 'scheduled' },
    { id: 11, day: 'Friday',    session: 5, subject: 'Biology – Zoology', topic: 'Reproduction',           teacher: 'Ms. Divya Nair',     batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '16:00', endTime: '17:30', meetingId: 'neet-2025-batch-a-biology-zoology-friday-s5',   meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-biology-zoology-friday-s5`,   status: 'scheduled' },
    { id: 12, day: 'Saturday',  session: 1, subject: 'Chemistry',         topic: 'Electrochemistry',       teacher: 'Ms. Pooja Iyer',     batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '07:00', endTime: '08:30', meetingId: 'neet-2025-batch-a-chemistry-saturday-s1',       meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-chemistry-saturday-s1`,       status: 'scheduled' },
    { id: 13, day: 'Saturday',  session: 3, subject: 'Physics',           topic: 'Modern Physics',         teacher: 'Mr. Rahul Gupta',    batch: 'NEET 2025 – Batch A',     examType: 'NEET',         startTime: '11:00', endTime: '12:30', meetingId: 'neet-2025-batch-a-physics-saturday-s3',         meetingLink: `${BBB_SERVER}/b/neet-2025-batch-a-physics-saturday-s3`,         status: 'scheduled' },

    // JEE Main 2025 – Batch A
    { id: 14, day: 'Monday',    session: 2, subject: 'Mathematics',       topic: 'Calculus',               teacher: 'Mr. Arjun Verma',    batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     startTime: '09:00', endTime: '10:30', meetingId: 'jee-main-2025-batch-a-mathematics-monday-s2',   meetingLink: `${BBB_SERVER}/b/jee-main-2025-batch-a-mathematics-monday-s2`,   status: 'completed' },
    { id: 15, day: 'Monday',    session: 4, subject: 'Physics',           topic: 'Mechanics',              teacher: 'Mr. Rahul Gupta',    batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     startTime: '14:00', endTime: '15:30', meetingId: 'jee-main-2025-batch-a-physics-monday-s4',       meetingLink: `${BBB_SERVER}/b/jee-main-2025-batch-a-physics-monday-s4`,       status: 'live' },
    { id: 16, day: 'Tuesday',   session: 2, subject: 'Chemistry',         topic: 'Chemical Bonding',       teacher: 'Dr. Sanjay Mishra',  batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     startTime: '09:00', endTime: '10:30', meetingId: 'jee-main-2025-batch-a-chemistry-tuesday-s2',    meetingLink: `${BBB_SERVER}/b/jee-main-2025-batch-a-chemistry-tuesday-s2`,    status: 'scheduled' },
    { id: 17, day: 'Tuesday',   session: 4, subject: 'Mathematics',       topic: 'Coordinate Geometry',    teacher: 'Dr. Kiran Patel',    batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     startTime: '14:00', endTime: '15:30', meetingId: 'jee-main-2025-batch-a-mathematics-tuesday-s4',  meetingLink: `${BBB_SERVER}/b/jee-main-2025-batch-a-mathematics-tuesday-s4`,  status: 'scheduled' },
    { id: 18, day: 'Wednesday', session: 1, subject: 'Physics',           topic: 'Electrostatics',         teacher: 'Dr. Vikram Sharma',  batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     startTime: '07:00', endTime: '08:30', meetingId: 'jee-main-2025-batch-a-physics-wednesday-s1',    meetingLink: `${BBB_SERVER}/b/jee-main-2025-batch-a-physics-wednesday-s1`,    status: 'scheduled' },
    { id: 19, day: 'Thursday',  session: 3, subject: 'Mathematics',       topic: 'Vectors & 3D',           teacher: 'Mr. Arjun Verma',    batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     startTime: '11:00', endTime: '12:30', meetingId: 'jee-main-2025-batch-a-mathematics-thursday-s3', meetingLink: `${BBB_SERVER}/b/jee-main-2025-batch-a-mathematics-thursday-s3`, status: 'scheduled' },
    { id: 20, day: 'Friday',    session: 1, subject: 'Chemistry',         topic: 'Organic Chemistry',      teacher: 'Ms. Pooja Iyer',     batch: 'JEE Main 2025 – Batch A', examType: 'JEE Main',     startTime: '07:00', endTime: '08:30', meetingId: 'jee-main-2025-batch-a-chemistry-friday-s1',     meetingLink: `${BBB_SERVER}/b/jee-main-2025-batch-a-chemistry-friday-s1`,     status: 'scheduled' },

    // JEE Advanced 2025
    { id: 21, day: 'Monday',    session: 6, subject: 'Mathematics',       topic: 'Matrices & Determinants', teacher: 'Dr. Kiran Patel',   batch: 'JEE Advanced 2025',       examType: 'JEE Advanced', startTime: '18:00', endTime: '19:30', meetingId: 'jee-advanced-2025-mathematics-monday-s6',        meetingLink: `${BBB_SERVER}/b/jee-advanced-2025-mathematics-monday-s6`,        status: 'scheduled' },
    { id: 22, day: 'Wednesday', session: 6, subject: 'Physics',           topic: 'Fluid Mechanics',         teacher: 'Dr. Vikram Sharma',  batch: 'JEE Advanced 2025',       examType: 'JEE Advanced', startTime: '18:00', endTime: '19:30', meetingId: 'jee-advanced-2025-physics-wednesday-s6',         meetingLink: `${BBB_SERVER}/b/jee-advanced-2025-physics-wednesday-s6`,         status: 'scheduled' },
    { id: 23, day: 'Friday',    session: 6, subject: 'Chemistry',         topic: 'Coordination Compounds',  teacher: 'Dr. Sanjay Mishra',  batch: 'JEE Advanced 2025',       examType: 'JEE Advanced', startTime: '18:00', endTime: '19:30', meetingId: 'jee-advanced-2025-chemistry-friday-s6',          meetingLink: `${BBB_SERVER}/b/jee-advanced-2025-chemistry-friday-s6`,          status: 'scheduled' },
  ];

  // ── Derived form lists ────────────────────────────────────────────────────
  get availableSubjects(): string[] {
    return this.subjectsByExam[this.form.examType] ?? [];
  }

  get availableTopics(): string[] {
    return this.topicsBySubject[this.form.subject] ?? [];
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  get totalSlots(): number     { return this.slots.length; }
  get liveNow(): number        { return this.slots.filter(s => s.status === 'live').length; }
  get scheduledCount(): number { return this.slots.filter(s => s.status === 'scheduled').length; }
  get activeBatches(): number  { return new Set(this.slots.map(s => s.batch)).size; }

  // ── Filtered ──────────────────────────────────────────────────────────────
  get filteredSlots(): TimetableSlot[] {
    return this.slots.filter(s => {
      const matchBatch = !this.batchFilter || s.batch === this.batchFilter;
      const matchExam  = !this.examFilter  || s.examType === this.examFilter;
      return matchBatch && matchExam;
    });
  }

  getSlot(day: string, session: number): TimetableSlot | undefined {
    return this.filteredSlots.find(s => s.day === day && s.session === session);
  }

  getSubjectColor(subject: string): string {
    const map: Record<string, string> = {
      'Physics':            'slot-physics',
      'Chemistry':          'slot-chemistry',
      'Biology – Botany':   'slot-biology',
      'Biology – Zoology':  'slot-zoology',
      'Mathematics':        'slot-math',
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

  getExamChip(examType: string): string {
    const map: Record<string, string> = {
      'NEET':         'chip-emerald',
      'JEE Main':     'chip-sky',
      'JEE Advanced': 'chip-rose',
    };
    return map[examType] || 'chip-indigo';
  }

  canJoin(status: string): boolean {
    return status === 'live' || status === 'scheduled';
  }

  // ── Clipboard ─────────────────────────────────────────────────────────────
  copiedId: number | null = null;

  copyLink(slot: TimetableSlot): void {
    navigator.clipboard.writeText(slot.meetingLink).then(() => {
      this.copiedId = slot.id;
      setTimeout(() => { this.copiedId = null; }, 2000);
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalMode: ModalMode = null;
  selectedSlot: TimetableSlot | null = null;
  nextId = 30;

  form: TimetablePayload = this.emptyForm();

  emptyForm(): TimetablePayload {
    return {
      day: '', session: 1, subject: '', topic: '', teacher: '',
      batch: '', examType: 'NEET',
      startTime: '07:00', endTime: '08:30',
      status: 'scheduled'
    };
  }

  openCreate(day?: string, session?: number): void {
    this.form = this.emptyForm();
    if (day)     this.form.day = day;
    if (session) {
      this.form.session = session;
      const st = this.sessionTimes[session];
      if (st) { this.form.startTime = st.start; this.form.endTime = st.end; }
    }
    if (this.batchFilter) {
      this.form.batch = this.batchFilter;
      const found = this.slots.find(s => s.batch === this.batchFilter);
      if (found) this.form.examType = found.examType;
    }
    if (this.examFilter) this.form.examType = this.examFilter as any;
    this.modalMode = 'create';
  }

  openEdit(slot: TimetableSlot): void {
    this.selectedSlot = slot;
    this.form = {
      day: slot.day, session: slot.session, subject: slot.subject,
      topic: slot.topic, teacher: slot.teacher, batch: slot.batch,
      examType: slot.examType, startTime: slot.startTime, endTime: slot.endTime,
      status: slot.status
    };
    this.modalMode = 'edit';
  }

  openView(slot: TimetableSlot): void {
    this.selectedSlot = slot;
    this.modalMode = 'view';
  }

  openDelete(slot: TimetableSlot): void {
    this.selectedSlot = slot;
    this.modalMode = 'delete';
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedSlot = null;
  }

  onSessionChange(): void {
    const st = this.sessionTimes[this.form.session];
    if (st) { this.form.startTime = st.start; this.form.endTime = st.end; }
  }

  onExamTypeChange(): void {
    this.form.subject = '';
    this.form.topic   = '';
  }

  onSubjectChange(): void {
    this.form.topic = '';
  }

  saveSlot(): void {
    if (!this.form.day || !this.form.subject || !this.form.teacher || !this.form.batch) return;

    const conflict = this.slots.find(s =>
      s.day === this.form.day &&
      s.session === this.form.session &&
      s.batch === this.form.batch &&
      (this.modalMode === 'create' || s.id !== this.selectedSlot?.id)
    );
    if (conflict) {
      alert(`Conflict: ${this.form.batch} already has a session ${this.form.session} on ${this.form.day}.`);
      return;
    }

    // Auto-generate BBB meeting ID & link
    const meetingId   = this.generateMeetingId(this.form.batch, this.form.subject, this.form.day, this.form.session);
    const meetingLink = this.buildMeetingLink(meetingId);

    if (this.modalMode === 'create') {
      this.slots.push({ id: this.nextId++, ...this.form, meetingId, meetingLink });
    } else if (this.modalMode === 'edit' && this.selectedSlot) {
      const idx = this.slots.findIndex(s => s.id === this.selectedSlot!.id);
      if (idx > -1) this.slots[idx] = { id: this.selectedSlot.id, ...this.form, meetingId, meetingLink };
    }
    this.closeModal();
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
}

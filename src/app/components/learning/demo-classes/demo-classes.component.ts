import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { DemoClassService, DemoClassDto, DemoClassPayload, DemoRegistrationDto } from '../../../services/demo-class.service';
import { Permission, PermissionService } from '../../../auth/permission.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | 'registrations' | null;

@Component({
  selector: 'app-demo-classes',
  standalone: false,
  templateUrl: './demo-classes.component.html',
  styleUrls: ['../../../shared-page.css', './demo-classes.component.css'],
})
export class DemoClassesComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────────────────
  demoClasses: DemoClassDto[]      = [];
  filtered:    DemoClassDto[]      = [];
  registrations: DemoRegistrationDto[] = [];

  apiBatches:  any[] = [];
  apiTeachers: any[] = [];
  apiBoards:   any[] = [];
  apiClasses:  any[] = [];

  // ── UI ────────────────────────────────────────────────────────────────────
  isLoading        = false;
  isSaving         = false;
  isDeleting       = false;
  regsLoading      = false;
  searchQuery      = '';
  statusFilter     = '';

  modalMode: ModalMode = null;
  selected: DemoClassDto | null = null;

  // ── Pagination ────────────────────────────────────────────────────────────
  pageSize    = 10;
  currentPage = 1;

  get paged(): DemoClassDto[] {
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize);
  }

  onPageChange(page: number): void { this.currentPage = page; }

  // ── Form ──────────────────────────────────────────────────────────────────
  formTitle         = '';
  formDescription   = '';
  formBoardId       = '';
  formClassId       = '';
  formSubject       = '';
  formTopic         = '';
  formTeacherId     = '';
  formTeacherName   = '';
  formScheduledDate = '';
  formStartTime     = '';
  formEndTime       = '';
  formMaxStudents   = 50;

  // Errors
  errTitle          = '';
  errBoardId        = '';
  errClassId        = '';
  errSubject        = '';
  errTeacherId      = '';
  errScheduledDate  = '';
  errStartTime      = '';
  errEndTime        = '';

  constructor(
    private demoClassService: DemoClassService,
    private httpService: HttpGeneralService<any>,
    private commonService: CommonService,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadBoards();
    this.loadClasses();
    this.loadTeachers();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  get totalCount():     number { return this.demoClasses.length; }
  get scheduledCount(): number { return this.demoClasses.filter(d => d.status === 'Scheduled').length; }
  get liveCount():      number { return this.demoClasses.filter(d => d.status === 'Live').length; }
  get totalRegistered():number { return this.demoClasses.reduce((s, d) => s + (d.registeredCount ?? 0), 0); }

  // ── API ───────────────────────────────────────────────────────────────────

  load(): void {
    this.isLoading = true;
    this.demoClassService.getAll().subscribe({
      next: (res: any) => {
        this.demoClasses = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load demo classes.');
        this.isLoading = false;
      },
    });
  }

  private loadBoards(): void {
    this.httpService.getData(BASE_URL, '/board').subscribe({
      next: (res: any) => { this.apiBoards = Array.isArray(res) ? res : (res?.data ?? []); },
      error: () => {},
    });
  }

  private loadClasses(): void {
    this.httpService.getData(BASE_URL, '/classes').subscribe({
      next: (res: any) => { this.apiClasses = Array.isArray(res) ? res : (res?.data ?? []); },
      error: () => {},
    });
  }

  private loadTeachers(): void {
    this.httpService.getData(BASE_URL, '/users').subscribe({
      next: (res: any) => {
        const users: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.apiTeachers = users.filter(u =>
          (u.roleDto?.name ?? u.role?.name ?? u.userType ?? '').toLowerCase() === 'teacher'
        );
      },
      error: () => {},
    });
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  save(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    const payload = this.buildPayload();
    const obs = this.modalMode === 'create'
      ? this.demoClassService.create(payload)
      : this.demoClassService.update(this.selected!.id, payload);
    obs.subscribe({
      next: () => {
        this.commonService.success(
          this.modalMode === 'create' ? 'Demo class created.' : 'Demo class updated.'
        );
        this.isSaving = false;
        this.closeModal();
        this.load();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to save demo class.');
        this.isSaving = false;
      },
    });
  }

  confirmDelete(): void {
    if (!this.selected) return;
    this.isDeleting = true;
    this.demoClassService.delete(this.selected.id).subscribe({
      next: () => {
        this.commonService.success('Demo class deleted.');
        this.isDeleting = false;
        this.closeModal();
        this.load();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to delete demo class.');
        this.isDeleting = false;
      },
    });
  }

  loadRegistrations(id: string): void {
    this.regsLoading  = true;
    this.registrations = [];
    this.demoClassService.getRegistrations(id).subscribe({
      next: (res: any) => {
        this.registrations = Array.isArray(res) ? res : (res?.data ?? []);
        this.regsLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load registrations.');
        this.regsLoading = false;
      },
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.resetForm();
    this.modalMode = 'create';
  }

  openEdit(d: DemoClassDto): void {
    this.selected         = d;
    this.formTitle        = d.title;
    this.formDescription  = d.description;
    this.formBoardId      = d.boardId;
    this.formClassId      = d.classId;
    this.formSubject      = d.subject;
    this.formTopic        = d.topic;
    this.formTeacherId    = d.teacherId;
    this.formTeacherName  = d.teacherName;
    this.formScheduledDate = d.scheduledDate ? d.scheduledDate.substring(0, 10) : '';
    this.formStartTime    = d.startTime;
    this.formEndTime      = d.endTime;
    this.formMaxStudents  = d.maxStudents;
    this.clearErrors();
    this.modalMode = 'edit';
  }

  openView(d: DemoClassDto): void {
    this.selected  = d;
    this.modalMode = 'view';
  }

  openDelete(d: DemoClassDto): void {
    this.selected  = d;
    this.modalMode = 'delete';
  }

  openRegistrations(d: DemoClassDto): void {
    this.selected  = d;
    this.modalMode = 'registrations';
    this.loadRegistrations(d.id);
  }

  closeModal(): void {
    this.modalMode = null;
    this.selected  = null;
    this.registrations = [];
    this.clearErrors();
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.demoClasses.filter(d => {
      const matchSearch = !q ||
        d.title.toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q) ||
        d.teacherName.toLowerCase().includes(q);
      const matchStatus = !this.statusFilter || d.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
    this.currentPage = 1;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Scheduled: 'pg-badge pg-badge--blue',
      Live:      'pg-badge pg-badge--red',
      Completed: 'pg-badge pg-badge--green',
      Canceled:  'pg-badge pg-badge--gray',
    };
    return map[status] || 'pg-badge';
  }

  onTeacherChange(): void {
    const t = this.apiTeachers.find((x: any) => x.id === this.formTeacherId);
    this.formTeacherName = t
      ? `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim()
      : '';
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private validate(): boolean {
    this.clearErrors();
    let ok = true;
    if (!this.formTitle.trim())        { this.errTitle        = 'Title is required.';           ok = false; }
    if (!this.formBoardId)             { this.errBoardId      = 'Board is required.';           ok = false; }
    if (!this.formClassId)             { this.errClassId      = 'Class is required.';           ok = false; }
    if (!this.formSubject.trim())      { this.errSubject      = 'Subject is required.';         ok = false; }
    if (!this.formTeacherId)           { this.errTeacherId    = 'Teacher is required.';         ok = false; }
    if (!this.formScheduledDate)       { this.errScheduledDate = 'Scheduled date is required.'; ok = false; }
    if (!this.formStartTime)           { this.errStartTime    = 'Start time is required.';      ok = false; }
    if (!this.formEndTime)             { this.errEndTime      = 'End time is required.';        ok = false; }
    return ok;
  }

  private clearErrors(): void {
    this.errTitle = this.errBoardId = this.errClassId = this.errSubject =
      this.errTeacherId = this.errScheduledDate = this.errStartTime = this.errEndTime = '';
  }

  private resetForm(): void {
    this.formTitle         = '';
    this.formDescription   = '';
    this.formBoardId       = '';
    this.formClassId       = '';
    this.formSubject       = '';
    this.formTopic         = '';
    this.formTeacherId     = '';
    this.formTeacherName   = '';
    this.formScheduledDate = '';
    this.formStartTime     = '';
    this.formEndTime       = '';
    this.formMaxStudents   = 50;
    this.clearErrors();
  }

  private buildPayload(): DemoClassPayload {
    return {
      title:         this.formTitle.trim(),
      description:   this.formDescription.trim(),
      boardId:       this.formBoardId,
      classId:       this.formClassId,
      subject:       this.formSubject.trim(),
      topic:         this.formTopic.trim(),
      teacherId:     this.formTeacherId,
      teacherName:   this.formTeacherName,
      scheduledDate: new Date(this.formScheduledDate).toISOString(),
      startTime:     this.formStartTime,
      endTime:       this.formEndTime,
      maxStudents:   this.formMaxStudents,
    };
  }
}

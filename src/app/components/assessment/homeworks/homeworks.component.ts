import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { HomeworkService, HomeworkDto, SubmissionDto } from '../../../services/homework.service';
import { Permission, PermissionService } from '../../../auth/permission.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

type ModalMode = 'create' | 'view' | 'submissions' | 'submit' | 'delete' | null;

@Component({
  selector: 'app-homeworks',
  standalone: false,
  templateUrl: './homeworks.component.html',
  styleUrls: ['../../../shared-page.css', './homeworks.component.css'],
})
export class HomeworksComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────────────────
  homeworks: HomeworkDto[]  = [];
  filtered: HomeworkDto[]   = [];
  batches:  { id: string; name: string }[] = [];
  submissions: SubmissionDto[] = [];
  mySubmissionMap: Record<string, SubmissionDto | null> = {};  // homeworkId → student's own submission
  private userMap: Record<string, string> = {};   // id → full name
  currentUserName = '';

  // ── UI state ──────────────────────────────────────────────────────────────
  isLoading      = false;
  isSaving       = false;
  isDeleting     = false;
  subLoading     = false;
  searchQuery    = '';
  batchFilter    = '';
  modalMode: ModalMode = null;
  selected: HomeworkDto | null = null;

  // ── Pagination ────────────────────────────────────────────────────────────
  pageSize    = 10;
  currentPage = 1;

  get paged(): HomeworkDto[] {
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize);
  }

  onPageChange(page: number): void { this.currentPage = page; }

  // ── Create form ───────────────────────────────────────────────────────────
  formTeacherId   = '';
  formBatchId     = '';
  formTitle       = '';
  formDescription = '';
  formDueDate     = '';
  formMaxMarks    = 50;
  formFile: File | null = null;
  fileName        = '';

  // Errors
  errTitle       = '';
  errBatchId     = '';
  errTeacherId   = '';
  errDueDate     = '';
  errMaxMarks    = '';

  // ── Submit form (student) ─────────────────────────────────────────────────
  submitFile: File | null = null;
  submitFileName          = '';
  isSubmitting            = false;
  errSubmitFile           = '';

  // ── Grade form (teacher/admin) ────────────────────────────────────────────
  gradingId    = '';          // submissionId being graded
  gradeMarks:   Record<string, number | null>  = {};
  gradeFeedback: Record<string, string>         = {};
  isSavingGrade: Record<string, boolean>        = {};

  // ── Current user ─────────────────────────────────────────────────────────
  private currentUserId   = '';
  currentUserRole: 'admin' | 'teacher' | 'student' | '' = '';

  get canAssign(): boolean {
    return this.currentUserRole === 'admin' || this.currentUserRole === 'teacher';
  }

  get isStudent(): boolean {
    return this.currentUserRole === 'student';
  }

  constructor(
    private homeworkService: HomeworkService,
    private httpService: HttpGeneralService<any>,
    private commonService: CommonService,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
    this.loadBatches();
    this.loadHomeworks();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ── API ───────────────────────────────────────────────────────────────────

  private loadCurrentUser(): void {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserId = payload.userId ?? '';
      this.formTeacherId = this.currentUserId;
      const role = (payload.roleName ?? '').toString().toLowerCase();
      this.currentUserRole =
        role === 'teacher' ? 'teacher' :
        role === 'student' ? 'student' : 'admin';
      if (this.currentUserId) {
        this.httpService.getData(BASE_URL, `/users/${this.currentUserId}`).subscribe({
          next: (res: any) => {
            const first = res.firstName ?? '';
            const last  = res.lastName  ?? '';
            this.currentUserName = (`${first} ${last}`).trim() || res.userName || 'Me';
          },
          error: () => {}
        });
      }
    } catch {}
  }

  private loadUsers(): void {
    this.httpService.getData(BASE_URL, '/users').subscribe({
      next: (res: any) => {
        const users: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        users.forEach(u => {
          const name = (`${u.firstName ?? ''} ${u.lastName ?? ''}`).trim() || u.userName || u.email || u.id;
          this.userMap[u.id] = name;
        });
      },
      error: () => {}
    });
  }

  loadHomeworks(): void {
    this.isLoading = true;
    this.homeworkService.getAll().subscribe({
      next: (res: any) => {
        this.homeworks = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
        if (this.isStudent) this.loadMySubmissions();
      },
      error: () => {
        this.commonService.error('Failed to load assignments.');
        this.isLoading = false;
      },
    });
  }

  private loadMySubmissions(): void {
    this.homeworks.forEach(hw => {
      this.homeworkService.getSubmissions(hw.id).subscribe({
        next: (res: any) => {
          const subs: SubmissionDto[] = Array.isArray(res) ? res : (res?.data ?? []);
          this.mySubmissionMap[hw.id] = subs.find(s => s.studentId === this.currentUserId) ?? null;
        },
        error: () => { this.mySubmissionMap[hw.id] = null; },
      });
    });
  }

  private loadBatches(): void {
    this.httpService.getData(BASE_URL, '/batches').subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.batches = raw.map(b => ({ id: b.id, name: b.name || b.batchName || b.id }));
      },
      error: () => {},
    });
  }

  loadSubmissions(id: string): void {
    this.subLoading  = true;
    this.submissions = [];
    this.homeworkService.getSubmissions(id).subscribe({
      next: (res: any) => {
        this.submissions = Array.isArray(res) ? res : (res?.data ?? []);
        // Pre-fill grade form with existing marks/feedback
        this.gradeMarks    = {};
        this.gradeFeedback = {};
        this.submissions.forEach(s => {
          this.gradeMarks[s.id]    = s.marks;
          this.gradeFeedback[s.id] = s.feedback ?? '';
        });
        this.subLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load submissions.');
        this.subLoading = false;
      },
    });
  }

  saveGrade(submissionId: string): void {
    const marks    = this.gradeMarks[submissionId];
    const feedback = this.gradeFeedback[submissionId] ?? '';
    if (marks === null || marks === undefined) {
      this.commonService.error('Please enter marks before saving.'); return;
    }
    if (this.selected && marks > this.selected.maxMarks) {
      this.commonService.error(`Marks cannot exceed max marks (${this.selected.maxMarks}).`); return;
    }
    this.isSavingGrade[submissionId] = true;
    this.homeworkService.grade(submissionId, marks, feedback).subscribe({
      next: () => {
        this.commonService.success('Grade saved.');
        this.isSavingGrade[submissionId] = false;
        const s = this.submissions.find(x => x.id === submissionId);
        if (s) { s.marks = marks; s.feedback = feedback; }
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to save grade.');
        this.isSavingGrade[submissionId] = false;
      },
    });
  }

  save(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    this.homeworkService.create(
      this.formTeacherId,
      this.formBatchId,
      this.formTitle,
      this.formDescription,
      new Date(this.formDueDate).toISOString(),
      this.formMaxMarks,
      this.formFile
    ).subscribe({
      next: () => {
        this.commonService.success('Assignment created successfully.');
        this.closeModal();
        this.loadHomeworks();
        this.isSaving = false;
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to create assignment.');
        this.isSaving = false;
      },
    });
  }

  confirmDelete(): void {
    if (!this.selected) return;
    this.isDeleting = true;
    this.homeworkService.delete(this.selected.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.commonService.success('Assignment deleted.');
        this.closeModal();
        this.loadHomeworks();
      },
      error: (err: any) => {
        this.isDeleting = false;
        console.error('Delete homework failed:', err);
        this.commonService.error(err?.error?.message || 'Failed to delete assignment.');
      },
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.resetForm();
    this.modalMode = 'create';
  }

  openView(hw: HomeworkDto): void {
    this.selected  = hw;
    this.modalMode = 'view';
  }

  openSubmit(hw: HomeworkDto): void {
    this.selected        = hw;
    this.submitFile      = null;
    this.submitFileName  = '';
    this.errSubmitFile   = '';
    this.modalMode       = 'submit';
  }

  onSubmitFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.submitFile     = input.files[0];
      this.submitFileName = input.files[0].name;
      this.errSubmitFile  = '';
    }
  }

  submitAssignment(): void {
    if (!this.submitFile) { this.errSubmitFile = 'Please select a file to submit.'; return; }
    if (!this.selected)   return;
    const hwId = this.selected.id;
    this.isSubmitting = true;
    this.homeworkService.submit(hwId, this.currentUserId, this.submitFile).subscribe({
      next: () => {
        this.commonService.success('Assignment submitted successfully!');
        // Mark as submitted immediately so the upload button hides without reload
        this.mySubmissionMap[hwId] = {
          id: '', homeworkId: hwId, studentId: this.currentUserId,
          fileUrl: '', marks: null, feedback: null,
          submittedAt: new Date().toISOString(),
        };
        this.closeModal();
        this.isSubmitting = false;
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to submit assignment.');
        this.isSubmitting = false;
      },
    });
  }

  openSubmissions(hw: HomeworkDto): void {
    this.selected  = hw;
    this.modalMode = 'submissions';
    this.loadSubmissions(hw.id);
  }

  openDelete(hw: HomeworkDto): void {
    this.selected  = hw;
    this.modalMode = 'delete';
  }

  closeModal(): void {
    this.modalMode      = null;
    this.selected       = null;
    this.submissions    = [];
    this.submitFile     = null;
    this.submitFileName = '';
    this.errSubmitFile  = '';
    this.clearErrors();
  }

  // ── File picker ───────────────────────────────────────────────────────────

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.formFile = input.files[0];
      this.fileName = input.files[0].name;
    }
  }

  clearFile(): void {
    this.formFile = null;
    this.fileName = '';
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.homeworks.filter(h => {
      const matchSearch = !q || h.title.toLowerCase().includes(q) || h.description.toLowerCase().includes(q);
      const matchBatch  = !this.batchFilter || h.batchId === this.batchFilter;
      return matchSearch && matchBatch;
    });
    this.currentPage = 1;
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private validate(): boolean {
    this.clearErrors();
    let ok = true;
    if (!this.formTitle.trim())     { this.errTitle     = 'Title is required.';        ok = false; }
    if (!this.formBatchId)          { this.errBatchId   = 'Batch is required.';        ok = false; }
    if (!this.formTeacherId.trim()) { this.errTeacherId = 'Teacher ID is required.';   ok = false; }
    if (!this.formDueDate)          { this.errDueDate   = 'Due date is required.';     ok = false; }
    if (!this.formMaxMarks || this.formMaxMarks < 1) {
      this.errMaxMarks = 'Max marks must be at least 1.'; ok = false;
    }
    return ok;
  }

  private clearErrors(): void {
    this.errTitle = this.errBatchId = this.errTeacherId = this.errDueDate = this.errMaxMarks = '';
  }

  private resetForm(): void {
    this.formBatchId     = '';
    this.formTitle       = '';
    this.formDescription = '';
    this.formDueDate     = '';
    this.formMaxMarks    = 50;
    this.formFile        = null;
    this.fileName        = '';
    this.formTeacherId   = this.currentUserId;
    this.clearErrors();
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  getBatchName(batchId: string): string {
    return this.batches.find(b => b.id === batchId)?.name ?? batchId;
  }

  getUserName(userId: string): string {
    return this.userMap[userId] || '—';
  }

  isPastDue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  get totalAssignments(): number  { return this.homeworks.length; }
  get activeAssignments(): number { return this.homeworks.filter(h => h.isActive).length; }
  get pastDueCount(): number      { return this.homeworks.filter(h => this.isPastDue(h.dueDate)).length; }
}

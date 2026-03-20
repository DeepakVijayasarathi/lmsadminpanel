import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface Batch {
  id: string;
  name?: string;
  batchName?: string;
  courseId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  maxStudents?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  // Populated relations (if returned by API)
  course?: { id: string; name: string };
  teacher?: { id: string; firstName: string; lastName: string };
  students?: UserRef[];
  teachers?: UserRef[];
}

export interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  username?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

export interface BatchPayload {
  name: string;
  courseId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
}

export interface BatchUpdatePayload {
  batchName: string;
  courseId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
  isActive: boolean;
}

type ModalMode =
  | 'create'
  | 'edit'
  | 'view'
  | 'delete'
  | 'manage-students'
  | 'manage-teachers'
  | null;

@Component({
  selector: 'app-batches',
  standalone: false,
  templateUrl: './batches.component.html',
  styleUrls: ['../../../shared-page.css', './batches.component.css'],
})
export class BatchesComponent implements OnInit {
  batches: Batch[] = [];
  filteredBatches: Batch[] = [];
  allStudents: UserRef[] = [];
  allTeachers: UserRef[] = [];
  courses: Course[] = [];

  searchQuery: string = '';
  statusFilter: string = '';
  isLoading: boolean = false;

  // Modal state
  modalMode: ModalMode = null;
  selectedBatch: Batch | null = null;

  // Form fields
  formName: string = '';
  formCourseId: string = '';
  formTeacherId: string = '';
  formStartDate: string = '';
  formEndDate: string = '';
  formMaxStudents: number = 30;
  formIsActive: boolean = true;

  // Manage members
  memberSearchQuery: string = '';
  actionLoadingId: string = '';

  // Validation
  nameError: string = '';
  teacherError: string = '';
  startDateError: string = '';
  endDateError: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadBatches();
    this.loadUsers();
    this.loadCourses();
  }

  // ─── API Calls ──────────────────────────────────────────────

  loadBatches(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/batches').subscribe({
      next: (res: any) => {
        this.batches = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load batches.');
        this.isLoading = false;
      },
    });
  }

  loadUsers(): void {
    this.httpService.getData(BASE_URL, '/role').subscribe({
      next: (rolesRes: any) => {
        const roles: any[] = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data ?? []);
        const teacherRole = roles.find((r: any) => r.name === 'Teacher');
        const studentRole = roles.find((r: any) => r.name === 'Student');

        this.httpService.getData(BASE_URL, '/users').subscribe({
          next: (res: any) => {
            const users: any[] = Array.isArray(res) ? res : (res?.data ?? []);
            this.allTeachers = users.filter(u => u.roleDto?.id === teacherRole?.id);
            this.allStudents = users.filter(u => u.roleDto?.id === studentRole?.id);
          },
          error: () => {},
        });
      },
      error: () => {
        // fallback to name-based filter
        this.httpService.getData(BASE_URL, '/users').subscribe({
          next: (res: any) => {
            const users: any[] = Array.isArray(res) ? res : (res?.data ?? []);
            const roleOf = (u: any): string =>
              (u.roleDto?.name ?? u.role?.name ?? u.userType ?? '').toLowerCase();
            this.allTeachers = users.filter(u => roleOf(u) === 'teacher');
            this.allStudents = users.filter(u => roleOf(u) === 'student');
          },
          error: () => {},
        });
      },
    });
  }

  loadCourses(): void {
    this.httpService.getData(BASE_URL, '/courses').subscribe({
      next: (res: any) => {
        this.courses = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {
        this.commonService.error('Failed to load courses.');
      },
    });
  }

  createBatch(): void {
    const payload: BatchPayload = {
      name: this.formName.trim(),
      courseId: this.formCourseId.trim(),
      teacherId: this.formTeacherId,
      startDate: this.formStartDate,
      endDate: this.formEndDate,
    };
    this.httpService.postData(BASE_URL, '/batches', payload).subscribe({
      next: () => {
        this.commonService.success(
          `Batch "${payload.name}" created successfully.`,
        );
        this.closeModal();
        this.loadBatches();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to create batch.',
        );
      },
    });
  }

  updateBatch(): void {
    if (!this.selectedBatch) return;
    const payload: BatchUpdatePayload = {
      batchName: this.formName.trim(),
      courseId: this.formCourseId.trim(),
      teacherId: this.formTeacherId,
      startDate: this.formStartDate,
      endDate: this.formEndDate,
      maxStudents: this.formMaxStudents,
      isActive: this.formIsActive,
    };
    this.httpService
      .putData(BASE_URL, `/batches/update/${this.selectedBatch.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(`Batch updated successfully.`);
          this.closeModal();
          this.loadBatches();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to update batch.',
          );
        },
      });
  }

  deleteBatch(): void {
    if (!this.selectedBatch) return;
    this.httpService
      .putData(BASE_URL, `/batches/delete/${this.selectedBatch.id}`, {})
      .subscribe({
        next: () => {
          this.commonService.success(
            `Batch "${this.getBatchName(this.selectedBatch!)}" deleted.`,
          );
          this.closeModal();
          this.loadBatches();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to delete batch.',
          );
        },
      });
  }

  addStudent(studentId: string): void {
    if (!this.selectedBatch) return;
    this.actionLoadingId = studentId;
    this.httpService
      .postData(
        BASE_URL,
        `/batches/add-student?batchId=${this.selectedBatch.id}&studentId=${studentId}`,
        {},
      )
      .subscribe({
        next: () => {
          this.commonService.success('Student added to batch.');
          this.actionLoadingId = '';
          this.refreshBatch();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to add student.',
          );
          this.actionLoadingId = '';
        },
      });
  }

  removeStudent(studentId: string): void {
    if (!this.selectedBatch) return;
    this.actionLoadingId = studentId;
    this.httpService
      .postData(
        BASE_URL,
        `/batches/remove-student?batchId=${this.selectedBatch.id}&studentId=${studentId}`,
        {},
      )
      .subscribe({
        next: () => {
          this.commonService.success('Student removed from batch.');
          this.actionLoadingId = '';
          this.refreshBatch();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to remove student.',
          );
          this.actionLoadingId = '';
        },
      });
  }

  addTeacher(teacherId: string): void {
    if (!this.selectedBatch) return;
    this.actionLoadingId = teacherId;
    this.httpService
      .postData(
        BASE_URL,
        `/batches/add-teachers?batchId=${this.selectedBatch.id}&teacherId=${teacherId}`,
        {},
      )
      .subscribe({
        next: () => {
          this.commonService.success('Teacher added to batch.');
          this.actionLoadingId = '';
          this.refreshBatch();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to add teacher.',
          );
          this.actionLoadingId = '';
        },
      });
  }

  removeTeacher(teacherId: string): void {
    if (!this.selectedBatch) return;
    this.actionLoadingId = teacherId;
    this.httpService
      .postData(
        BASE_URL,
        `/batches/remove-teachers?batchId=${this.selectedBatch.id}&teacherId=${teacherId}`,
        {},
      )
      .subscribe({
        next: () => {
          this.commonService.success('Teacher removed from batch.');
          this.actionLoadingId = '';
          this.refreshBatch();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to remove teacher.',
          );
          this.actionLoadingId = '';
        },
      });
  }

  refreshBatch(): void {
    this.httpService.getData(BASE_URL, '/batches').subscribe({
      next: (res: any) => {
        const all: Batch[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.batches = all;
        if (this.selectedBatch) {
          this.selectedBatch =
            all.find((b) => b.id === this.selectedBatch!.id) ??
            this.selectedBatch;
        }
        this.applyFilters();
      },
    });
  }

  // ─── Modals ──────────────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedBatch = null;
    this.formName = '';
    this.formCourseId = '';
    this.formTeacherId = '';
    this.formStartDate = '';
    this.formEndDate = '';
    this.formMaxStudents = 30;
    this.formIsActive = true;
    this.clearErrors();
  }

  openEditModal(batch: Batch): void {
    this.modalMode = 'edit';
    this.selectedBatch = batch;
    this.formName = this.getBatchName(batch);
    this.formCourseId = batch.courseId ?? '';
    this.formTeacherId = batch.teacherId ?? '';
    this.formStartDate = batch.startDate
      ? batch.startDate.substring(0, 10)
      : '';
    this.formEndDate = batch.endDate ? batch.endDate.substring(0, 10) : '';
    this.formMaxStudents = batch.maxStudents ?? 30;
    this.formIsActive = batch.isActive ?? true;
    this.clearErrors();
  }

  openViewModal(batch: Batch): void {
    this.modalMode = 'view';
    this.selectedBatch = batch;
  }

  openDeleteModal(batch: Batch): void {
    this.modalMode = 'delete';
    this.selectedBatch = batch;
  }

  openManageStudents(batch: Batch): void {
    this.modalMode = 'manage-students';
    this.selectedBatch = batch;
    this.memberSearchQuery = '';
  }

  openManageTeachers(batch: Batch): void {
    this.modalMode = 'manage-teachers';
    this.selectedBatch = batch;
    this.memberSearchQuery = '';
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedBatch = null;
    this.memberSearchQuery = '';
    this.clearErrors();
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') this.createBatch();
    else if (this.modalMode === 'edit') this.updateBatch();
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;
    if (!this.formName.trim()) {
      this.nameError = 'Batch name is required.';
      valid = false;
    }
    if (!this.formTeacherId) {
      this.teacherError = 'Please select a teacher.';
      valid = false;
    }
    if (!this.formStartDate) {
      this.startDateError = 'Start date is required.';
      valid = false;
    }
    if (!this.formEndDate) {
      this.endDateError = 'End date is required.';
      valid = false;
    } else if (
      this.formStartDate &&
      this.formEndDate &&
      this.formEndDate <= this.formStartDate
    ) {
      this.endDateError = 'End date must be after start date.';
      valid = false;
    }
    return valid;
  }

  clearErrors(): void {
    this.nameError = '';
    this.teacherError = '';
    this.startDateError = '';
    this.endDateError = '';
  }

  // ─── Member helpers ───────────────────────────────────────────

  isStudentInBatch(studentId: string): boolean {
    return (this.selectedBatch?.students ?? []).some((s) => s.id === studentId);
  }

  isTeacherInBatch(teacherId: string): boolean {
    return (this.selectedBatch?.teachers ?? []).some((t) => t.id === teacherId);
  }

  get filteredMemberStudents(): UserRef[] {
    const q = this.memberSearchQuery.toLowerCase().trim();
    return q
      ? this.allStudents.filter(
          (s) =>
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q),
        )
      : this.allStudents;
  }

  get filteredMemberTeachers(): UserRef[] {
    const q = this.memberSearchQuery.toLowerCase().trim();
    return q
      ? this.allTeachers.filter(
          (t) =>
            `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
            t.email?.toLowerCase().includes(q),
        )
      : this.allTeachers;
  }

  // ─── Display helpers ─────────────────────────────────────────

  getBatchName(batch: Batch): string {
    return batch.batchName || batch.name || '—';
  }

  getCourseTitle(courseId: string): string {
    return this.courses.find((c) => c.id === courseId)?.title ?? '—';
  }
  getTeacherName(batch: Batch): string {
    if (batch.teacher)
      return `${batch.teacher.firstName} ${batch.teacher.lastName}`.trim();
    const t = this.allTeachers.find((u) => u.id === batch.teacherId);
    return t ? `${t.firstName} ${t.lastName}`.trim() : '—';
  }

  getUserInitials(u: UserRef): string {
    return `${(u.firstName || '').charAt(0)}${(u.lastName || '').charAt(0)}`.toUpperCase();
  }

  getUserFullName(u: UserRef): string {
    return `${u.firstName || ''} ${u.lastName || ''}`.trim();
  }

  getStatusBadge(batch: Batch): string {
    if (!batch.isActive) return 'pg-badge pg-badge--gray';
    const now = new Date();
    const start = new Date(batch.startDate);
    const end = new Date(batch.endDate);
    if (now < start) return 'pg-badge pg-badge--blue';
    if (now > end) return 'pg-badge pg-badge--gray';
    return 'pg-badge pg-badge--green';
  }

  getStatusLabel(batch: Batch): string {
    if (!batch.isActive) return 'Inactive';
    const now = new Date();
    const start = new Date(batch.startDate);
    const end = new Date(batch.endDate);
    if (now < start) return 'Upcoming';
    if (now > end) return 'Completed';
    return 'Active';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  onSearch(): void {
    this.applyFilters();
  }
  onStatusFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.batches];
    if (this.statusFilter) {
      list = list.filter(
        (b) => this.getStatusLabel(b).toLowerCase() === this.statusFilter,
      );
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (b) =>
          this.getBatchName(b).toLowerCase().includes(q) ||
          this.getTeacherName(b).toLowerCase().includes(q),
      );
    }
    this.filteredBatches = list;
  }

  get totalActive(): number {
    return this.batches.filter((b) => this.getStatusLabel(b) === 'Active')
      .length;
  }
  get totalUpcoming(): number {
    return this.batches.filter((b) => this.getStatusLabel(b) === 'Upcoming')
      .length;
  }
  get totalCompleted(): number {
    return this.batches.filter((b) => this.getStatusLabel(b) === 'Completed')
      .length;
  }
}

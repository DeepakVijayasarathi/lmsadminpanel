import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionService } from '../../../auth/permission.service';
import { Router } from '@angular/router';

const BASE_URL = environment.apiUrl;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Class {
  id: string;
  name: string;
  boardId: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  classId?: string;
  category?: string;
  level?: string;
  isPublished?: boolean;
  durationHours?: number;
  durationInMonths?: number;
  price?: number;
  isPartialAllowed?: boolean;
  installmentCount?: number | null;
  createdAt?: string;
}

export interface CoursePayload {
  classId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  level: string;
  durationHours: number;
  durationInMonths: number;
  price: number;
  isPartialAllowed: boolean;
  installmentCount: number | null;
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | 'publish' | null;

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-courses',
  standalone: false,
  templateUrl: './courses.component.html',
  styleUrls: ['../../../shared-page.css', './courses.component.css'],
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  classes: Class[] = [];
  boards: Board[] = [];

  searchQuery: string = '';
  statusFilter: string = '';
  isLoading: boolean = false;

  pageSize = 10;
  currentPage = 1;

  get pagedCourses(): Course[] {
    return this.filteredCourses.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCourses.length / this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // ── Modal state ────────────────────────────────────────────────
  modalMode: ModalMode = null;
  selectedCourse: Course | null = null;

  // ── Form fields ────────────────────────────────────────────────
  formClassId: string = '';
  formTitle: string = '';
  formDescription: string = '';
  formThumbnailUrl: string = '';
  formCategory: string = '';
  formLevel: string = '';
  formIsPublished: boolean = false;
  formDurationHours: number = 1;
  formDurationInMonths: number = 1;
  formPrice: number = 0;
  formIsPartialAllowed: boolean = false;
  formInstallmentCount: number | null = null;

  // ── Validation ─────────────────────────────────────────────────
  titleError: string = '';
  priceError: string = '';
  classError: string = '';

  // ── Constants ──────────────────────────────────────────────────
  readonly LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
  readonly CATEGORIES = [
    'Mathematics',
    'Science',
    'Technology',
    'Engineering',
    'Arts',
    'Language',
    'Social Studies',
    'Other',
  ];

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadBoards();
    this.loadClasses();
    this.loadCourses();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ════════════════════════════════════════════════════════════════
  //  API CALLS
  // ════════════════════════════════════════════════════════════════

  /** GET /class */
  loadBoards(): void {
    this.httpService.getData(BASE_URL, '/board').subscribe({
      next: (res: any) => {
        this.boards = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {
        this.commonService.error('Failed to load boards.');
      },
    });
  }

  loadClasses(): void {
    this.httpService.getData(BASE_URL, '/class').subscribe({
      next: (res: any) => {
        this.classes = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {
        this.commonService.error('Failed to load classes.');
      },
    });
  }

  /** GET /courses */
  loadCourses(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/courses').subscribe({
      next: (res: any) => {
        this.courses = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load courses.');
        this.isLoading = false;
      },
    });
  }

  /** GET /courses/{id} */
  getCourseById(id: string): void {
    this.httpService.getData(BASE_URL, `/courses/${id}`).subscribe({
      next: (res: any) => {
        this.selectedCourse = res?.data ?? res;
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to load course details.',
        );
      },
    });
  }

  /** POST /courses */
  createCourse(): void {
    const payload: CoursePayload = this.buildPayload();
    this.httpService.postData(BASE_URL, '/courses', payload).subscribe({
      next: () => {
        this.commonService.success(
          `Course "${payload.title}" created successfully.`,
        );
        this.closeModal();
        this.loadCourses();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to create course.',
        );
      },
    });
  }

  /** PUT /courses/{id} */
  updateCourse(): void {
    if (!this.selectedCourse) return;
    const payload: CoursePayload = this.buildPayload();
    this.httpService
      .putData(BASE_URL, `/courses/${this.selectedCourse.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Course "${payload.title}" updated successfully.`,
          );
          this.closeModal();
          this.loadCourses();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to update course.',
          );
        },
      });
  }

  /** DELETE /courses/{id} */
  deleteCourse(): void {
    if (!this.selectedCourse) return;
    this.httpService
      .deleteData(BASE_URL, `/courses/${this.selectedCourse.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Course "${this.selectedCourse!.title}" deleted.`,
          );
          this.closeModal();
          this.loadCourses();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to delete course.',
          );
        },
      });
  }

  /** PUT /courses/{id}/publish */
  publishCourse(course: Course): void {
    this.httpService
      .putData(BASE_URL, `/courses/${course.id}/publish`, {})
      .subscribe({
        next: () => {
          this.commonService.success(`"${course.title}" published.`);
          this.closeModal();
          this.loadCourses();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to publish course.',
          );
        },
      });
  }

  /** PUT /courses/{id}/unpublish */
  unpublishCourse(course: Course): void {
    this.httpService
      .putData(BASE_URL, `/courses/${course.id}/unpublish`, {})
      .subscribe({
        next: () => {
          this.commonService.warning(`"${course.title}" unpublished.`);
          this.closeModal();
          this.loadCourses();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to unpublish course.',
          );
        },
      });
  }

  // ════════════════════════════════════════════════════════════════
  //  MODAL HELPERS
  // ════════════════════════════════════════════════════════════════

  openCreateModal(): void {
    this.resetForm();
    this.selectedCourse = null;
    this.modalMode = 'create';
  }

  openEditModal(course: Course): void {
    this.selectedCourse = course;
    this.formClassId = course.classId ?? '';
    this.formTitle = course.title;
    this.formDescription = course.description ?? '';
    this.formThumbnailUrl = course.thumbnailUrl ?? '';
    this.formCategory = course.category ?? '';
    this.formLevel = course.level ?? '';
    this.formIsPublished = course.isPublished ?? false;
    this.formDurationHours = course.durationHours ?? 1;
    this.formDurationInMonths = course.durationInMonths ?? 1;
    this.formPrice = course.price ?? 0;
    this.formIsPartialAllowed = course.isPartialAllowed ?? false;
    this.formInstallmentCount = course.installmentCount ?? null;
    this.titleError = '';
    this.priceError = '';
    this.classError = '';
    this.modalMode = 'edit';
  }

  openViewModal(course: Course): void {
    this.selectedCourse = course;
    this.modalMode = 'view';
  }

  openDeleteModal(course: Course): void {
    this.selectedCourse = course;
    this.modalMode = 'delete';
  }

  openPublishModal(course: Course): void {
    this.selectedCourse = course;
    this.modalMode = 'publish';
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedCourse = null;
    this.titleError = '';
    this.priceError = '';
    this.classError = '';
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') this.createCourse();
    else if (this.modalMode === 'edit') this.updateCourse();
  }

  // ════════════════════════════════════════════════════════════════
  //  FORM UTILITIES
  // ════════════════════════════════════════════════════════════════

  private buildPayload(): CoursePayload {
    return {
      classId: this.formClassId,
      title: this.formTitle.trim(),
      description: this.formDescription.trim(),
      thumbnailUrl: this.formThumbnailUrl.trim(),
      category: this.formCategory.trim(),
      level: this.formLevel.trim(),
      durationHours: this.formDurationHours,
      durationInMonths: this.formDurationInMonths,
      price: this.formPrice,
      isPartialAllowed: this.formIsPartialAllowed,
      installmentCount: this.formIsPartialAllowed
        ? this.formInstallmentCount
        : null,
    };
  }

  validateForm(): boolean {
    this.titleError = '';
    this.priceError = '';
    this.classError = '';
    let valid = true;

    if (!this.formClassId) {
      this.classError = 'Please select a class.';
      valid = false;
    }

    if (!this.formTitle.trim()) {
      this.titleError = 'Course title is required.';
      valid = false;
    } else {
      const duplicate = this.courses.find(
        (c) =>
          c.title.toLowerCase() === this.formTitle.trim().toLowerCase() &&
          c.id !== this.selectedCourse?.id,
      );
      if (duplicate) {
        this.titleError = 'A course with this title already exists.';
        valid = false;
      }
    }

    if (this.formPrice == null || this.formPrice < 0) {
      this.priceError = 'Price must be 0 or greater.';
      valid = false;
    }

    return valid;
  }

  resetForm(): void {
    this.formClassId = '';
    this.formTitle = '';
    this.formDescription = '';
    this.formThumbnailUrl = '';
    this.formCategory = '';
    this.formLevel = '';
    this.formIsPublished = false;
    this.formDurationHours = 1;
    this.formDurationInMonths = 1;
    this.formPrice = 0;
    this.formIsPartialAllowed = false;
    this.formInstallmentCount = null;
    this.titleError = '';
    this.priceError = '';
    this.classError = '';
  }

  // ════════════════════════════════════════════════════════════════
  //  FILTERS & DISPLAY HELPERS
  // ════════════════════════════════════════════════════════════════

  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.courses];

    if (this.statusFilter === 'published') {
      list = list.filter((c) => c.isPublished);
    } else if (this.statusFilter === 'unpublished') {
      list = list.filter((c) => !c.isPublished);
    }

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q),
      );
    }

    this.filteredCourses = list;
    this.currentPage = 1;
  }

  getClassName(classId?: string): string {
    if (!classId) return '—';

    const cls = this.classes.find((c) => c.id === classId);
    if (!cls) return '—';

    const board = this.boards.find((b) => b.id === cls.boardId);

    return board ? `${board.name} - ${cls.name}` : cls.name;
  }

  getBoardClassName(cls: Class): string {
    const board = this.boards.find((b) => b.id === cls.boardId);
    return board ? `${board.name} - ${cls.name}` : cls.name;
  }

  getStatusBadge(course: Course): string {
    return course.isPublished
      ? 'pg-badge pg-badge--green'
      : 'pg-badge pg-badge--yellow';
  }

  getStatusLabel(course: Course): string {
    return course.isPublished ? 'Published' : 'Unpublished';
  }

  hasThumbnail(course: Course): boolean {
    return !!course.thumbnailUrl && !course.thumbnailUrl.startsWith('#');
  }

  getThumbInitial(course: Course): string {
    return (course.title || '?').charAt(0).toUpperCase();
  }

  formatCurrency(amount?: number): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  get totalPublished(): number {
    return this.courses.filter((c) => c.isPublished).length;
  }

  get totalUnpublished(): number {
    return this.courses.filter((c) => !c.isPublished).length;
  }
}

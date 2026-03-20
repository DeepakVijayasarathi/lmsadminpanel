import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

// ─── Interfaces ───────────────────────────────────────────────────────────────

/**
 * Course model — mirrors the API response shape.
 * The API uses `price` (not totalAmount / discountAmount).
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category?: string;
  level?: string;
  isPublished?: boolean;
  durationHours?: number;
  durationInMonths?: number;
  price?: number;               // ← API field name
  isPartialAllowed?: boolean;
  installmentCount?: number | null;
  createdAt?: string;
}

/**
 * Payload for POST /courses  and  PUT /courses/{id}
 * Matches the curl bodies exactly.
 */
export interface CoursePayload {
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  level: string;
  durationHours: number;
  durationInMonths: number;
  price: number;                // ← API field name
  isPartialAllowed: boolean;
  installmentCount: number | null;
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

  searchQuery: string = '';
  statusFilter: string = '';
  isLoading: boolean = false;

  // ── Modal state ────────────────────────────────────────────────
  modalMode: ModalMode = null;
  selectedCourse: Course | null = null;

  // ── Form fields ────────────────────────────────────────────────
  formTitle: string = '';
  formDescription: string = '';
  formThumbnailUrl: string = '';
  formCategory: string = '';
  formLevel: string = '';
  formIsPublished: boolean = false;
  formDurationHours: number = 1;
  formDurationInMonths: number = 1;
  formPrice: number = 0;        // ← replaces formTotalAmount
  formIsPartialAllowed: boolean = false;
  formInstallmentCount: number | null = null;

  // ── Validation ─────────────────────────────────────────────────
  titleError: string = '';
  priceError: string = '';      // ← replaces totalAmountError

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
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  // ════════════════════════════════════════════════════════════════
  //  API CALLS
  // ════════════════════════════════════════════════════════════════

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
        // Useful when you need a fresh detail view.
        // Currently openViewModal uses the list data directly;
        // swap to this call if you need server-fresh data.
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
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') this.createCourse();
    else if (this.modalMode === 'edit') this.updateCourse();
  }

  // ════════════════════════════════════════════════════════════════
  //  FORM UTILITIES
  // ════════════════════════════════════════════════════════════════

  /**
   * Builds the POST / PUT payload.
   * Both endpoints share the same body shape per the API spec.
   */
  private buildPayload(): CoursePayload {
    return {
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
    let valid = true;

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

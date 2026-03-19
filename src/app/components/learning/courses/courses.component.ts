import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  isPublished?: boolean;
  durationHours?: number;
  createdAt?: string;
}

export interface CoursePayload {
  title: string;
  description: string;
  thumbnailUrl: string;
}

export interface CourseUpdatePayload {
  title: string;
  description: string;
  thumbnailUrl: string;
  isPublished: boolean;
  durationHours: number;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | 'publish' | null;

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

  // Modal
  modalMode: ModalMode = null;
  selectedCourse: Course | null = null;

  // Form fields
  formTitle: string = '';
  formDescription: string = '';
  formThumbnailUrl: string = '';
  formIsPublished: boolean = false;
  formDurationHours: number = 1;

  // Validation
  titleError: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  // ─── API ─────────────────────────────────────────────────────

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

  createCourse(): void {
    const payload: CoursePayload = {
      title: this.formTitle.trim(),
      description: this.formDescription.trim(),
      thumbnailUrl: this.formThumbnailUrl.trim(),
    };
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

  updateCourse(): void {
    if (!this.selectedCourse) return;
    const payload: CourseUpdatePayload = {
      title: this.formTitle.trim(),
      description: this.formDescription.trim(),
      thumbnailUrl: this.formThumbnailUrl.trim(),
      isPublished: this.formIsPublished,
      durationHours: this.formDurationHours,
    };
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

  // ─── Modals ──────────────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedCourse = null;
    this.formTitle = '';
    this.formDescription = '';
    this.formThumbnailUrl = '';
    this.formIsPublished = false;
    this.formDurationHours = 1;
    this.titleError = '';
  }

  openEditModal(course: Course): void {
    this.modalMode = 'edit';
    this.selectedCourse = course;
    this.formTitle = course.title;
    this.formDescription = course.description;
    this.formThumbnailUrl = course.thumbnailUrl;
    this.formIsPublished = course.isPublished ?? false;
    this.formDurationHours = course.durationHours ?? 1;
    this.titleError = '';
  }

  openViewModal(course: Course): void {
    this.modalMode = 'view';
    this.selectedCourse = course;
  }

  openDeleteModal(course: Course): void {
    this.modalMode = 'delete';
    this.selectedCourse = course;
  }

  openPublishModal(course: Course): void {
    this.modalMode = 'publish';
    this.selectedCourse = course;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedCourse = null;
    this.titleError = '';
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') this.createCourse();
    else if (this.modalMode === 'edit') this.updateCourse();
  }

  validateForm(): boolean {
    this.titleError = '';
    if (!this.formTitle.trim()) {
      this.titleError = 'Course title is required.';
      return false;
    }
    const duplicate = this.courses.find(
      (c) =>
        c.title.toLowerCase() === this.formTitle.trim().toLowerCase() &&
        c.id !== this.selectedCourse?.id,
    );
    if (duplicate) {
      this.titleError = 'A course with this title already exists.';
      return false;
    }
    return true;
  }

  // ─── Filters & Helpers ───────────────────────────────────────

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
          c.description?.toLowerCase().includes(q),
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

  get totalPublished(): number {
    return this.courses.filter((c) => c.isPublished).length;
  }
  get totalUnpublished(): number {
    return this.courses.filter((c) => !c.isPublished).length;
  }
}

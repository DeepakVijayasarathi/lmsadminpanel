import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionService } from '../../../auth/permission.service';

const BASE_URL = environment.apiUrl;

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  classId: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string | null;
  subjectId: string;
  subject?: Subject;
}

export interface TopicPayload {
  name: string;
  description: string | null;
  subjectId: string;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-topics',
  standalone: false,
  templateUrl: './topics.component.html',
  styleUrls: ['../../../shared-page.css', './topics.component.css']
})
export class TopicsComponent implements OnInit {

  topics: Topic[] = [];
  filteredTopics: Topic[] = [];
  subjects: Subject[] = [];

  searchQuery: string = '';
  selectedSubjectFilter: string = '';
  isLoading: boolean = false;

  // Modal state
  modalMode: ModalMode = null;
  selectedTopic: Topic | null = null;

  // Form fields
  formName: string = '';
  formDescription: string = '';
  formSubjectId: string = '';

  // Validation
  nameError: string = '';
  subjectError: string = '';

  pageSize = 10;
  currentPage = 1;

  get pagedTopics(): Topic[] {
    return this.filteredTopics.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTopics.length / this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSubjects();
    this.loadTopics();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ─── API Calls ──────────────────────────────────────────────

  loadSubjects(): void {
    this.httpService.getData(BASE_URL, '/subject').subscribe({
      next: (res: any) => {
        this.subjects = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {
        this.commonService.error('Failed to load subjects.');
      }
    });
  }

  loadTopics(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/topic').subscribe({
      next: (res: any) => {
        this.topics = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load topics.');
        this.isLoading = false;
      }
    });
  }

  createTopic(): void {
    const payload: TopicPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || null,
      subjectId: this.formSubjectId
    };
    this.httpService.postData(BASE_URL, '/topic', payload).subscribe({
      next: () => {
        this.commonService.success(`Topic "${payload.name}" created successfully.`);
        this.closeModal();
        this.loadTopics();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to create topic.';
        this.commonService.error(msg);
      }
    });
  }

  updateTopic(): void {
    if (!this.selectedTopic) return;
    const payload: TopicPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim() || null,
      subjectId: this.formSubjectId
    };
    this.httpService.putData(BASE_URL, `/topic/${this.selectedTopic.id}`, payload).subscribe({
      next: () => {
        this.commonService.success(`Topic "${payload.name}" updated successfully.`);
        this.closeModal();
        this.loadTopics();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to update topic.';
        this.commonService.error(msg);
      }
    });
  }

  deleteTopic(): void {
    if (!this.selectedTopic) return;
    this.httpService.deleteData(BASE_URL, `/topic/${this.selectedTopic.id}`).subscribe({
      next: () => {
        this.commonService.success(`Topic "${this.selectedTopic!.name}" deleted successfully.`);
        this.closeModal();
        this.loadTopics();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to delete topic.';
        this.commonService.error(msg);
      }
    });
  }

  // ─── Modal Helpers ───────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedTopic = null;
    this.formName = '';
    this.formDescription = '';
    this.formSubjectId = '';
    this.clearErrors();
  }

  openEditModal(topic: Topic): void {
    this.modalMode = 'edit';
    this.selectedTopic = topic;
    this.formName = topic.name;
    this.formDescription = topic.description ?? '';
    this.formSubjectId = topic.subjectId;
    this.clearErrors();
  }

  openViewModal(topic: Topic): void {
    this.modalMode = 'view';
    this.selectedTopic = topic;
  }

  openDeleteModal(topic: Topic): void {
    this.modalMode = 'delete';
    this.selectedTopic = topic;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedTopic = null;
    this.clearErrors();
  }

  clearErrors(): void {
    this.nameError = '';
    this.subjectError = '';
  }

  // ─── Form Submit ─────────────────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.createTopic();
    } else if (this.modalMode === 'edit') {
      this.updateTopic();
    }
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    const trimmed = this.formName.trim();
    if (!trimmed) {
      this.nameError = 'Topic name is required.';
      valid = false;
    } else {
      const duplicate = this.topics.find(t =>
        t.name.toLowerCase() === trimmed.toLowerCase() &&
        t.subjectId === this.formSubjectId &&
        t.id !== this.selectedTopic?.id
      );
      if (duplicate) {
        this.nameError = 'A topic with this name already exists for the selected subject.';
        valid = false;
      }
    }

    if (!this.formSubjectId) {
      this.subjectError = 'Please select a subject.';
      valid = false;
    }

    return valid;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getSubjectName(subjectId: string): string {
    return this.subjects.find(s => s.id === subjectId)?.name ?? '—';
  }

  get subjectFilterOptions(): Subject[] {
    const ids = [...new Set(this.topics.map(t => t.subjectId))];
    return this.subjects.filter(s => ids.includes(s.id));
  }

  onSearch(): void { this.applyFilters(); }
  onSubjectFilter(): void { this.applyFilters(); }

  applyFilters(): void {
    let list = [...this.topics];
    if (this.selectedSubjectFilter) {
      list = list.filter(t => t.subjectId === this.selectedSubjectFilter);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        this.getSubjectName(t.subjectId).toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }
    this.filteredTopics = list;
    this.currentPage = 1;
  }
}

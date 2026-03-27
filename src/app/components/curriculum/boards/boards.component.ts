import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionService } from '../../../auth/permission.service';

const BASE_URL = environment.apiUrl;

export interface Board {
  id: string;
  name: string;
  description: string;
}

export interface BoardPayload {
  name: string;
  description: string;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-boards',
  standalone: false,
  templateUrl: './boards.component.html',
  styleUrls: ['../../../shared-page.css', './boards.component.css'],
})
export class BoardsComponent implements OnInit {
  boards: Board[] = [];
  filteredBoards: Board[] = [];
  searchQuery: string = '';
  isLoading: boolean = false;

  // Modal state
  modalMode: ModalMode = null;
  selectedBoard: Board | null = null;

  // Form fields
  formName: string = '';
  formDescription: string = '';

  // Validation
  nameError: string = '';

  pageSize = 10;
  currentPage = 1;
  
  get pagedBoards(): Board[] {
    return this.filteredBoards.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredBoards.length / this.pageSize);
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
    this.loadBoards();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ─── API Calls ──────────────────────────────────────────────

  loadBoards(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/board').subscribe({
      next: (res: any) => {
        this.boards = Array.isArray(res) ? res : (res?.data ?? []);
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load boards.');
        this.isLoading = false;
      },
    });
  }

  createBoard(): void {
    const payload: BoardPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim(),
    };
    this.httpService.postData(BASE_URL, '/board', payload).subscribe({
      next: () => {
        this.commonService.success(
          `Board "${payload.name}" created successfully.`,
        );
        this.closeModal();
        this.loadBoards();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to create board.';
        this.commonService.error(msg);
      },
    });
  }

  updateBoard(): void {
    if (!this.selectedBoard) return;
    const payload: BoardPayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim(),
    };
    this.httpService
      .putData(BASE_URL, `/board/${this.selectedBoard.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Board "${payload.name}" updated successfully.`,
          );
          this.closeModal();
          this.loadBoards();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to update board.';
          this.commonService.error(msg);
        },
      });
  }

  deleteBoard(): void {
    if (!this.selectedBoard) return;
    this.httpService
      .deleteData(BASE_URL, `/board/${this.selectedBoard.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Board "${this.selectedBoard!.name}" deleted successfully.`,
          );
          this.closeModal();
          this.loadBoards();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to delete board.';
          this.commonService.error(msg);
        },
      });
  }

  // ─── Modal Helpers ───────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedBoard = null;
    this.formName = '';
    this.formDescription = '';
    this.nameError = '';
  }

  openEditModal(board: Board): void {
    this.modalMode = 'edit';
    this.selectedBoard = board;
    this.formName = board.name;
    this.formDescription = board.description;
    this.nameError = '';
  }

  openViewModal(board: Board): void {
    this.modalMode = 'view';
    this.selectedBoard = board;
  }

  openDeleteModal(board: Board): void {
    this.modalMode = 'delete';
    this.selectedBoard = board;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedBoard = null;
    this.nameError = '';
  }

  // ─── Form Submit ─────────────────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.createBoard();
    } else if (this.modalMode === 'edit') {
      this.updateBoard();
    }
  }

  validateForm(): boolean {
    this.nameError = '';
    const trimmed = this.formName.trim();

    if (!trimmed) {
      this.nameError = 'Board name is required.';
      return false;
    }

    const duplicate = this.boards.find(
      (b) =>
        b.name.toLowerCase() === trimmed.toLowerCase() &&
        b.id !== this.selectedBoard?.id,
    );
    if (duplicate) {
      this.nameError = 'A board with this name already exists.';
      return false;
    }

    return true;
  }

  // ─── Search ──────────────────────────────────────────────────

  onSearch(): void {
    this.applySearch();
  }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredBoards = q
      ? this.boards.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.description?.toLowerCase().includes(q),
        )
      : [...this.boards];
    this.currentPage = 1;
  }
}

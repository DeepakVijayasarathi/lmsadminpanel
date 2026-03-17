import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface MenuItem {
  id: string;
  name: string;
  url: string;
  icon: string;
  parentId: string | null;
  sequence: number;
}

export interface MenuPayload {
  name: string;
  url: string;
  icon: string;
  parentId: string | null;
  sequence: number;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-menu',
  standalone: false,
  templateUrl: './menu.component.html',
  styleUrls: ['../../../shared-page.css', './menu.component.css'],
})
export class MenuComponent implements OnInit {
  menus: MenuItem[] = [];
  filteredMenus: MenuItem[] = [];
  searchQuery: string = '';
  isLoading: boolean = false;

  // Modal state
  modalMode: ModalMode = null;
  selectedMenu: MenuItem | null = null;

  // Form fields
  formName: string = '';
  formUrl: string = '';
  formIcon: string = '';
  formParentId: string | null = null;
  formSequence: number = 1;

  // Validation
  nameError: string = '';
  urlError: string = '';
  sequenceError: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadMenus();
  }

  // ─── API Calls ──────────────────────────────────────────────

  loadMenus(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/menu').subscribe({
      next: (res: any) => {
        this.menus = Array.isArray(res) ? res : (res?.data ?? []);
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load menus.');
        this.isLoading = false;
      },
    });
  }

  createMenu(): void {
    const payload: MenuPayload = {
      name: this.formName.trim(),
      url: this.formUrl.trim(),
      icon: this.formIcon.trim(),
      parentId: this.formParentId || null,
      sequence: Number(this.formSequence),
    };
    this.httpService.postData(BASE_URL, '/menu', payload).subscribe({
      next: () => {
        this.commonService.success(
          `Menu "${payload.name}" created successfully.`,
        );
        this.closeModal();
        this.loadMenus();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to create menu.';
        this.commonService.error(msg);
      },
    });
  }

  updateMenu(): void {
    if (!this.selectedMenu) return;
    const payload: MenuPayload = {
      name: this.formName.trim(),
      url: this.formUrl.trim(),
      icon: this.formIcon.trim(),
      parentId: this.formParentId || null,
      sequence: Number(this.formSequence),
    };
    this.httpService
      .putData(BASE_URL, `/menu/${this.selectedMenu.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Menu "${payload.name}" updated successfully.`,
          );
          this.closeModal();
          this.loadMenus();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to update menu.';
          this.commonService.error(msg);
        },
      });
  }

  deleteMenu(): void {
    if (!this.selectedMenu) return;
    this.httpService
      .deleteData(BASE_URL, `/menu/${this.selectedMenu.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Menu "${this.selectedMenu!.name}" deleted successfully.`,
          );
          this.closeModal();
          this.loadMenus();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to delete menu.';
          this.commonService.error(msg);
        },
      });
  }

  // ─── Modal Helpers ───────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedMenu = null;
    this.formName = '';
    this.formUrl = '';
    this.formIcon = '';
    this.formParentId = null;
    this.formSequence = this.nextSequence();
    this.clearErrors();
  }

  openEditModal(menu: MenuItem): void {
    this.modalMode = 'edit';
    this.selectedMenu = menu;
    this.formName = menu.name;
    this.formUrl = menu.url;
    this.formIcon = menu.icon;
    this.formParentId = menu.parentId;
    this.formSequence = menu.sequence;
    this.clearErrors();
  }

  openViewModal(menu: MenuItem): void {
    this.modalMode = 'view';
    this.selectedMenu = menu;
  }

  openDeleteModal(menu: MenuItem): void {
    this.modalMode = 'delete';
    this.selectedMenu = menu;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedMenu = null;
    this.clearErrors();
  }

  clearErrors(): void {
    this.nameError = '';
    this.urlError = '';
    this.sequenceError = '';
  }

  // ─── Form Submit ─────────────────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.createMenu();
    } else if (this.modalMode === 'edit') {
      this.updateMenu();
    }
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.formName.trim()) {
      this.nameError = 'Menu name is required.';
      valid = false;
    } else {
      const duplicate = this.menus.find(
        (m) =>
          m.name.toLowerCase() === this.formName.trim().toLowerCase() &&
          m.id !== this.selectedMenu?.id,
      );
      if (duplicate) {
        this.nameError = 'A menu with this name already exists.';
        valid = false;
      }
    }

    if (!this.formUrl.trim()) {
      this.urlError = 'URL / route is required.';
      valid = false;
    }

    if (!this.formSequence || this.formSequence < 1) {
      this.sequenceError = 'Sequence must be at least 1.';
      valid = false;
    }

    return valid;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  nextSequence(): number {
    if (!this.menus.length) return 1;
    return Math.max(...this.menus.map((m) => m.sequence)) + 1;
  }

  getParentName(parentId: string | null): string {
    if (!parentId) return '—';
    return this.menus.find((m) => m.id === parentId)?.name ?? parentId;
  }

  // Only top-level menus (no parent) as parent options; exclude self on edit
  parentOptions(): MenuItem[] {
    return this.menus.filter(
      (m) => m.parentId === null && m.id !== this.selectedMenu?.id,
    );
  }

  isParentMenu(menu: MenuItem): boolean {
    return this.menus.some((m) => m.parentId === menu.id);
  }

  childCount(menu: MenuItem): number {
    return this.menus.filter((m) => m.parentId === menu.id).length;
  }

  childrenOf(menu: MenuItem): MenuItem[] {
    return this.menus
      .filter((m) => m.parentId === menu.id)
      .sort((a, b) => a.sequence - b.sequence);
  }

  // Top-level menus sorted by sequence
  get topLevelMenus(): MenuItem[] {
    return this.filteredMenus
      .filter((m) => m.parentId === null)
      .sort((a, b) => a.sequence - b.sequence);
  }

  onSearch(): void {
    this.applySearch();
  }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredMenus = q
      ? this.menus.filter(
          (m) =>
            m.name.toLowerCase().includes(q) || m.url.toLowerCase().includes(q),
        )
      : [...this.menus];
  }

  get totalParents(): number {
    return this.menus.filter((m) => m.parentId === null).length;
  }

  get totalChildren(): number {
    return this.menus.filter((m) => m.parentId !== null).length;
  }
}

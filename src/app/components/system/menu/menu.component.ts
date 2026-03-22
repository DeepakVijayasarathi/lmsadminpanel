// menu.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface MenuItem {
  id: string;
  name: string;
  url: string | null;
  icon: string;
  menuType: string;
  parentId: string | null;
  sequence: number;
  isVisible: boolean;
}

export interface MenuPayload {
  name: string;
  url: string | null;
  icon: string;
  parentId: string | null;
  sequence: number;
  isVisible: boolean;
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
  formMenuType: string = 'Menu';
  formParentId: string | null = null;
  formSequence: number = 1;
  formIsVisible: boolean = true;

  // Validation errors
  nameError: string = '';
  urlError: string = '';
  sequenceError: string = '';
  menuTypeError: string = '';

  // Menu type options
  readonly menuTypeOptions = ['Menu', 'Header', 'Footer', 'Sidebar', 'Utility'];

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadMenus();
  }

  // ─── API ─────────────────────────────────────────────────────

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
    const payload = this.buildPayload();
    this.httpService.postData(BASE_URL, '/menu', payload).subscribe({
      next: () => {
        this.commonService.success(`Menu "${payload.name}" created successfully.`);
        this.closeModal();
        this.loadMenus();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to create menu.');
      },
    });
  }

  updateMenu(): void {
    if (!this.selectedMenu) return;
    const payload = this.buildPayload();
    this.httpService.putData(BASE_URL, `/menu/${this.selectedMenu.id}`, payload).subscribe({
      next: () => {
        this.commonService.success(`Menu "${payload.name}" updated successfully.`);
        this.closeModal();
        this.loadMenus();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to update menu.');
      },
    });
  }

  deleteMenu(): void {
    if (!this.selectedMenu) return;
    this.httpService.deleteData(BASE_URL, `/menu/${this.selectedMenu.id}`).subscribe({
      next: () => {
        this.commonService.success(`Menu "${this.selectedMenu!.name}" deleted.`);
        this.closeModal();
        this.loadMenus();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to delete menu.');
      },
    });
  }

  private buildPayload(): MenuPayload {
    return {
      name:      this.formName.trim(),
      url:       this.formUrl.trim() || null,
      icon:      this.formIcon.trim(),
      parentId:  this.formParentId || null,
      sequence:  Number(this.formSequence),
      isVisible: this.formIsVisible,
    };
  }

  // ─── Modal helpers ────────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode    = 'create';
    this.selectedMenu = null;
    this.formName     = '';
    this.formUrl      = '';
    this.formIcon     = '';
    this.formMenuType = 'Menu';
    this.formParentId = null;
    this.formSequence = this.nextSequence();
    this.formIsVisible = true;
    this.clearErrors();
  }

  openEditModal(menu: MenuItem): void {
    this.modalMode     = 'edit';
    this.selectedMenu  = menu;
    this.formName      = menu.name;
    this.formUrl       = menu.url ?? '';
    this.formIcon      = menu.icon;
    this.formMenuType  = menu.menuType || 'Menu';
    this.formParentId  = menu.parentId;
    this.formSequence  = menu.sequence;
    this.formIsVisible = menu.isVisible ?? true;
    this.clearErrors();
  }

  openViewModal(menu: MenuItem): void {
    this.modalMode    = 'view';
    this.selectedMenu = menu;
  }

  openDeleteModal(menu: MenuItem): void {
    this.modalMode    = 'delete';
    this.selectedMenu = menu;
  }

  closeModal(): void {
    this.modalMode    = null;
    this.selectedMenu = null;
    this.clearErrors();
  }

  clearErrors(): void {
    this.nameError     = '';
    this.urlError      = '';
    this.sequenceError = '';
    this.menuTypeError = '';
  }

  // ─── Form submit & validation ─────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;
    this.modalMode === 'create' ? this.createMenu() : this.updateMenu();
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.formName.trim()) {
      this.nameError = 'Menu name is required.';
      valid = false;
    } else {
      const duplicate = this.menus.find(
        m => m.name.toLowerCase() === this.formName.trim().toLowerCase()
          && m.id !== this.selectedMenu?.id,
      );
      if (duplicate) {
        this.nameError = 'A menu with this name already exists.';
        valid = false;
      }
    }

    if (!this.formMenuType) {
      this.menuTypeError = 'Menu type is required.';
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
    return Math.max(...this.menus.map(m => m.sequence)) + 1;
  }

  getParentName(parentId: string | null): string {
    if (!parentId) return '—';
    return this.menus.find(m => m.id === parentId)?.name ?? '—';
  }

  parentOptions(): MenuItem[] {
    return this.menus.filter(
      m => m.parentId === null && m.id !== this.selectedMenu?.id,
    );
  }

  childCount(menu: MenuItem): number {
    return this.menus.filter(m => m.parentId === menu.id).length;
  }

  childrenOf(menu: MenuItem): MenuItem[] {
    return this.menus
      .filter(m => m.parentId === menu.id)
      .sort((a, b) => a.sequence - b.sequence);
  }

  get topLevelMenus(): MenuItem[] {
    return this.filteredMenus
      .filter(m => m.parentId === null)
      .sort((a, b) => a.sequence - b.sequence);
  }

  onSearch(): void { this.applySearch(); }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredMenus = q
      ? this.menus.filter(m =>
          m.name.toLowerCase().includes(q) ||
          (m.url ?? '').toLowerCase().includes(q) ||
          m.menuType.toLowerCase().includes(q),
        )
      : [...this.menus];
  }

  get totalParents(): number  { return this.menus.filter(m => !m.parentId).length; }
  get totalChildren(): number { return this.menus.filter(m =>  m.parentId).length; }

  menuTypeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      Menu:    'pg-badge--indigo',
      Header:  'pg-badge--sky',
      Footer:  'pg-badge--slate',
      Sidebar: 'pg-badge--purple',
      Utility: 'pg-badge--orange',
    };
    return map[type] ?? 'pg-badge--indigo';
  }
}

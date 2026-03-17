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

export interface RolePermission {
  menuId: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface RoleApiResponse {
  id: string;
  name: string;
  description: string;
  permissions: RolePermission[];
}

export interface RolePayload {
  name: string;
  description: string;
  permissions: RolePermission[];
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-roles',
  standalone: false,
  templateUrl: './roles.component.html',
  styleUrls: ['../../../shared-page.css', './roles.component.css'],
})
export class RolesComponent implements OnInit {
  roles: RoleApiResponse[] = [];
  filteredRoles: RoleApiResponse[] = [];
  menus: MenuItem[] = [];
  searchQuery: string = '';
  isLoading: boolean = false;

  // Modal state
  modalMode: ModalMode = null;
  selectedRole: RoleApiResponse | null = null;

  // Form fields
  formName: string = '';
  formDescription: string = '';
  formPermissions: RolePermission[] = [];

  // Validation
  nameError: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadMenus();
    this.loadRoles();
  }

  // ─── API Calls ──────────────────────────────────────────────

  loadMenus(): void {
    this.httpService.getData(BASE_URL, '/menu').subscribe({
      next: (res: any) => {
        this.menus = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {
        this.commonService.error('Failed to load menu items.');
      },
    });
  }

  loadRoles(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/role').subscribe({
      next: (res: any) => {
        this.roles = Array.isArray(res) ? res : (res?.data ?? []);
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load roles.');
        this.isLoading = false;
      },
    });
  }

  createRole(): void {
    const payload: RolePayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim(),
      permissions: this.formPermissions,
    };
    this.httpService.postData(BASE_URL, '/role', payload).subscribe({
      next: () => {
        this.commonService.success(
          `Role "${payload.name}" created successfully.`,
        );
        this.closeModal();
        this.loadRoles();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to create role.';
        this.commonService.error(msg);
      },
    });
  }

  updateRole(): void {
    if (!this.selectedRole) return;
    const payload: RolePayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim(),
      permissions: this.formPermissions,
    };
    this.httpService
      .putData(BASE_URL, `/role/${this.selectedRole.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Role "${payload.name}" updated successfully.`,
          );
          this.closeModal();
          this.loadRoles();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to update role.';
          this.commonService.error(msg);
        },
      });
  }

  deleteRole(): void {
    if (!this.selectedRole) return;
    this.httpService
      .deleteData(BASE_URL, `/role/${this.selectedRole.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Role "${this.selectedRole!.name}" deleted successfully.`,
          );
          this.closeModal();
          this.loadRoles();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to delete role.';
          this.commonService.error(msg);
        },
      });
  }

  // ─── Modal Helpers ───────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedRole = null;
    this.formName = '';
    this.formDescription = '';
    this.formPermissions = this.buildDefaultPermissions();
    this.nameError = '';
  }

  openEditModal(role: RoleApiResponse): void {
    this.modalMode = 'edit';
    this.selectedRole = role;
    this.formName = role.name;
    this.formDescription = role.description;
    this.formPermissions = this.buildPermissionsFromRole(role);
    this.nameError = '';
  }

  openViewModal(role: RoleApiResponse): void {
    this.modalMode = 'view';
    this.selectedRole = role;
    this.formPermissions = this.buildPermissionsFromRole(role);
  }

  openDeleteModal(role: RoleApiResponse): void {
    this.modalMode = 'delete';
    this.selectedRole = role;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedRole = null;
    this.nameError = '';
  }

  // ─── Form Submit ─────────────────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') {
      this.createRole();
    } else if (this.modalMode === 'edit') {
      this.updateRole();
    }
  }

  validateForm(): boolean {
    this.nameError = '';
    const trimmed = this.formName.trim();

    if (!trimmed) {
      this.nameError = 'Role name is required.';
      return false;
    }

    const duplicate = this.roles.find(
      (r) =>
        r.name.toLowerCase() === trimmed.toLowerCase() &&
        r.id !== this.selectedRole?.id,
    );
    if (duplicate) {
      this.nameError = 'A role with this name already exists.';
      return false;
    }

    return true;
  }

  // ─── Permissions Helpers ─────────────────────────────────────

  buildDefaultPermissions(): RolePermission[] {
    return this.menus.map((m) => ({
      menuId: m.id,
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
    }));
  }

  buildPermissionsFromRole(role: RoleApiResponse): RolePermission[] {
    return this.menus.map((m) => {
      const existing = role.permissions?.find((p) => p.menuId === m.id);
      return (
        existing ?? {
          menuId: m.id,
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        }
      );
    });
  }

  getMenuName(menuId: string): string {
    return this.menus.find((m) => m.id === menuId)?.name ?? menuId;
  }

  getPermissionForMenu(menuId: string): RolePermission | undefined {
    return this.formPermissions.find((p) => p.menuId === menuId);
  }

  toggleAllForMenu(menuId: string, checked: boolean): void {
    const perm = this.formPermissions.find((p) => p.menuId === menuId);
    if (perm) {
      perm.canCreate = checked;
      perm.canRead = checked;
      perm.canUpdate = checked;
      perm.canDelete = checked;
    }
  }

  isAllChecked(menuId: string): boolean {
    const perm = this.formPermissions.find((p) => p.menuId === menuId);
    return !!(
      perm?.canCreate &&
      perm?.canRead &&
      perm?.canUpdate &&
      perm?.canDelete
    );
  }

  // Count active permissions for a role
  getActivePermCount(role: RoleApiResponse): number {
    return (role.permissions || []).filter(
      (p) => p.canCreate || p.canRead || p.canUpdate || p.canDelete,
    ).length;
  }

  // ─── Search ──────────────────────────────────────────────────

  onSearch(): void {
    this.applySearch();
  }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredRoles = q
      ? this.roles.filter((r) => r.name.toLowerCase().includes(q))
      : [...this.roles];
  }

  // ─── Badge ───────────────────────────────────────────────────

  roleBadgeClass(name: string): string {
    const map: Record<string, string> = {
      'Super Admin': 'pg-badge--red',
      Admin: 'pg-badge--purple',
      Teacher: 'pg-badge--indigo',
      Student: 'pg-badge--blue',
      Parent: 'pg-badge--green',
    };
    return map[name] || 'pg-badge--gray';
  }
}

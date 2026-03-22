// roles.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface MenuTreeItem {
  id: string;
  name: string;
  url: string | null;
  icon: string;
  menuType: string;
  parentId: string | null;
  sequence: number;
  isVisible: boolean;
  children: MenuTreeItem[];
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
type PermKey   = 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete';

@Component({
  selector: 'app-roles',
  standalone: false,
  templateUrl: './roles.component.html',
  styleUrls: ['../../../shared-page.css', './roles.component.css'],
})
export class RolesComponent implements OnInit {
  roles:         RoleApiResponse[] = [];
  filteredRoles: RoleApiResponse[] = [];
  menuTree:      MenuTreeItem[]    = [];
  flatMenus:     MenuTreeItem[]    = [];

  searchQuery = '';
  isLoading   = false;

  modalMode:    ModalMode              = null;
  selectedRole: RoleApiResponse | null = null;

  formName        = '';
  formDescription = '';
  formPermissions: RolePermission[] = [];
  nameError = '';

  readonly permCols: { key: PermKey; label: string }[] = [
    { key: 'canRead',   label: 'Read'   },
    { key: 'canCreate', label: 'Create' },
    { key: 'canUpdate', label: 'Update' },
    { key: 'canDelete', label: 'Delete' },
  ];

  constructor(
    private commonService: CommonService,
    private httpService:   HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadMenuTree();
    this.loadRoles();
  }

  // ── API ───────────────────────────────────────────────────────────────────

  loadMenuTree(): void {
    this.httpService.getData(BASE_URL, '/role/menu-tree').subscribe({
      next: (res: any) => {
        this.menuTree  = Array.isArray(res) ? res : (res?.data ?? []);
        this.flatMenus = this.flattenTree(this.menuTree);
      },
      error: () => this.commonService.error('Failed to load menu tree.'),
    });
  }

  loadRoles(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/role/role-by-menu').subscribe({
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
    const payload = this.buildPayload();
    this.httpService.postData(BASE_URL, '/role', payload).subscribe({
      next: () => {
        this.commonService.success(`Role "${payload.name}" created.`);
        this.closeModal();
        this.loadRoles();
      },
      error: (err: any) =>
        this.commonService.error(err?.error?.message || 'Failed to create role.'),
    });
  }

  updateRole(): void {
    if (!this.selectedRole) return;
    const payload = this.buildPayload();
    this.httpService
      .putData(BASE_URL, `/role/${this.selectedRole.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(`Role "${payload.name}" updated.`);
          this.closeModal();
          this.loadRoles();
        },
        error: (err: any) =>
          this.commonService.error(err?.error?.message || 'Failed to update role.'),
      });
  }

  deleteRole(): void {
    if (!this.selectedRole) return;
    this.httpService
      .deleteData(BASE_URL, `/role/${this.selectedRole.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(`Role "${this.selectedRole!.name}" deleted.`);
          this.closeModal();
          this.loadRoles();
        },
        error: (err: any) =>
          this.commonService.error(err?.error?.message || 'Failed to delete role.'),
      });
  }

  private buildPayload(): RolePayload {
    return {
      name:        this.formName.trim(),
      description: this.formDescription.trim(),
      permissions: this.formPermissions,
    };
  }

  // ── Modals ────────────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode       = 'create';
    this.selectedRole    = null;
    this.formName        = '';
    this.formDescription = '';
    this.formPermissions = this.buildDefaultPermissions();
    this.nameError       = '';
  }

  openEditModal(role: RoleApiResponse): void {
    this.modalMode       = 'edit';
    this.selectedRole    = role;
    this.formName        = role.name;
    this.formDescription = role.description;
    this.formPermissions = this.buildPermissionsFromRole(role);
    this.nameError       = '';
  }

  openViewModal(role: RoleApiResponse): void {
    this.modalMode       = 'view';
    this.selectedRole    = role;
    this.formPermissions = this.buildPermissionsFromRole(role);
  }

  openDeleteModal(role: RoleApiResponse): void {
    this.modalMode    = 'delete';
    this.selectedRole = role;
  }

  closeModal(): void {
    this.modalMode    = null;
    this.selectedRole = null;
    this.nameError    = '';
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;
    this.modalMode === 'create' ? this.createRole() : this.updateRole();
  }

  validateForm(): boolean {
    this.nameError = '';
    const t = this.formName.trim();
    if (!t) { this.nameError = 'Role name is required.'; return false; }
    const dup = this.roles.find(
      r => r.name.toLowerCase() === t.toLowerCase() && r.id !== this.selectedRole?.id,
    );
    if (dup) { this.nameError = 'A role with this name already exists.'; return false; }
    return true;
  }

  // ── Permission helpers ────────────────────────────────────────────────────

  flattenTree(tree: MenuTreeItem[]): MenuTreeItem[] {
    const result: MenuTreeItem[] = [];
    for (const node of [...tree].sort((a, b) => a.sequence - b.sequence)) {
      result.push(node);
      if (node.children?.length) {
        result.push(...[...node.children].sort((a, b) => a.sequence - b.sequence));
      }
    }
    return result;
  }

  buildDefaultPermissions(): RolePermission[] {
    return this.flatMenus.map(m => ({
      menuId: m.id, canCreate: false, canRead: false, canUpdate: false, canDelete: false,
    }));
  }

  buildPermissionsFromRole(role: RoleApiResponse): RolePermission[] {
    return this.flatMenus.map(m => {
      const existing = role.permissions?.find(p => p.menuId === m.id);
      return existing ?? {
        menuId: m.id, canCreate: false, canRead: false, canUpdate: false, canDelete: false,
      };
    });
  }

  getPermissionForMenu(menuId: string): RolePermission | undefined {
    return this.formPermissions.find(p => p.menuId === menuId);
  }

  childrenOf(parent: MenuTreeItem): MenuTreeItem[] {
    return [...(parent.children ?? [])].sort((a, b) => a.sequence - b.sequence);
  }

  hasChildren(parent: MenuTreeItem): boolean {
    return (parent.children?.length ?? 0) > 0;
  }

  /** Find the parent node that owns a given child id */
  private findParentOf(childId: string): MenuTreeItem | undefined {
    return this.menuTree.find(p => p.children?.some(c => c.id === childId));
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CHILD → PARENT AUTO-SYNC
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Called when a single permission cell on a CHILD row changes.
   *
   * Turning a child permission ON  → mirror that column ON  for the parent.
   * Turning a child permission OFF → turn parent OFF only when no other
   *                                   sibling still has that column ON.
   */
  onChildPermChange(childId: string, key: PermKey, checked: boolean): void {
    const parent = this.findParentOf(childId);
    if (!parent) return;

    const parentPerm = this.getPermissionForMenu(parent.id);
    if (!parentPerm) return;

    if (checked) {
      // ✅ child turned ON → parent gets the same column ON
      parentPerm[key] = true;
    } else {
      // ❌ child turned OFF → keep parent ON only if another sibling still has it
      const siblingHasKey = this.childrenOf(parent).some(c => {
        if (c.id === childId) return false;           // skip the one we just unchecked
        return !!(this.getPermissionForMenu(c.id)?.[key]);
      });
      if (!siblingHasKey) {
        parentPerm[key] = false;
      }
    }
  }

  /**
   * Called when the ROW "All" checkbox on a CHILD row changes.
   * Applies the row-all to the child, then syncs every column to the parent.
   */
  onChildRowAllChange(childId: string, checked: boolean): void {
    this.toggleRowAll(childId, checked);
    for (const col of this.permCols) {
      this.onChildPermChange(childId, col.key, checked);
    }
  }

  // ── Row select-all (horizontal) ───────────────────────────────────────────

  isRowAllChecked(menuId: string): boolean {
    const p = this.getPermissionForMenu(menuId);
    return !!(p?.canCreate && p?.canRead && p?.canUpdate && p?.canDelete);
  }

  isRowIndeterminate(menuId: string): boolean {
    const p = this.getPermissionForMenu(menuId);
    if (!p) return false;
    const n = [p.canCreate, p.canRead, p.canUpdate, p.canDelete].filter(Boolean).length;
    return n > 0 && n < 4;
  }

  toggleRowAll(menuId: string, checked: boolean): void {
    const p = this.formPermissions.find(x => x.menuId === menuId);
    if (p) {
      p.canCreate = checked; p.canRead   = checked;
      p.canUpdate = checked; p.canDelete = checked;
    }
  }

  // ── Column select-all (vertical) ──────────────────────────────────────────

  isColAllChecked(key: PermKey): boolean {
    return this.formPermissions.length > 0 && this.formPermissions.every(p => p[key]);
  }

  isColIndeterminate(key: PermKey): boolean {
    const n = this.formPermissions.filter(p => p[key]).length;
    return n > 0 && n < this.formPermissions.length;
  }

  toggleColAll(key: PermKey, checked: boolean): void {
    this.formPermissions.forEach(p => (p[key] = checked));
  }

  // ── Grand select-all ──────────────────────────────────────────────────────

  isGrandAllChecked(): boolean {
    return this.formPermissions.length > 0 &&
      this.formPermissions.every(p => p.canCreate && p.canRead && p.canUpdate && p.canDelete);
  }

  isGrandIndeterminate(): boolean {
    const total  = this.formPermissions.length * 4;
    const ticked = this.formPermissions.reduce(
      (s, p) => s + [p.canCreate, p.canRead, p.canUpdate, p.canDelete].filter(Boolean).length,
      0,
    );
    return ticked > 0 && ticked < total;
  }

  toggleGrandAll(checked: boolean): void {
    this.formPermissions.forEach(p => {
      p.canCreate = checked; p.canRead   = checked;
      p.canUpdate = checked; p.canDelete = checked;
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getActivePermCount(role: RoleApiResponse): number {
    return (role.permissions || []).filter(
      p => p.canCreate || p.canRead || p.canUpdate || p.canDelete,
    ).length;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  onSearch(): void { this.applySearch(); }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredRoles = q
      ? this.roles.filter(r => r.name.toLowerCase().includes(q))
      : [...this.roles];
  }

  // ── Badge ─────────────────────────────────────────────────────────────────

  roleBadgeClass(name: string): string {
    const map: Record<string, string> = {
      'Super Admin': 'pg-badge--red',
      Admin:   'pg-badge--purple',
      Teacher: 'pg-badge--indigo',
      Student: 'pg-badge--blue',
      Parent:  'pg-badge--green',
    };
    return map[name] || 'pg-badge--gray';
  }
}

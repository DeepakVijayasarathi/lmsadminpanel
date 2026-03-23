import { Injectable } from '@angular/core';

export interface Permission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const DEFAULT: Permission = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
};

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private map = new Map<string, Permission>();

  /** Call once after your menu API responds */
  load(data: { menu: { url: string | null }; permission: Permission }[]): void {
    this.map.clear();
    for (const item of data) {
      if (item.menu?.url) {
        this.map.set(item.menu.url, item.permission);
      }
    }
  }

  for(url: string): Permission {
    return this.map.get(url) ?? { ...DEFAULT };
  }
}

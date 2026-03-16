import { Component } from '@angular/core';

export interface Role {
  id: number;
  name: string;
  userCount: number;
  permissions: string[];
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-roles',
  standalone: false,
  templateUrl: './roles.component.html',
  styleUrls: ['../../../shared-page.css', './roles.component.css']
})
export class RolesComponent {
  roles: Role[] = [
    { id: 1, name: 'Super Admin', userCount: 1, permissions: ['Manage Users', 'Manage Roles', 'View Reports', 'Manage Finance', 'System Settings', 'Manage Content'], status: 'active' },
    { id: 2, name: 'Admin', userCount: 2, permissions: ['Manage Users', 'View Reports', 'Manage Finance', 'Send Notifications', 'Manage Batches'], status: 'active' },
    { id: 3, name: 'Teacher', userCount: 85, permissions: ['View Students', 'Grade Assignments', 'Create Exams', 'Upload Content', 'View Reports'], status: 'active' },
    { id: 4, name: 'Student', userCount: 2847, permissions: ['View Courses', 'Attempt Exams', 'View Results', 'Submit Assignments'], status: 'active' },
    { id: 5, name: 'Parent', userCount: 117, permissions: ['View Child Progress', 'View Attendance', 'Receive Notifications'], status: 'active' }
  ];

  roleBadgeClass(name: string): string {
    const map: Record<string, string> = {
      'Super Admin': 'pg-badge--red',
      'Admin': 'pg-badge--purple',
      'Teacher': 'pg-badge--indigo',
      'Student': 'pg-badge--blue',
      'Parent': 'pg-badge--green'
    };
    return map[name] || 'pg-badge--gray';
  }

  visiblePerms(perms: string[]): string[] {
    return perms.slice(0, 3);
  }

  extraPermsCount(perms: string[]): number {
    return Math.max(0, perms.length - 3);
  }
}

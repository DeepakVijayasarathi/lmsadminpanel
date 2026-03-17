import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import {
  UserService,
  User,
  UserPayload,
  UserUpdatePayload,
  Role,
} from '../users.service';

// Student role ID from DB
const STUDENT_ROLE_NAME = 'Student';

type ModalMode =
  | 'create'
  | 'edit'
  | 'view'
  | 'delete'
  | 'block'
  | 'device-reset'
  | null;

@Component({
  selector: 'app-students',
  standalone: false,
  templateUrl: './students.component.html',
  styleUrls: ['../../../shared-page.css', './students.component.css'],
})
export class StudentsComponent implements OnInit {
  allUsers: User[] = [];
  students: User[] = [];
  filteredStudents: User[] = [];
  roles: Role[] = [];

  searchTerm: string = '';
  filterStatus: string = '';
  isLoading: boolean = false;

  // Modal
  modalMode: ModalMode = null;
  selectedUser: User | null = null;

  // Form fields
  formFirstName: string = '';
  formLastName: string = '';
  formUsername: string = '';
  formEmail: string = '';
  formPhone: string = '';
  formPassword: string = '';
  formIsActive: boolean = true;
  formBlockReason: string = '';

  // Errors
  firstNameError: string = '';
  lastNameError: string = '';
  usernameError: string = '';
  emailError: string = '';
  passwordError: string = '';
  blockReasonError: string = '';

  showPassword: boolean = false;

  constructor(
    private commonService: CommonService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.loadRolesAndUsers();
  }

  // ─── Load ────────────────────────────────────────────────────

  loadRolesAndUsers(): void {
    this.isLoading = true;
    this.userService.getRoles().subscribe({
      next: (res: any) => {
        this.roles = Array.isArray(res) ? res : (res?.data ?? []);
        this.loadUsers();
      },
      error: () => {
        this.commonService.error('Failed to load roles.');
        this.loadUsers();
      },
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (res: any) => {
        this.allUsers = Array.isArray(res) ? res : (res?.data ?? []);
        const studentRole = this.roles.find(
          (r) => r.name === STUDENT_ROLE_NAME,
        );
        this.students = this.allUsers.filter((u) =>
          studentRole
            ? u.roleId === studentRole.id
            : u.userType?.toLowerCase() === 'student',
        );
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load students.');
        this.isLoading = false;
      },
    });
  }

  // ─── CRUD ────────────────────────────────────────────────────

  createUser(): void {
    const studentRole = this.roles.find((r) => r.name === STUDENT_ROLE_NAME);
    const payload: UserPayload = {
      username: this.formUsername.trim(),
      firstName: this.formFirstName.trim(),
      lastName: this.formLastName.trim(),
      email: this.formEmail.trim(),
      password: this.formPassword,
      phone: this.formPhone.trim(),
      userType: 'Student',
      roleId: studentRole?.id ?? '',
    };
    this.userService.createUser(payload).subscribe({
      next: () => {
        this.commonService.success('Student created successfully.');
        this.closeModal();
        this.loadUsers();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to create student.',
        );
      },
    });
  }

  updateUser(): void {
    if (!this.selectedUser) return;
    const studentRole = this.roles.find((r) => r.name === STUDENT_ROLE_NAME);
    const payload: UserUpdatePayload = {
      username: this.formUsername.trim(),
      firstName: this.formFirstName.trim(),
      lastName: this.formLastName.trim(),
      email: this.formEmail.trim(),
      password: this.formPassword,
      phone: this.formPhone.trim(),
      userType: 'Student',
      roleId: studentRole?.id ?? this.selectedUser.roleId,
      isActive: this.formIsActive,
    };
    this.userService.updateUser(this.selectedUser.id, payload).subscribe({
      next: () => {
        this.commonService.success('Student updated successfully.');
        this.closeModal();
        this.loadUsers();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to update student.',
        );
      },
    });
  }

  deleteUser(): void {
    if (!this.selectedUser) return;
    this.userService.deleteUser(this.selectedUser.id).subscribe({
      next: () => {
        this.commonService.success(
          `Student "${this.userService.getFullName(this.selectedUser!)}" deleted.`,
        );
        this.closeModal();
        this.loadUsers();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to delete student.',
        );
      },
    });
  }

  blockUser(): void {
    if (!this.selectedUser) return;
    if (!this.formBlockReason.trim()) {
      this.blockReasonError = 'Block reason is required.';
      return;
    }
    this.userService
      .blockUser(this.selectedUser.id, { reason: this.formBlockReason.trim() })
      .subscribe({
        next: () => {
          this.commonService.success(
            `Student "${this.userService.getFullName(this.selectedUser!)}" blocked.`,
          );
          this.closeModal();
          this.loadUsers();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to block student.',
          );
        },
      });
  }

  deviceReset(): void {
    if (!this.selectedUser) return;
    this.userService.deviceReset(this.selectedUser.id).subscribe({
      next: () => {
        this.commonService.success(
          `Device reset for "${this.userService.getFullName(this.selectedUser!)}".`,
        );
        this.closeModal();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to reset device.',
        );
      },
    });
  }

  // ─── Modals ──────────────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedUser = null;
    this.resetForm();
  }

  openEditModal(user: User): void {
    this.modalMode = 'edit';
    this.selectedUser = user;
    this.formFirstName = user.firstName;
    this.formLastName = user.lastName;
    this.formUsername = user.username;
    this.formEmail = user.email;
    this.formPhone = user.phone;
    this.formPassword = '';
    this.formIsActive = user.isActive;
    this.clearErrors();
  }

  openViewModal(user: User): void {
    this.modalMode = 'view';
    this.selectedUser = user;
  }

  openDeleteModal(user: User): void {
    this.modalMode = 'delete';
    this.selectedUser = user;
  }

  openBlockModal(user: User): void {
    this.modalMode = 'block';
    this.selectedUser = user;
    this.formBlockReason = '';
    this.blockReasonError = '';
  }

  openDeviceResetModal(user: User): void {
    this.modalMode = 'device-reset';
    this.selectedUser = user;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedUser = null;
    this.clearErrors();
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') this.createUser();
    else if (this.modalMode === 'edit') this.updateUser();
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;
    if (!this.formFirstName.trim()) {
      this.firstNameError = 'First name is required.';
      valid = false;
    }
    if (!this.formLastName.trim()) {
      this.lastNameError = 'Last name is required.';
      valid = false;
    }
    if (!this.formUsername.trim()) {
      this.usernameError = 'Username is required.';
      valid = false;
    }
    if (!this.formEmail.trim()) {
      this.emailError = 'Email is required.';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formEmail)) {
      this.emailError = 'Enter a valid email.';
      valid = false;
    }
    if (this.modalMode === 'create' && !this.formPassword) {
      this.passwordError = 'Password is required.';
      valid = false;
    }
    return valid;
  }

  resetForm(): void {
    this.formFirstName = '';
    this.formLastName = '';
    this.formUsername = '';
    this.formEmail = '';
    this.formPhone = '';
    this.formPassword = '';
    this.formIsActive = true;
    this.showPassword = false;
    this.clearErrors();
  }

  clearErrors(): void {
    this.firstNameError = '';
    this.lastNameError = '';
    this.usernameError = '';
    this.emailError = '';
    this.passwordError = '';
    this.blockReasonError = '';
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getInitials(user: User): string {
    return this.userService.getInitials(user.firstName, user.lastName);
  }

  getFullName(user: User): string {
    return this.userService.getFullName(user);
  }

  onSearch(): void {
    this.applyFilters();
  }
  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.students];
    if (this.filterStatus) {
      list = list.filter((u) =>
        this.filterStatus === 'active' ? u.isActive : !u.isActive,
      );
    }
    const q = this.searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (u) =>
          this.getFullName(u).toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.username?.toLowerCase().includes(q),
      );
    }
    this.filteredStudents = list;
  }

  get totalActive(): number {
    return this.students.filter((u) => u.isActive).length;
  }
  get totalInactive(): number {
    return this.students.filter((u) => !u.isActive).length;
  }
}

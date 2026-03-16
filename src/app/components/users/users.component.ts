import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from './users.service';
import { CommonService } from '../../services/common.service';
import { User, CreateUserPayload, USER_TYPES } from './users.model';

type ModalMode = 'create' | 'edit' | 'view' | null;

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  roles = signal<any[]>([]);

  modalMode: ModalMode = null;
  selectedUser: User | null = null;
  showDeleteModal: boolean = false;
  userToDelete: User | null = null;

  userForm!: FormGroup;
  userTypes = USER_TYPES;

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.users();
    return this.users().filter(u =>
      u.username?.toLowerCase().includes(query) ||
      u.firstName?.toLowerCase().includes(query) ||
      u.lastName?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone?.toLowerCase().includes(query) ||
      u.userType?.toLowerCase().includes(query)
    );
  });

  totalRecords = computed(() => this.filteredUsers().length);
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()) || 1);

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  constructor(
    private userService: UserService,
    private commonService: CommonService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  initForm(user?: User): void {
    this.userForm = this.fb.group({
      username: [user?.username || '', [Validators.required, Validators.minLength(3)]],
      firstName: [user?.firstName || '', Validators.required],
      lastName: [user?.lastName || '', Validators.required],
      email: [user?.email || '', [Validators.required, Validators.email]],
      password: ['', this.modalMode === 'create' ? [Validators.required, Validators.minLength(8)] : []],
      phone: [user?.phone || '', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,15}$/)]],
      userType: [user?.userType || ''],
      roleId: ['', this.modalMode === 'create' ? Validators.required : []]
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAll().subscribe({
      next: (data: any) => {
        this.users.set(data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.commonService.error('Failed to load users. Please try again.');
        this.isLoading.set(false);
      }
    });
    this.userService.getAllRoles().subscribe({
      next: (data: any) => {
        this.roles.set(data || []);
      },
      error: () => {
        this.commonService.error('Failed to load roles. Please try again.');
      }
    });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  resetSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  openCreateModal(): void {
    this.selectedUser = null;
    this.modalMode = 'create';
    this.initForm();
  }

  openEditModal(user: User): void {
    this.selectedUser = user;
    this.modalMode = 'edit';
    this.initForm(user);
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('roleId')?.clearValidators();
    this.userForm.get('roleId')?.updateValueAndValidity();
  }

  openViewModal(user: User): void {
    this.selectedUser = user;
    this.modalMode = 'view';
    this.initForm(user);
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedUser = null;
    this.userForm.reset();
  }

  onModalBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('form-modal-backdrop')) {
      this.closeModal();
    }
  }

  onSubmit(): void {
    debugger;
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const payload: CreateUserPayload = this.userForm.value;
    this.isSubmitting.set(true);

    if (this.modalMode === 'create') {
      this.userService.create(payload).subscribe({
        next: () => {
          this.commonService.success('User created successfully!');
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadUsers();
        },
        error: () => {
          this.commonService.error('Failed to create user. Please try again.');
          this.isSubmitting.set(false);
        }
      });
    } else if (this.modalMode === 'edit' && this.selectedUser) {
      this.userService.update(this.selectedUser.id, payload).subscribe({
        next: () => {
          this.commonService.success('User updated successfully!');
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadUsers();
        },
        error: () => {
          this.commonService.error('Failed to update user. Please try again.');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  onDeleteConfirmed(): void {
    if (!this.userToDelete) return;
    this.isDeleting.set(true);
    this.userService.delete(this.userToDelete.id).subscribe({
      next: () => {
        this.commonService.success(`User "${this.userToDelete?.username}" deleted successfully!`);
        this.isDeleting.set(false);
        this.showDeleteModal = false;
        this.userToDelete = null;
        this.loadUsers();
      },
      error: () => {
        this.commonService.error('Failed to delete user. Please try again.');
        this.isDeleting.set(false);
      }
    });
  }

  onDeleteCancelled(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  getFullName(user: User): string {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—';
  }

  getUserTypeLabel(type: string): string {
    return USER_TYPES.find(t => t.value === type)?.label || type || '—';
  }

  getUserTypeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      admin: 'badge-danger',
      instructor: 'badge-primary',
      student: 'badge-success',
      moderator: 'badge-warning'
    };
    return map[type] || 'badge-default';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (!field || !field.errors) return '';
    if (field.errors['required']) return 'This field is required.';
    if (field.errors['email']) return 'Please enter a valid email address.';
    if (field.errors['minlength']) {
      const min = field.errors['minlength'].requiredLength;
      return `Minimum ${min} characters required.`;
    }
    if (field.errors['pattern']) return 'Invalid format.';
    return 'Invalid value.';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  get isReadonly(): boolean {
    return this.modalMode === 'view';
  }

  get modalTitle(): string {
    switch (this.modalMode) {
      case 'create': return 'Add New User';
      case 'edit': return 'Edit User';
      case 'view': return 'User Details';
      default: return '';
    }
  }

  get modalSubtitle(): string {
    switch (this.modalMode) {
      case 'create': return 'Fill in the details to create a new user account.';
      case 'edit': return 'Update the user information below.';
      case 'view': return 'Viewing user profile details.';
      default: return '';
    }
  }

  get deleteItemName(): string {
    return this.userToDelete ? `${this.getFullName(this.userToDelete)} (@${this.userToDelete.username})` : '';
  }
}
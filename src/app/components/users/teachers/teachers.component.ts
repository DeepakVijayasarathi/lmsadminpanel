import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import {
  UserService,
  User,
  UserPayload,
  UserUpdatePayload,
} from '../users.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ModalMode =
  | 'create'
  | 'edit'
  | 'view'
  | 'delete'
  | 'block'
  | 'device-reset'
  | 'approve'
  | 'reject'
  | null;

@Component({
  selector: 'app-teachers',
  standalone: false,
  templateUrl: './teachers.component.html',
  styleUrls: ['../../../shared-page.css', './teachers.component.css'],
})
export class TeachersComponent implements OnInit {
  teachers: User[] = [];
  filteredTeachers: User[] = [];

  searchTerm: string = '';
  filterStatus: string = '';
  isLoading: boolean = false;

  pageSize = 10;
  currentPage = 1;

  get pagedTeachers(): User[] {
    return this.filteredTeachers.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTeachers.length / this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  modalMode: ModalMode = null;
  selectedUser: User | null = null;

  formFirstName: string = '';
  formLastName: string = '';
  formUsername: string = '';
  formEmail: string = '';
  formPhone: string = '';
  formPassword: string = '';
  formIsActive: boolean = true;
  formBlockReason: string = '';
  showPassword: boolean = false;

  firstNameError: string = '';
  lastNameError: string = '';
  usernameError: string = '';
  emailError: string = '';
  passwordError: string = '';
  blockReasonError: string = '';

  constructor(
    private commonService: CommonService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  // ─── Load ────────────────────────────────────────────────────

  loadTeachers(): void {
    this.isLoading = true;
    this.userService.getTeachers().subscribe({
      next: (res: any) => {
        this.teachers = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load teachers.');
        this.isLoading = false;
      },
    });
  }

  // ─── CRUD ────────────────────────────────────────────────────

  createUser(): void {
    const payload: UserPayload = {
      username: this.formUsername.trim(),
      firstName: this.formFirstName.trim(),
      lastName: this.formLastName.trim(),
      email: this.formEmail.trim(),
      password: this.formPassword,
      phone: this.formPhone.trim(),
    };
    this.userService.createUser(payload).subscribe({
      next: () => {
        this.commonService.success('Teacher created successfully.');
        this.closeModal();
        this.loadTeachers();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to create teacher.',
        );
      },
    });
  }

  updateUser(): void {
    if (!this.selectedUser) return;
    const payload: UserUpdatePayload = {
      username: this.formUsername.trim(),
      firstName: this.formFirstName.trim(),
      lastName: this.formLastName.trim(),
      email: this.formEmail.trim(),
      password: this.formPassword,
      phone: this.formPhone.trim(),
      roleId: this.selectedUser.roleDto?.id,
      isActive: this.formIsActive,
    };
    this.userService.updateUser(this.selectedUser.id, payload).subscribe({
      next: () => {
        this.commonService.success('Teacher updated successfully.');
        this.closeModal();
        this.loadTeachers();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to update teacher.',
        );
      },
    });
  }

  deleteUser(): void {
    if (!this.selectedUser) return;
    this.userService.deleteUser(this.selectedUser.id).subscribe({
      next: () => {
        this.commonService.success('Teacher deleted.');
        this.closeModal();
        this.loadTeachers();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to delete teacher.',
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
          this.commonService.success('Teacher blocked.');
          this.closeModal();
          this.loadTeachers();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to block teacher.',
          );
        },
      });
  }

  deviceReset(): void {
    if (!this.selectedUser) return;
    this.userService.deviceReset(this.selectedUser.id).subscribe({
      next: () => {
        this.commonService.success('Device reset successful.');
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
    let list = [...this.teachers];
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
          u.username?.toLowerCase().includes(q) ||
          u.phone?.includes(q),
      );
    }
    this.filteredTeachers = list;
    this.currentPage = 1;
  }

  get totalActive(): number {
    return this.teachers.filter((u) => u.isActive).length;
  }

  get totalInactive(): number {
    return this.teachers.filter((u) => !u.isActive).length;
  }

  onlyNumbers(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const pastedData = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pastedData)) {
      event.preventDefault();
    }
  }

  // ─── Pending stat ────────────────────────────────────
  get totalPending(): number {
    return this.teachers.filter((u) => !u.isApproved).length;
  }

  // ─── Modal openers ───────────────────────────────────
  openApproveModal(user: User): void {
    this.modalMode = 'approve';
    this.selectedUser = user;
  }

  openRejectModal(user: User): void {
    this.modalMode = 'reject';
    this.selectedUser = user;
  }

  // ─── Actions ─────────────────────────────────────────
  approveTeacher(): void {
    if (!this.selectedUser) return;
    this.userService.approveTeacher(this.selectedUser.id).subscribe({
      next: () => {
        this.commonService.success('Teacher approved successfully.');
        this.closeModal();
        this.loadTeachers();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to approve teacher.',
        );
      },
    });
  }

  rejectTeacher(): void {
    if (!this.selectedUser) return;
    this.userService.rejectTeacher(this.selectedUser.id).subscribe({
      next: () => {
        this.commonService.success('Teacher rejected.');
        this.closeModal();
        this.loadTeachers();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to reject teacher.',
        );
      },
    });
  }

  exportToPdf(): void {
    const doc = new jsPDF();
    const now = new Date();

    // ── Header bar ──────────────────────────────────────────────────────────────
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, 210, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Teachers Report', 14, 14);

    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exported: ${dateStr}`, 196, 14, { align: 'right' });

    // ── Summary chips ────────────────────────────────────────────────────────────
    const stats = [
      {
        label: 'Total',
        value: this.teachers.length,
        color: [16, 185, 129] as [number, number, number],
      },
      {
        label: 'Active',
        value: this.totalActive,
        color: [79, 70, 229] as [number, number, number],
      },
      {
        label: 'Inactive',
        value: this.totalInactive,
        color: [239, 68, 68] as [number, number, number],
      },
      {
        label: 'Pending',
        value: this.totalPending,
        color: [245, 158, 11] as [number, number, number],
      },
    ];

    let chipX = 14;
    stats.forEach((stat) => {
      doc.setFillColor(...stat.color);
      doc.roundedRect(chipX, 27, 42, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${stat.label}: ${stat.value}`, chipX + 21, 33.5, {
        align: 'center',
      });
      chipX += 46;
    });

    // ── Table ────────────────────────────────────────────────────────────────────
    const rows = this.filteredTeachers.map((u, i) => [
      i + 1,
      this.getFullName(u),
      u.username || '—',
      u.email || '—',
      u.phone || '—',
      u.isActive ? 'Active' : 'Inactive',
      u.isApproved ? 'Approved' : 'Pending',
    ]);

    autoTable(doc, {
      startY: 42,
      head: [
        ['#', 'Full Name', 'Username', 'Email', 'Phone', 'Status', 'Approval'],
      ],
      body: rows,
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [40, 40, 40],
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
      },
      didDrawCell: (data) => {
        // Status column (index 5)
        if (data.section === 'body' && data.column.index === 5) {
          const isActive = data.cell.raw === 'Active';
          doc.setFillColor(
            ...((isActive ? [209, 250, 229] : [254, 226, 226]) as [
              number,
              number,
              number,
            ]),
          );
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            'F',
          );
          doc.setTextColor(
            ...((isActive ? [6, 95, 70] : [153, 27, 27]) as [
              number,
              number,
              number,
            ]),
          );
          doc.setFontSize(8);
          doc.text(
            data.cell.raw as string,
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 1,
            { align: 'center' },
          );
        }
        // Approval column (index 6)
        if (data.section === 'body' && data.column.index === 6) {
          const isApproved = data.cell.raw === 'Approved';
          doc.setFillColor(
            ...((isApproved ? [209, 250, 229] : [254, 243, 199]) as [
              number,
              number,
              number,
            ]),
          );
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            'F',
          );
          doc.setTextColor(
            ...((isApproved ? [6, 95, 70] : [146, 64, 14]) as [
              number,
              number,
              number,
            ]),
          );
          doc.setFontSize(8);
          doc.text(
            data.cell.raw as string,
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 1,
            { align: 'center' },
          );
        }
      },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(7.5);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${pageNum} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 8,
          { align: 'center' },
        );
      },
    });

    const fileName = `teachers_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;
    doc.save(fileName);
  }
}

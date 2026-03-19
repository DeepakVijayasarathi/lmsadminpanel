import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  channel: string;
  type: string;
  createdAt?: string;
  isRead?: boolean;
  user?: { id: string; firstName: string; lastName: string; email?: string };
}

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  channel: string;
  type: string;
}

export interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  userType?: string;
}

type ModalMode = 'create' | 'view' | 'delete' | null;

@Component({
  selector: 'app-notifications',
  standalone: false,
  templateUrl: './notifications.component.html',
  styleUrls: ['../../../shared-page.css', './notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationItem[] = [];
  filteredNotifications: NotificationItem[] = [];
  users: UserRef[] = [];

  searchQuery: string = '';
  channelFilter: string = '';
  typeFilter: string = '';
  isLoading: boolean = false;

  // Modal
  modalMode: ModalMode = null;
  selectedNotif: NotificationItem | null = null;

  // Form
  formUserId: string = '';
  formTitle: string = '';
  formMessage: string = '';
  formChannel: string = '';
  formType: string = '';

  isSending: boolean = false;

  // Validation
  userIdError: string = '';
  titleError: string = '';
  messageError: string = '';
  channelError: string = '';
  typeError: string = '';

  readonly channels = ['push', 'whatsapp', 'sms', 'email', 'in-app'];
  readonly types = [
    'announcement',
    'reminder',
    'alert',
    'info',
    'fee',
    'exam',
    'result',
  ];

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadNotifications();
  }

  // ─── API ─────────────────────────────────────────────────────

  loadUsers(): void {
    this.httpService.getData(BASE_URL, '/users').subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {},
    });
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/notification').subscribe({
      next: (res: any) => {
        this.notifications = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load notifications.');
        this.isLoading = false;
      },
    });
  }

  sendNotification(): void {
    const payload: NotificationPayload = {
      userId: this.formUserId,
      title: this.formTitle.trim(),
      message: this.formMessage.trim(),
      channel: this.formChannel,
      type: this.formType,
    };
    this.isSending = true;
    this.httpService.postData(BASE_URL, '/notification', payload).subscribe({
      next: () => {
        this.commonService.success(
          `Notification "${payload.title}" sent successfully.`,
        );
        this.closeModal();
        this.loadNotifications();
        this.isSending = false;
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to send notification.',
        );
        this.isSending = false;
      },
    });
  }

  // ─── Modals ───────────────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.formUserId = '';
    this.formTitle = '';
    this.formMessage = '';
    this.formChannel = '';
    this.formType = '';
    this.clearErrors();
  }

  openViewModal(notif: NotificationItem): void {
    this.modalMode = 'view';
    this.selectedNotif = notif;
  }

  openDeleteModal(notif: NotificationItem): void {
    this.modalMode = 'delete';
    this.selectedNotif = notif;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedNotif = null;
    this.isSending = false;
    this.clearErrors();
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    this.sendNotification();
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;
    if (!this.formUserId) {
      this.userIdError = 'Please select a recipient.';
      valid = false;
    }
    if (!this.formTitle.trim()) {
      this.titleError = 'Title is required.';
      valid = false;
    }
    if (!this.formMessage.trim()) {
      this.messageError = 'Message is required.';
      valid = false;
    }
    if (!this.formChannel) {
      this.channelError = 'Please select a channel.';
      valid = false;
    }
    if (!this.formType) {
      this.typeError = 'Please select a type.';
      valid = false;
    }
    return valid;
  }

  clearErrors(): void {
    this.userIdError = '';
    this.titleError = '';
    this.messageError = '';
    this.channelError = '';
    this.typeError = '';
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getUserName(userId: string): string {
    if (!userId) return '—';
    const u = this.users.find((u) => u.id === userId);
    return u ? `${u.firstName} ${u.lastName}`.trim() : userId;
  }

  truncate(text: string, limit = 55): string {
    return text && text.length > limit
      ? text.substring(0, limit) + '…'
      : text || '—';
  }

  onSearch(): void {
    this.applyFilters();
  }
  onChannelFilter(): void {
    this.applyFilters();
  }
  onTypeFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.notifications];
    if (this.channelFilter)
      list = list.filter((n) => n.channel === this.channelFilter);
    if (this.typeFilter) list = list.filter((n) => n.type === this.typeFilter);
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q) ||
          n.type?.toLowerCase().includes(q) ||
          n.channel?.toLowerCase().includes(q),
      );
    }
    this.filteredNotifications = list;
  }

  channelBadgeClass(channel: string): string {
    const map: Record<string, string> = {
      push: 'pg-badge--sky',
      whatsapp: 'pg-badge--green',
      sms: 'pg-badge--yellow',
      email: 'pg-badge--indigo',
      'in-app': 'pg-badge--purple',
    };
    return map[channel] || 'pg-badge--gray';
  }

  channelIcon(channel: string): string {
    const map: Record<string, string> = {
      push: 'fa-solid fa-mobile-screen',
      whatsapp: 'fa-brands fa-whatsapp',
      sms: 'fa-solid fa-comment-sms',
      email: 'fa-solid fa-envelope',
      'in-app': 'fa-solid fa-bell',
    };
    return map[channel] || 'fa-solid fa-bell';
  }

  typeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      announcement: 'pg-badge--blue',
      reminder: 'pg-badge--amber',
      alert: 'pg-badge--red',
      info: 'pg-badge--sky',
      fee: 'pg-badge--orange',
      exam: 'pg-badge--purple',
      result: 'pg-badge--emerald',
    };
    return map[type] || 'pg-badge--gray';
  }

  get totalByChannel(): Record<string, number> {
    return this.notifications.reduce(
      (acc, n) => {
        acc[n.channel] = (acc[n.channel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}

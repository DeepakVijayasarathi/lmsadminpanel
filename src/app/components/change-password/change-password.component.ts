import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../../services/common.service';
import { TokenStorageService } from '../../auth/token-storage.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.component.html',
  styleUrls: ['../../shared-page.css', './change-password.component.css'],
})
export class ChangePasswordComponent implements OnInit {
  username: string = '';
  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  showOldPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  isLoading: boolean = false;
  isSuccess: boolean = false;

  // Errors
  oldPasswordError: string = '';
  newPasswordError: string = '';
  confirmPasswordError: string = '';

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private tokenStorage: TokenStorageService,
  ) {}

  ngOnInit(): void {
    // Read `sub` claim from JWT — it holds the username
    const token = this.tokenStorage.getAccessToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.sub || '';
      } catch {
        this.username = '';
      }
    }
  }

  // ─── Password strength meter ──────────────────────────────────
  get passwordStrength(): { label: string; level: number; color: string } {
    const p = this.newPassword;
    if (!p) return { label: '', level: 0, color: '' };

    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { label: 'Weak', level: 1, color: '#ef4444' };
    if (score === 2) return { label: 'Fair', level: 2, color: '#f59e0b' };
    if (score === 3) return { label: 'Good', level: 3, color: '#3b82f6' };
    return { label: 'Strong', level: 4, color: '#10b981' };
  }

  // ─── Validation ───────────────────────────────────────────────
  clearErrors(): void {
    this.oldPasswordError = '';
    this.newPasswordError = '';
    this.confirmPasswordError = '';
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.oldPassword) {
      this.oldPasswordError = 'Current password is required.';
      valid = false;
    }
    if (!this.newPassword) {
      this.newPasswordError = 'New password is required.';
      valid = false;
    } else if (this.newPassword.length < 6) {
      this.newPasswordError = 'Password must be at least 6 characters.';
      valid = false;
    } else if (this.newPassword === this.oldPassword) {
      this.newPasswordError = 'New password must differ from current password.';
      valid = false;
    }
    if (!this.confirmPassword) {
      this.confirmPasswordError = 'Please confirm your new password.';
      valid = false;
    } else if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match.';
      valid = false;
    }

    return valid;
  }

  // ─── Submit ───────────────────────────────────────────────────
  submit(): void {
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.isSuccess = false;

    const payload = {
      username: this.username,
      oldPassword: this.oldPassword,
      newPassword: this.newPassword,
    };

    this.http
      .post(environment.apiUrl + '/auth/change-password', payload)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.isSuccess = true;
          this.oldPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.showOldPassword = false;
          this.showNewPassword = false;
          this.showConfirmPassword = false;
          this.clearErrors();
          this.commonService.success('Password changed successfully.');
        },
        error: (err: any) => {
          this.isLoading = false;
          this.commonService.error(
            err?.error?.message ||
              'Failed to change password. Please try again.',
          );
        },
      });
  }
}

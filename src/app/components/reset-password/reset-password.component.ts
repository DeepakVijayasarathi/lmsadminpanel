import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../../services/common.service';
import { environment } from '../../../environments/environment';

function passwordMatchValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetForm: FormGroup;
  isLoading = false;
  resetSuccess = false;

  resetToken: string | null = null;

  showNewPassword = false;
  showConfirmPassword = false;

  passwordStrength = 0;
  strengthLabel = '';

  private redirectTimer: any;
  private readonly apiUrl = environment.apiUrl + '/auth/reset-password';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private commonService: CommonService,
  ) {
    this.resetForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParamMap.get('token');

    this.resetForm.get('newPassword')?.valueChanges.subscribe((val: string) => {
      this.updateStrength(val);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.redirectTimer);
  }

  get newPassword() {
    return this.resetForm.get('newPassword');
  }
  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }
  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private updateStrength(value: string): void {
    if (!value) {
      this.passwordStrength = 0;
      this.strengthLabel = '';
      return;
    }
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    this.passwordStrength = Math.min(4, Math.max(1, score));
    this.strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][
      this.passwordStrength
    ];
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    if (!this.resetToken) return;

    this.isLoading = true;

    const payload = {
      resetToken: this.resetToken,
      newPassword: this.newPassword?.value,
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetSuccess = true;
        this.redirectTimer = setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        const message =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message ||
              'Failed to reset password. The link may have expired.';
        this.commonService.error(message, 'Reset Failed');
      },
    });
  }
}

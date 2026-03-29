import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../../services/common.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isLoading = false;
  emailSent = false;
  sentEmail = '';

  private apiUrl = environment.apiUrl + '/auth/forgot-password';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private commonService: CommonService,
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get fpEmail() {
    return this.forgotForm.get('email');
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const email = this.fpEmail?.value;

    this.http.post(this.apiUrl, { email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.sentEmail = email;
        this.emailSent = true;
      },
      error: (err) => {
        this.isLoading = false;
        const message =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message ||
              'Failed to send reset link. Please try again.';
        this.commonService.error(message, 'Error');
      },
    });
  }

  resetForm() {
    this.emailSent = false;
    this.sentEmail = '';
    this.forgotForm.reset();
  }
}

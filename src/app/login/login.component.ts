import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from '../services/common.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  otpForm: FormGroup;

  showPassword = false;
  isLoading = false;

  loginMode: 'password' | 'otp' = 'password';
  otpStep: 'email' | 'verify' = 'email';
  otpEmail = '';
  resendCooldown = 0;
  private resendTimer: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private commonService: CommonService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      rememberMe: [false],
    });

    this.otpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: [
        '',
        [Validators.required, Validators.minLength(4), Validators.maxLength(6)],
      ],
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  switchMode(mode: 'password' | 'otp') {
    this.loginMode = mode;
    this.otpStep = 'email';
    this.otpEmail = '';
    this.otpForm.reset();
    this.loginForm.reset();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const payload = {
      email: this.email?.value,
      password: this.password?.value,
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.commonService.success('Login Successful', 'Success');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.commonService.error('Invalid email or password', 'Login Failed');
      },
    });
  }

  onSendOtp() {
    const emailCtrl = this.otpForm.get('email');
    emailCtrl?.markAsTouched();
    if (emailCtrl?.invalid) return;

    this.isLoading = true;
    this.otpEmail = emailCtrl!.value;

    this.authService.sendOtp(this.otpEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.otpStep = 'verify';
        this.commonService.success(`OTP sent to ${this.otpEmail}`, "Check your inbox");
        this.startResendCooldown();
      },
      error: (err) => {
        this.isLoading = false;
        const message =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message || 'Failed to send OTP. Please try again.';
        this.commonService.error(message, 'Error');
      }
    });
  }

  onVerifyOtp() {
    const otpCtrl = this.otpForm.get('otp');
    otpCtrl?.markAsTouched();
    if (otpCtrl?.invalid) return;

    this.isLoading = true;

    this.authService.verifyOtp(this.otpEmail, otpCtrl!.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.commonService.success('Login Successful', 'Success');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.commonService.error('Invalid or expired OTP', 'Verification Failed');
      },
    });
  }

  resendOtp() {
    if (this.resendCooldown > 0) return;
    this.isLoading = true;

    this.authService.sendOtp(this.otpEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.commonService.success('New OTP sent!', 'Resent');
        this.otpForm.get('otp')?.reset();
        this.startResendCooldown();
      },
      error: () => {
        this.isLoading = false;
        this.commonService.error('Could not resend OTP.', 'Error');
      },
    });
  }

  private startResendCooldown(seconds = 30) {
    this.resendCooldown = seconds;
    clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.resendTimer);
    }, 1000);
  }

  goBackToEmail() {
    this.otpStep = 'email';
    this.otpForm.get('otp')?.reset();
  }

  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }
  get otpEmailCtrl() {
    return this.otpForm.get('email');
  }
  get otpCtrl() {
    return this.otpForm.get('otp');
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from '../../services/common.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  otpForm: FormGroup;

  showPassword = false;
  isLoading = false;

  loginMode: 'password' | 'otp' = 'password';
  otpStep: 'email' | 'verify' = 'email';
  otpEmail = '';
  resendCooldown = 0;
  private resendTimer: any;

  // Device Info
  private deviceId: string = '';
  private deviceType: string = '';

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

  ngOnInit(): void {
    this.initializeDeviceInfo();
  }

  /** Generate or retrieve device ID from localStorage */
  private getOrCreateDeviceId(): string {
    const storageKey = 'lms_device_id';
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
      // Generate a unique device ID using timestamp and random string
      deviceId = this.generateUUID();
      localStorage.setItem(storageKey, deviceId);
    }

    return deviceId;
  }

  /** Generate a UUID v4 */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /** Detect device type based on user agent */
  private detectDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'Mobile';
    } else if (/ipad|tablet|android/i.test(userAgent)) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }

  /** Initialize device information */
  private initializeDeviceInfo(): void {
    this.deviceId = this.getOrCreateDeviceId();
    this.deviceType = this.detectDeviceType();
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
      deviceId: this.deviceId,
      deviceType: this.deviceType,
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.commonService.success('Login Successful', 'Success');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err?.error?.message || 'Invalid email or password';
        this.commonService.error(errorMessage, 'Login Failed');
      },
    });
  }

  onSendOtp() {
    const emailCtrl = this.otpForm.get('email');
    emailCtrl?.markAsTouched();
    if (emailCtrl?.invalid) return;

    this.isLoading = true;
    this.otpEmail = emailCtrl!.value;

    // Include device info with OTP send request
    const payload = {
      email: this.otpEmail,
      deviceId: this.deviceId,
      deviceType: this.deviceType,
    };

    this.authService.sendOtpWithDevice(payload).subscribe({
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

    // Include device info with OTP verification
    const payload = {
      email: this.otpEmail,
      otp: otpCtrl!.value,
      deviceId: this.deviceId,
      deviceType: this.deviceType,
    };

    this.authService.verifyOtp(this.otpEmail, otpCtrl!.value, payload).subscribe({
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

    // Include device info with resend OTP request
    const payload = {
      email: this.otpEmail,
      deviceId: this.deviceId,
      deviceType: this.deviceType,
    };

    this.authService.sendOtpWithDevice(payload).subscribe({
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

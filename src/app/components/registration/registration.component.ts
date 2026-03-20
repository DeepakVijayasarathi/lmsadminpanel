import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

declare var Razorpay: any;

interface Role {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category?: string;
  level?: string;
  isPublished?: boolean;
  durationHours?: number;
  durationInMonths?: number;
  totalAmount?: number;
  isPartialAllowed?: boolean;
  installmentCount?: number | null;
  discountAmount?: number | null;
  createdAt?: string;
}

interface Batch {
  id: string;
  name?: string;
  batchName?: string;
  courseId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  maxStudents?: number;
  isActive?: boolean;
}

@Component({
  selector: 'app-registration',
  standalone: false,
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent implements OnInit {
  readonly API = environment.apiUrl;

  selectedRole: 'teacher' | 'student' | null = null;
  roleId: string = '';
  roles: Role[] = [];
  courses: Course[] = [];
  batches: Batch[] = [];
  selectedCourse: Course | null = null;
  selectedBatch: Batch | null = null;
  paymentType: 1 | 2 = 1;
  currentStep = 1;

  loading = false;
  loaderMsg = 'Processing...';
  toastMsg = '';
  toastType: 'success' | 'error' = 'error';
  toastVisible = false;
  showSuccess = false;
  coursesLoading = false;

  // ── Form fields ──
  form = {
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
  };

  txnRef = '';
  showPassword = false;

  // ── Errors ──
  errors: Record<string, string> = {};

  // ── Success data ──
  successData: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  get totalSteps(): number {
    return this.selectedRole === 'teacher' ? 1 : 3;
  }

  get stepLabels(): string[] {
    return ['Your Details', 'Choose Course', 'Payment'].slice(
      0,
      this.totalSteps,
    );
  }

  get netAmount(): number {
    if (!this.selectedCourse) return 0;
    return (
      (this.selectedCourse.totalAmount || 0) -
      (this.selectedCourse.discountAmount || 0)
    );
  }

  get installmentAmount(): number {
    if (!this.selectedCourse?.installmentCount) return 0;
    return Math.ceil(this.netAmount / this.selectedCourse.installmentCount);
  }

  get publishedCourses(): Course[] {
    return this.courses.filter((c) => c.isPublished !== false);
  }

  // ── Role Selection ──
  async selectRole(role: 'teacher' | 'student') {
    this.selectedRole = role;
    this.loading = true;
    this.loaderMsg = 'Loading...';

    try {
      const roles: any = await this.http.get(`${this.API}/role`).toPromise();
      this.roles = Array.isArray(roles) ? roles : roles?.data || [];
      const match = this.roles.find((r: Role) =>
        r.name?.toLowerCase().includes(role),
      );
      this.roleId = match?.id || '';
    } catch (e: any) {
      this.toast('Could not load roles: ' + (e.message || 'Unknown error'));
    }

    this.loading = false;
    this.currentStep = 1;

    if (role === 'student') {
      this.loadCourses();
    }
  }

  backToRole() {
    this.selectedRole = null;
    this.currentStep = 1;
    this.showSuccess = false;
    this.resetErrors();
  }

  // ── Courses ──
  async loadCourses() {
    this.coursesLoading = true;
    try {
      const data: any = await this.http.get(`${this.API}/courses`).toPromise();
      this.courses = Array.isArray(data) ? data : data?.data || [];
    } catch (e: any) {
      this.toast('Failed to load courses: ' + (e.message || 'Unknown error'));
    }
    this.coursesLoading = false;
  }

  async selectCourse(course: Course) {
    this.selectedCourse = course;
    this.selectedBatch = null;
    delete this.errors['course'];

    try {
      if (!this.batches.length) {
        const data: any = await this.http
          .get(`${this.API}/batches`)
          .toPromise();
        this.batches = Array.isArray(data) ? data : data?.data || [];
      }
      const batch = this.batches.find(
        (b) => b.courseId === course.id && b.isActive !== false,
      );
      this.selectedBatch = batch || null;
    } catch (e) {
      console.warn('Batches fetch failed');
    }
  }

  // ── Payment type ──
  setPaymentType(type: 1 | 2) {
    this.paymentType = type;
  }

  // ── Validation ──
  validateStep1(): boolean {
    this.errors = {};
    const { firstName, lastName, username, phone, email, password } = this.form;
    if (!firstName.trim()) this.errors['firstName'] = 'First name is required';
    if (!lastName.trim()) this.errors['lastName'] = 'Last name is required';
    if (!username.trim()) this.errors['username'] = 'Username is required';
    if (!phone.trim()) this.errors['phone'] = 'Phone is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      this.errors['email'] = 'Valid email is required';
    if (password.length < 8)
      this.errors['password'] = 'Minimum 8 characters required';
    return Object.keys(this.errors).length === 0;
  }

  validateStep2(): boolean {
    if (!this.selectedCourse) {
      this.errors['course'] = 'Please select a course';
      return false;
    }
    return true;
  }

  validateStep3(): boolean {
    this.errors = {};
    if (!this.txnRef.trim())
      this.errors['txnRef'] = 'Transaction reference is required';
    return Object.keys(this.errors).length === 0;
  }

  resetErrors() {
    this.errors = {};
  }

  // ── Navigation ──
  async nextStep() {
    if (this.currentStep === 1) {
      if (!this.validateStep1()) return;
      if (this.selectedRole === 'teacher') {
        await this.submitTeacher();
        return;
      }
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      if (!this.validateStep2()) return;
      this.currentStep = 3;
    }
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  // ── Submit Teacher ──
  async submitTeacher() {
    this.loading = true;
    this.loaderMsg = 'Creating your account...';
    try {
      const user: any = await this.http
        .post(`${this.API}/users`, this.buildUserPayload())
        .toPromise();
      this.loading = false;
      this.triggerSuccess('teacher', user);
    } catch (e: any) {
      this.loading = false;
      this.toast(e?.error?.message || e?.message || 'Registration failed');
    }
  }

  // ── Submit Student via Razorpay ──
  async submitStudent() {
    this.loading = true;
    this.loaderMsg = 'Creating your account...';

    try {
      // Step 1: Create user
      const user: any = await this.http
        .post(`${this.API}/users`, this.buildUserPayload())
        .toPromise();
      const userId = user?.id || user?.data?.id;

      this.loaderMsg = 'Setting up pricing plan...';

      // Step 2: Create pricing plan
      const c = this.selectedCourse!;
      const plan: any = await this.http
        .post(`${this.API}/pricingplan`, {
          courseId: c.id,
          batchId: this.selectedBatch?.id || '',
          name: `${c.title} - ${this.paymentType === 1 ? 'Full Payment' : 'Installment'}`,
          totalAmount: this.netAmount,
          isPartialAllowed: this.paymentType === 2,
          installmentCount:
            this.paymentType === 2 ? c.installmentCount || null : null,
          discountAmount: c.discountAmount || null,
          durationInMonths: c.durationInMonths || null,
        })
        .toPromise();
      const pricingPlanId = plan?.id || plan?.data?.id;

      this.loaderMsg = 'Creating subscription...';

      // Step 3: Create subscription
      const sub: any = await this.http
        .post(`${this.API}/subscription`, {
          userId,
          pricingPlanId,
          paymentType: this.paymentType,
        })
        .toPromise();
      const subscriptionId = sub?.id || sub?.data?.id;

      this.loading = false;

      // Step 4: Open Razorpay
      const payAmount =
        this.paymentType === 2 && c.installmentCount
          ? this.installmentAmount
          : this.netAmount;

      this.openRazorpay(payAmount, subscriptionId, userId, user);
    } catch (e: any) {
      this.loading = false;
      this.toast(e?.error?.message || e?.message || 'Something went wrong');
    }
  }

  openRazorpay(
    amount: number,
    subscriptionId: string,
    userId: string,
    user: any,
  ) {
    const options = {
      key: 'rzp_test_YourKeyHere', // ← Replace with your Razorpay Key ID
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
      name: 'EduLanz',
      description: this.selectedCourse?.title || 'Course Subscription',
      image: 'https://edulanz.com/logo.png',
      prefill: {
        name: `${this.form.firstName} ${this.form.lastName}`,
        email: this.form.email,
        contact: this.form.phone,
      },
      theme: { color: '#2563eb' },
      handler: async (response: any) => {
        // Razorpay payment success
        await this.recordPayment(
          subscriptionId,
          amount,
          response.razorpay_payment_id,
          user,
        );
      },
      modal: {
        ondismiss: () => {
          this.toast('Payment cancelled. You can retry.');
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      this.toast('Payment failed: ' + response.error.description);
    });
    rzp.open();
  }

  async recordPayment(
    subscriptionId: string,
    amount: number,
    txnRef: string,
    user: any,
  ) {
    this.loading = true;
    this.loaderMsg = 'Recording payment...';
    try {
      await this.http
        .post(`${this.API}/subscription/pay`, {
          subscriptionId,
          amount,
          transactionReference: txnRef,
        })
        .toPromise();
      this.loading = false;
      this.triggerSuccess('student', user, { subscriptionId, amount, txnRef });
    } catch (e: any) {
      this.loading = false;
      this.toast(e?.error?.message || 'Payment record failed');
    }
  }

  // ── Helpers ──
  buildUserPayload() {
    return {
      username: this.form.username.trim(),
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      password: this.form.password,
      roleId: this.roleId,
    };
  }

  triggerSuccess(role: string, user: any, extra: any = {}) {
    this.showSuccess = true;
    this.successData = { role, user, extra, course: this.selectedCourse };
    for (let i = 1; i <= this.totalSteps; i++) {
      // stepper all done
    }
    this.toast('Registration successful! 🎉', 'success');
  }

  resetForm() {
    this.selectedRole = null;
    this.currentStep = 1;
    this.showSuccess = false;
    this.successData = null;
    this.form = {
      firstName: '',
      lastName: '',
      username: '',
      phone: '',
      email: '',
      password: '',
    };
    this.txnRef = '';
    this.selectedCourse = null;
    this.selectedBatch = null;
    this.paymentType = 1;
    this.errors = {};
  }

  toast(msg: string, type: 'success' | 'error' = 'error') {
    this.toastMsg = msg;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 4000);
  }

  getCourseDuration(c: Course): string {
    if (c.durationInMonths) return `${c.durationInMonths} mo`;
    if (c.durationHours) return `${c.durationHours}h`;
    return '';
  }

  formatCurrency(amount: number): string {
    return '₹' + Number(amount).toLocaleString('en-IN');
  }

  stepState(i: number): 'done' | 'active' | 'pending' {
    if (this.showSuccess) return 'done';
    if (i < this.currentStep) return 'done';
    if (i === this.currentStep) return 'active';
    return 'pending';
  }
}

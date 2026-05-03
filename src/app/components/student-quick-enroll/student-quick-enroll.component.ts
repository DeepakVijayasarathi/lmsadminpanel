import { Component, NgZone, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

declare var Razorpay: any;

interface CourseOption {
  id: string;
  title: string;
  price: number;
  isPublished?: boolean;
  isActive?: boolean;
}

interface BatchOption {
  id: string;
  name: string;
  courseId: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-student-quick-enroll',
  standalone: false,
  templateUrl: './student-quick-enroll.component.html',
  styleUrls: ['./student-quick-enroll.component.css'],
})
export class StudentQuickEnrollComponent implements OnInit {
  readonly API = environment.apiUrl;

  loading = false;
  loaderMsg = 'Processing...';
  coursesLoading = false;
  batchesLoading = false;
  boardsLoading = false;
  classesLoading = false;

  toastMsg = '';
  toastType: 'success' | 'error' = 'error';
  toastVisible = false;

  showSuccess = false;
  successData: any = null;
  countdown = 6;
  private countdownInterval: any = null;

  showPassword = false;
  usernameChecking = false;
  usernameExists = false;
  usernameAvailable = false;

  courses: CourseOption[] = [];
  batches: BatchOption[] = [];
  boards: { id: string; name: string; order: number }[] = [];
  classes: any[] = [];
  selectedBoardId = '';

  private readonly FALLBACK_BOARDS = [
    { id: '258c9777-7f4b-49bc-8bcd-ac479088a19f', name: 'IB', order: 1 },
    { id: '2694b9bf-bf25-4941-9295-9428bcadebb4', name: 'Tamil Nadu State Board', order: 2 },
    { id: '3097e4ae-7fab-44a1-a960-12e961a35173', name: 'CBSE', order: 3 },
    { id: '3dfd2184-28da-414f-9040-998182b73b34', name: 'ICSE', order: 4 },
    { id: '9d70735b-479f-4468-96f8-1823e5b4ee7c', name: 'Cambridge', order: 5 },
  ];

  form = {
    email: '',
    username: '',
    password: '',
    gender: '',
    classId: null as string | null,
    courseId: '',
    batchId: '',
  };

  errors: Record<string, string> = {};

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadBoards();
    this.loadCourses();
  }

  get selectedCourse(): CourseOption | null {
    return this.courses.find(c => c.id === this.form.courseId) ?? null;
  }

  get selectedClassName(): string {
    return this.classes.find(c => c.id === this.form.classId)?.name ?? '';
  }

  // ── Boards ──

  async loadBoards() {
    this.boardsLoading = true;
    try {
      const data: any = await firstValueFrom(this.http.get(`${this.API}/board/get-boards`));
      const loaded: any[] = Array.isArray(data) ? data : (data?.data ?? []);
      this.boards = loaded.length
        ? loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : this.FALLBACK_BOARDS;
    } catch {
      this.boards = this.FALLBACK_BOARDS;
    }
    this.boardsLoading = false;
  }

  onBoardSelect(boardId: string) {
    this.selectedBoardId = boardId;
    delete this.errors['boardId'];
    this.loadClasses(boardId);
  }

  async loadClasses(boardId: string) {
    if (!boardId) {
      this.classes = [];
      this.form.classId = null;
      return;
    }
    this.classesLoading = true;
    this.classes = [];
    this.form.classId = null;
    this.form.courseId = '';
    this.batches = [];
    try {
      const data: any = await firstValueFrom(
        this.http.get(`${this.API}/class/get-classes`, { params: { boardId } }),
      );
      this.classes = Array.isArray(data) ? data : data?.data || [];
    } catch {
      this.classes = [];
    }
    this.classesLoading = false;
  }

  onClassSelect(classId: string | null) {
    this.form.classId = classId;
    this.form.courseId = '';
    this.batches = [];
    delete this.errors['classId'];
    if (classId) this.loadCoursesByClass(classId);
  }

  // ── Courses / Batches ──

  async loadCourses() {
    this.coursesLoading = true;
    try {
      const data: any = await firstValueFrom(
        this.http.get(`${this.API}/courses/get-course-register`),
      );
      const all: CourseOption[] = Array.isArray(data) ? data : data?.data ?? [];
      this.courses = all.filter(c => c.isPublished !== false && c.isActive !== false);
    } catch {
      this.courses = [];
    }
    this.coursesLoading = false;
  }

  async loadCoursesByClass(classId: string) {
    this.coursesLoading = true;
    try {
      const data: any = await firstValueFrom(
        this.http.get(`${this.API}/courses/get-course-register/by-class/${classId}`),
      );
      const all: CourseOption[] = Array.isArray(data) ? data : data?.data ?? [];
      this.courses = all.filter(c => c.isPublished !== false && c.isActive !== false);
    } catch {
      // keep existing course list on error
    }
    this.coursesLoading = false;
  }

  async onCourseChange(courseId: string) {
    this.batches = [];
    this.form.batchId = '';
    if (!courseId) return;
    this.batchesLoading = true;
    try {
      const data: any = await firstValueFrom(
        this.http.get(`${this.API}/batches/get-batch-by-id/${courseId}`),
      );
      if (data) {
        this.batches = [data];
        this.form.batchId = data.id;
      }
    } catch {
      this.batches = [];
    }
    this.batchesLoading = false;
  }

  // ── Username availability ──

  suggestUsername() {
    if (!this.form.username && this.form.email) {
      this.form.username = this.form.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    }
  }

  async checkUsername() {
    const username = this.form.username.trim();
    this.usernameExists = false;
    this.usernameAvailable = false;
    if (!username) return;
    this.usernameChecking = true;
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.API}/auth/check-username/${encodeURIComponent(username)}`),
      );
      this.usernameExists = res?.exists === true;
      this.usernameAvailable = !this.usernameExists;
      if (this.usernameExists) this.errors['username'] = 'Username is already taken';
      else delete this.errors['username'];
    } catch {
      this.usernameExists = false;
      this.usernameAvailable = false;
    }
    this.usernameChecking = false;
  }

  // ── Validation ──

  validate(): boolean {
    this.errors = {};
    const f = this.form;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) this.errors['email'] = 'Valid email is required';
    if (!f.username.trim()) this.errors['username'] = 'Username is required';
    else if (this.usernameExists) this.errors['username'] = 'Username is already taken';
    if (f.password.length < 8) this.errors['password'] = 'Minimum 8 characters required';
    if (!this.selectedBoardId) this.errors['boardId'] = 'Please select a board';
    if (!f.classId) this.errors['classId'] = 'Please select a class';
    if (!f.gender) this.errors['gender'] = 'Please select a gender';
    if (!f.courseId) this.errors['courseId'] = 'Please select a course';
    if (!f.batchId) this.errors['batchId'] = 'No active batch found for the selected course';
    return Object.keys(this.errors).length === 0;
  }

  // ── Submit ──

  async onSubmit() {
    if (this.usernameChecking) return;
    if (!this.validate()) {
      this.scrollToFirstError();
      return;
    }

    this.loading = true;
    this.loaderMsg = 'Registering student...';

    try {
      const payload = {
        batchId: this.form.batchId || '',
        boardId: this.selectedBoardId || null,
        isFreeDemoStudent: false,
        register: {
          firstName: '',
          lastName: '',
          userName: this.form.username.trim(),
          email: this.form.email.trim(),
          password: this.form.password,
          phone: '',
          countryId: null,
          stateId: null,
          cityId: null,
        },
        classId: this.form.classId || null,
        currentGrade: this.selectedClassName,
        gender: this.form.gender,
        address: '',
        groupId: null,
        subjectIds: [],
        parentName: '',
        relationship: '',
        parentEmail: '',
        parentPhone: '',
      };

      const user: any = await firstValueFrom(
        this.http.post(`${this.API}/auth/student/register`, payload),
      );
      const userId = user?.data?.userId || user?.userId;

      this.loaderMsg = 'Creating subscription...';
      const sub: any = await firstValueFrom(
        this.http.post(`${this.API}/subscription`, {
          userId,
          courseId: this.form.courseId,
          batchId: this.form.batchId || null,
          paymentType: 1,
        }),
      );
      const subscriptionId = sub?.id || sub?.data?.id;

      this.loading = false;
      const isFree = (this.selectedCourse?.price || 0) === 0;
      if (isFree) {
        await this.recordPayment(subscriptionId, 0, 'FREE', user);
      } else {
        this.openRazorpay(this.selectedCourse!.price, subscriptionId, userId, user);
      }
    } catch (e: any) {
      this.loading = false;
      this.toast(e?.error?.message || e?.message || 'Registration failed. Please try again.');
    }
  }

  async recordPayment(subscriptionId: string, amount: number, txnRef: string, user: any) {
    this.loading = true;
    this.loaderMsg = 'Confirming payment...';
    try {
      await firstValueFrom(
        this.http.post(`${this.API}/subscription/pay`, {
          subscriptionId,
          amount,
          transactionReference: txnRef,
        }),
      );
      this.loading = false;
      localStorage.setItem('needsProfileCompletion', 'true');
      this.successData = {
        username: this.form.username.trim(),
        email: this.form.email,
        courseName: this.selectedCourse?.title,
        batchName: this.batches.find(b => b.id === this.form.batchId)?.name ?? '',
        amount,
      };
      this.showSuccess = true;
      this.toast('Enrollment Successful!', 'success');
      this.countdown = 6;
      this.countdownInterval = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.countdownInterval);
          this.router.navigate(['/login']);
        }
      }, 1000);
    } catch (e: any) {
      this.loading = false;
      this.toast(e?.error?.message || 'Payment confirmation failed. Contact support.');
    }
  }

  openRazorpay(amount: number, subscriptionId: string, userId: string, user: any) {
    if (typeof Razorpay === 'undefined') {
      this.toast('Payment gateway not loaded. Please refresh and try again.');
      return;
    }
    const options = {
      key: environment.razorpayKey,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'B2P Teachers',
      description: this.selectedCourse?.title || 'Course Enrollment',
      prefill: { email: this.form.email },
      theme: { color: '#2563eb' },
      handler: (response: any) => {
        this.ngZone.run(async () => {
          await this.recordPayment(subscriptionId, amount, response.razorpay_payment_id, user);
        });
      },
      modal: {
        ondismiss: () => {
          this.ngZone.run(async () => {
            await this.cancelRegistration(userId);
            this.toast('Payment cancelled. Your registration has been removed.');
          });
        },
      },
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (resp: any) => {
      this.ngZone.run(async () => {
        await this.cancelRegistration(userId);
        this.toast('Payment failed: ' + resp.error.description + '. Registration removed.');
      });
    });
    rzp.open();
  }

  private async cancelRegistration(userId: string) {
    try {
      await firstValueFrom(this.http.delete(`${this.API}/auth/cancel-registration/${userId}`));
    } catch { }
  }

  formatCurrency(amount: number): string {
    return '₹' + Number(amount).toLocaleString('en-IN');
  }

  toast(msg: string, type: 'success' | 'error' = 'error') {
    this.toastMsg = msg;
    this.toastType = type;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 4500);
  }

  private scrollToFirstError() {
    setTimeout(() => {
      const el = document.querySelector('.invalid, .err');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  closeSuccessAndLogin() {
    clearInterval(this.countdownInterval);
    this.router.navigate(['/login']);
  }
}

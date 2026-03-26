import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

declare var Razorpay: any;

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category?: string;
  level?: string;
  isPublished?: boolean;
  isActive?: boolean;
  durationHours?: number;
  durationInMonths?: number;
  price?: number;
  isPartialAllowed?: boolean;
  installmentCount?: number | null;
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
  courses: Course[] = [];
  batches: Batch[] = [];
  zonals: any[] = [];
  boards: { id: string; name: string; order: number }[] = [];
  selectedCourse: Course | null = null;
  selectedBatch: Batch | null = null;
  selectedBoardId = '';
  paymentType: 1 | 2 = 1;
  currentStep = 1;

  loading = false;
  loaderMsg = 'Processing...';
  toastMsg = '';
  toastType: 'success' | 'error' = 'error';
  toastVisible = false;
  showSuccess = false;
  coursesLoading = false;
  boardsLoading = false;


  // ── Shared account form fields ──
  form = {
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    zonalId: '',
  };

  // ── Teacher-specific fields ──
  teacherForm = {
    fullName: '',
    qualification: '',
    major: '',
    experience: 0,
    address: '',
    whatsAppNumber: '',
    hasHighSpeedInternet: false,
    readyForEarlyMorning: false,
    workingType: '',
    resumeUrl: '',
    identityProofUrl: '',
    degreeCertificateUrl: '',
  };

  // ── Student-specific fields ──
  studentForm = {
    dateOfBirth: null as string | null,
    gender: '',
    address: '',
    currentGrade: '',
    previousSchool: null as string | null,
    parentName: '',
    relationship: '',
    parentEmail: '',
    parentPhone: '',
    favoriteSubjects: [] as string[],
    hobbies: '',
    learningGoals: '',
  };

  subjectInput = '';
  showPassword = false;
  errors: Record<string, string> = {};
  successData: any = null;

  // ── Step labels ──
  readonly teacherStepLabels = ['Account', 'Professional', 'Documents'];
  readonly studentStepLabels = ['Account', 'Profile', 'Parent Info', 'Course', 'Payment'];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadBoards();
    this.loadZonals();
  }

  // ── Computed properties ──

  get publishedCourses(): Course[] {
    return this.courses.filter((c) => c.isPublished !== false && c.isActive !== false);
  }

  get netAmount(): number {
    if (!this.selectedCourse) return 0;
    return this.selectedCourse.price || 0;
  }

  get installmentAmount(): number {
    if (!this.selectedCourse?.installmentCount) return 0;
    return Math.ceil(this.netAmount / this.selectedCourse.installmentCount);
  }

  get totalSteps(): number {
    return this.selectedRole === 'teacher'
      ? this.teacherStepLabels.length
      : this.studentStepLabels.length;
  }

  // ── Role Selection ──
  async selectRole(role: 'teacher' | 'student') {
    this.selectedRole = role;
    this.currentStep = 1;

    if (role === 'student') {
      this.loadCourses();
      this.loadBoards();
    }
  }

  private readonly FALLBACK_BOARDS = [
    { id: '258c9777-7f4b-49bc-8bcd-ac479088a19f', name: 'IB',                     order: 1 },
    { id: '2694b9bf-bf25-4941-9295-9428bcadebb4', name: 'Tamil Nadu State Board',  order: 2 },
    { id: '3097e4ae-7fab-44a1-a960-12e961a35173', name: 'CBSE',                    order: 3 },
    { id: '3dfd2184-28da-414f-9040-998182b73b34', name: 'ICSE',                    order: 4 },
    { id: '9d70735b-479f-4468-96f8-1823e5b4ee7c', name: 'Cambridge',               order: 5 },
  ];

  async loadBoards() {
    this.boardsLoading = true;
    try {
      const data: any = await firstValueFrom(this.http.get(`${this.API}/board`));
      const loaded: any[] = Array.isArray(data) ? data : (data?.data ?? []);
      if (loaded.length) {
        this.boards = loaded;
        this.boards.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      } else {
        this.boards = this.FALLBACK_BOARDS;
      }
    } catch {
      this.boards = this.FALLBACK_BOARDS;
    }
    this.boardsLoading = false;
  }

  backToRole() {
    this.selectedRole = null;
    this.currentStep = 1;
    this.showSuccess = false;
    this.errors = {};
  }

  // ── Courses ──
  async loadCourses() {
    this.coursesLoading = true;
    try {
      const data: any = await this.http.get(`${this.API}/courses/get-course-register`).toPromise();
      this.courses = Array.isArray(data) ? data : data?.data || [];
    } catch (e: any) {
      this.toast('Failed to load courses: ' + (e.message || 'Unknown error'));
    }
    this.coursesLoading = false;
  }

  async loadZonals() {
    try {
      const data: any = await this.http.get(`${this.API}/zonal`).toPromise();
      this.zonals = Array.isArray(data) ? data : data?.data || [];
    } catch (e: any) {
      this.toast('Failed to load zonals: ' + (e.message || 'Unknown error'));
    }
  }

  // async selectCourse(course: Course) {
  //   this.selectedCourse = course;
  //   this.selectedBatch = null;
  //   delete this.errors['course'];

  //   try {
  //     console.log('Fetching batches for course:', course.id);
  //       console.log('Fetching batches for course:', this.selectedCourse!.id);
  //     if (!this.batches.length) {
  //       const data: any = await this.http.get(`${this.API}/batches/get-batch-by-id/${this.selectedCourse!.id}`).toPromise();
  //       this.batches = Array.isArray(data) ? data : data?.data || [];
  //       const batch = this.batches.find((b) => b.isActive === true);
  //       this.selectedBatch = batch || null;
  //       console.log('Batches loaded:', this.batches);
  //       console.log('Batches loaded:', batch);
  //     }
  //   } catch {
  //     console.warn('Batches fetch failed');
  //   }
  // }
  async selectCourse(course: Course) {
    this.selectedCourse = course;
    this.selectedBatch = null;
    delete this.errors['course'];

    try {
      console.log('Fetching batch for course:', this.selectedCourse!.id);

      const response: any = await firstValueFrom(
        this.http.get(`${this.API}/batches/get-batch-by-id/${this.selectedCourse!.id}`)
      );

      console.log('API Response:', response);

      // ✅ Since API returns single object
      if (response && response.isActive) {
        this.selectedBatch = response;
      } else {
        this.selectedBatch = null;
      }

      console.log('Selected Batch:', this.selectedBatch);

    } catch (error) {
      console.warn('Batch fetch failed', error);
    }
  }

  // ── Subject tag helpers ──
  addSubject() {
    const val = this.subjectInput.trim();
    if (val && !this.studentForm.favoriteSubjects.includes(val)) {
      this.studentForm.favoriteSubjects.push(val);
      delete this.errors['favoriteSubjects'];
    }
    this.subjectInput = '';
  }

  removeSubject(index: number) {
    this.studentForm.favoriteSubjects.splice(index, 1);
  }

  // ── Payment type ──
  setPaymentType(type: 1 | 2) {
    this.paymentType = type;
  }

  // ═══════════════════════════════════════════════════
  //                   VALIDATION
  // ═══════════════════════════════════════════════════

  // validateStep1(): boolean {
  //   this.errors = {};
  //   const { firstName, lastName, username, phone, email, password } = this.form;
  //   if (!firstName.trim()) this.errors['firstName'] = 'First name is required';
  //   if (!lastName.trim()) this.errors['lastName'] = 'Last name is required';
  //   if (!username.trim()) this.errors['username'] = 'Username is required';
  //   if (!phone.trim()) this.errors['phone'] = 'Phone is required';
  //   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  //     this.errors['email'] = 'Valid email is required';
  //   if (password.length < 8)
  //     this.errors['password'] = 'Minimum 8 characters required';
  //   return Object.keys(this.errors).length === 0;
  // }
  validateStep1(): boolean {
    this.errors = {};
    const { firstName, lastName, username, phone, email, password, zonalId } = this.form;
    if (!firstName.trim()) this.errors['firstName'] = 'First name is required';
    if (!lastName.trim()) this.errors['lastName'] = 'Last name is required';
    if (!username.trim()) this.errors['username'] = 'Username is required';
    if (!phone.trim()) this.errors['phone'] = 'Phone is required';
    if (!zonalId.trim()) this.errors['zonalId'] = 'Zonal ID is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      this.errors['email'] = 'Valid email is required';
    if (password.length < 8)
      this.errors['password'] = 'Minimum 8 characters required';
    return Object.keys(this.errors).length === 0;
  }

  /** Teacher Step 2 */
  validateTeacherStep2(): boolean {
    this.errors = {};
    const t = this.teacherForm;
    if (!t.fullName.trim()) this.errors['fullName'] = 'Full name is required';
    if (!t.qualification.trim()) this.errors['qualification'] = 'Qualification is required';
    if (!t.major.trim()) this.errors['major'] = 'Major is required';
    if (t.experience === null || t.experience === undefined || t.experience < 0)
      this.errors['experience'] = 'Experience is required';
    if (!t.whatsAppNumber.trim()) this.errors['whatsAppNumber'] = 'WhatsApp number is required';
    if (!t.address.trim()) this.errors['address'] = 'Address is required';
    if (!t.workingType) this.errors['workingType'] = 'Working type is required';
    return Object.keys(this.errors).length === 0;
  }

  /** Teacher Step 3 */
  validateTeacherStep3(): boolean {
    this.errors = {};
    const t = this.teacherForm;
    if (!t.resumeUrl.trim()) this.errors['resumeUrl'] = 'Resume URL is required';
    if (!t.identityProofUrl.trim()) this.errors['identityProofUrl'] = 'Identity proof URL is required';
    if (!t.degreeCertificateUrl.trim()) this.errors['degreeCertificateUrl'] = 'Degree certificate URL is required';
    return Object.keys(this.errors).length === 0;
  }

  /** Student Step 2 */
  validateStudentStep2(): boolean {
    this.errors = {};
    if (!this.selectedBoardId) this.errors['boardId'] = 'Please select a board (CBSE / State Board)';
    const s = this.studentForm;
    if (!s.gender) this.errors['gender'] = 'Gender is required';
    if (!s.currentGrade.trim()) this.errors['currentGrade'] = 'Current grade is required';
    if (!s.address.trim()) this.errors['address'] = 'Address is required';
    if (!s.favoriteSubjects.length) this.errors['favoriteSubjects'] = 'Add at least one subject';
    if (!s.hobbies.trim()) this.errors['hobbies'] = 'Hobbies are required';
    if (!s.learningGoals.trim()) this.errors['learningGoals'] = 'Learning goals are required';
    return Object.keys(this.errors).length === 0;
  }

  /** Student Step 3 */
  validateStudentStep3(): boolean {
    this.errors = {};
    const s = this.studentForm;
    if (!s.parentName.trim()) this.errors['parentName'] = 'Parent name is required';
    if (!s.relationship) this.errors['relationship'] = 'Relationship is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.parentEmail))
      this.errors['parentEmail'] = 'Valid parent email is required';
    if (!s.parentPhone.trim()) this.errors['parentPhone'] = 'Parent phone is required';
    return Object.keys(this.errors).length === 0;
  }

  /** Student Step 4 */
  validateStudentStep4(): boolean {
    if (!this.selectedCourse) {
      this.errors['course'] = 'Please select a course';
      return false;
    }
    return true;
  }

  // ═══════════════════════════════════════════════════
  //                   NAVIGATION
  // ═══════════════════════════════════════════════════

  async nextStep() {
    if (this.selectedRole === 'teacher') {
      await this.teacherNext();
    } else {
      await this.studentNext();
    }
  }

  private async teacherNext() {
    if (this.currentStep === 1) {
      if (!this.validateStep1()) return;
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      if (!this.validateTeacherStep2()) return;
      this.currentStep = 3;
    }
  }

  private async studentNext() {
    if (this.currentStep === 1) {
      if (!this.validateStep1()) return;
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      if (!this.validateStudentStep2()) return;
      this.currentStep = 3;
    } else if (this.currentStep === 3) {
      if (!this.validateStudentStep3()) return;
      this.currentStep = 4;
    } else if (this.currentStep === 4) {
      if (!this.validateStudentStep4()) return;
      this.currentStep = 5;
    }
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  // ═══════════════════════════════════════════════════
  //               TEACHER SUBMIT
  // ═══════════════════════════════════════════════════

  async submitTeacher() {
    if (!this.validateTeacherStep3()) return;

    this.loading = true;
    this.loaderMsg = 'Creating your account...';
    try {
      const payload = this.buildTeacherPayload();
      const user: any = await this.http
        .post(`${this.API}/auth/teacher/register`, payload)
        .toPromise();
      this.loading = false;
      this.triggerSuccess('teacher', user);
    } catch (e: any) {
      this.loading = false;
      this.toast(e?.error?.message || e?.message || 'Registration failed');
    }
  }

  private buildTeacherPayload() {
    const t = this.teacherForm;
    return {
      register: {
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        userName: this.form.username.trim(),
        email: this.form.email.trim(),
        zonalId: this.form.zonalId.trim(),
        password: this.form.password,
        phone: this.form.phone.trim(),
      },
      fullName: t.fullName.trim(),
      qualification: t.qualification.trim(),
      major: t.major.trim(),
      experience: Number(t.experience),
      address: t.address.trim(),
      whatsAppNumber: t.whatsAppNumber.trim(),
      hasHighSpeedInternet: t.hasHighSpeedInternet,
      readyForEarlyMorning: t.readyForEarlyMorning,
      workingType: t.workingType,
      resumeUrl: t.resumeUrl.trim(),
      identityProofUrl: t.identityProofUrl.trim(),
      degreeCertificateUrl: t.degreeCertificateUrl.trim(),
    };
  }

  // ═══════════════════════════════════════════════════
  //               STUDENT SUBMIT + RAZORPAY
  // ═══════════════════════════════════════════════════

  async submitStudent() {
    this.loading = true;
    this.loaderMsg = 'Creating your account...';

    try {
      // Step 1: Register student
      const payload = this.buildStudentPayload();
      const user: any = await firstValueFrom(
        this.http.post(`${this.API}/auth/student/register`, payload)
      );
      const userId = user?.data?.userId || user?.userId;

      this.loaderMsg = 'Creating subscription...';

      // Step 2: Create subscription directly with courseId
      const sub: any = await this.http
        .post(`${this.API}/subscription`, {
          userId,
          courseId: this.selectedCourse!.id,
          batchId: this.selectedBatch?.id ?? null,
          paymentType: this.paymentType,
        })
        .toPromise();
      const subscriptionId = sub?.id || sub?.data?.id;

      this.loading = false;

      const isFree = (this.selectedCourse!.price || 0) === 0;

      if (isFree) {
        // Free course — call /subscription/pay directly with amount 0
        await this.recordPayment(subscriptionId, 0, 'FREE', user);
      } else {
        // Paid course — open Razorpay
        const payAmount =
          this.paymentType === 2 && this.selectedCourse!.installmentCount
            ? this.installmentAmount
            : this.netAmount;
        this.openRazorpay(payAmount, subscriptionId, userId, user);
      }

      // Step 3: Open Razorpay
      // const payAmount =
      //   this.paymentType === 2 && this.selectedCourse!.installmentCount
      //     ? this.installmentAmount
      //     : this.netAmount;

      // this.openRazorpay(payAmount, subscriptionId, userId, user);
    } catch (e: any) {
      this.loading = false;
      this.toast(e?.error?.message || e?.message || 'Something went wrong');
    }
  }

  private buildStudentPayload() {
    const s = this.studentForm;
    return {
      boardId: this.selectedBoardId || null,
      isFreeDemoStudent: false,
      batchId: this.selectedBatch?.id || null,
      register: {
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        username: this.form.username.trim(),
        email: this.form.email.trim(),
        zonalId: this.form.zonalId.trim(),
        password: this.form.password,
        phone: this.form.phone.trim(),
      },
      dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString() : null,
      gender: s.gender,
      address: s.address.trim(),
      currentGrade: s.currentGrade.trim(),
      parentName: s.parentName.trim(),
      relationship: s.relationship,
      parentEmail: s.parentEmail.trim(),
      parentPhone: s.parentPhone.trim(),
      favoriteSubjects: s.favoriteSubjects,
      hobbies: s.hobbies.trim(),
      learningGoals: s.learningGoals.trim(),
    };
  }

  openRazorpay(
    amount: number,
    subscriptionId: string,
    userId: string,
    user: any,
  ) {
    if (typeof Razorpay === 'undefined') {
      this.toast('Payment gateway not loaded. Please refresh and try again.');
      return;
    }

    const options = {
      key: environment.razorpayKey,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'B2P Teachers',
      description: this.selectedCourse?.title || 'Course Subscription',
      prefill: {
        name: `${this.form.firstName} ${this.form.lastName}`.trim(),
        email: this.form.email,
        contact: this.form.phone,
      },
      theme: { color: '#2563eb' },
      handler: async (response: any) => {
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

  async recordPayment(subscriptionId: string, amount: number, txnRef: string, user: any,) {
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

  // triggerSuccess(role: string, user: any, extra: any = {}) {
  //   this.showSuccess = true;
  //   this.successData = { role, user, extra, course: this.selectedCourse };
  //   this.toast('Registration successful! 🎉', 'success');
  // }
  triggerSuccess(role: string, user: any, extra: any = {}) {
    this.showSuccess = true;
    this.successData = { role, user, extra, course: this.selectedCourse };
    this.toast('Registration successful! 🎉', 'success');

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 5000); // ← changed from 2500 to 5000
  }

  resetForm() {
    this.selectedRole = null;
    this.currentStep = 1;
    this.showSuccess = false;
    this.successData = null;
    this.form = { firstName: '', lastName: '', username: '', phone: '', email: '', password: '', zonalId: '' };
    this.teacherForm = {
      fullName: '', qualification: '', major: '', experience: 0,
      address: '', whatsAppNumber: '', hasHighSpeedInternet: false,
      readyForEarlyMorning: false, workingType: '', resumeUrl: '',
      identityProofUrl: '', degreeCertificateUrl: '',
    };
    this.studentForm = {
      dateOfBirth: null, gender: '', address: '', currentGrade: '',
      previousSchool: null, parentName: '', relationship: '',
      parentEmail: '', parentPhone: '', favoriteSubjects: [],
      hobbies: '', learningGoals: '',
    };
    this.subjectInput = '';
    this.selectedCourse = null;
    this.selectedBatch = null;
    this.selectedBoardId = '';
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

  goToLogin() {
    this.router.navigate(['/login']);
  }

}

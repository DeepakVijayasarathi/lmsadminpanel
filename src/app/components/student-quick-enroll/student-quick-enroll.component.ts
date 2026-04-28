import { Component, NgZone, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LocationService, LocationItem } from '../../services/location.service';

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

interface GroupEntry {
  id: string;
  name: string;
  description: string | null;
  order: number | null;
}

@Component({
  selector: 'app-student-quick-enroll',
  standalone: false,
  templateUrl: './student-quick-enroll.component.html',
  styleUrls: ['./student-quick-enroll.component.css'],
})
export class StudentQuickEnrollComponent implements OnInit {
  readonly API = environment.apiUrl;

  // ── Loading flags ──
  loading = false;
  loaderMsg = 'Processing...';
  countriesLoading = false;
  statesLoading = false;
  citiesLoading = false;
  coursesLoading = false;
  batchesLoading = false;
  boardsLoading = false;
  classesLoading = false;
  groupsLoading = false;
  subjectsLoading = false;

  // ── Toast ──
  toastMsg = '';
  toastType: 'success' | 'error' = 'error';
  toastVisible = false;

  // ── Success popup ──
  showSuccess = false;
  successData: any = null;
  countdown = 6;
  private countdownInterval: any = null;

  // ── Password visibility toggle ──
  showPassword = false;

  // ── Username availability ──
  usernameChecking = false;
  usernameExists = false;
  usernameAvailable = false;

  // ── Location data ──
  countries: LocationItem[] = [];
  states: LocationItem[] = [];
  cities: LocationItem[] = [];

  // ── Course / Batch data ──
  courses: CourseOption[] = [];
  batches: BatchOption[] = [];

  // ── Academic cascade data ──
  boards: { id: string; name: string; order: number }[] = [];
  classes: any[] = [];
  groups: GroupEntry[] = [];
  subjects: any[] = [];
  selectedBoardId = '';

  // Internal classId tracker for subject loading (mirrors registration.component.ts)
  private _classId = '';

  // ── Form model ──
  form = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    grade: '',
    address: '',
    countryId: null as number | null,
    stateId: null as number | null,
    cityId: null as number | null,
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationship: '',
    courseId: '',
    batchId: '',
    // Academic cascade
    classId: null as string | null,
    groupId: null as string | null,
    subjectIds: [] as string[],
  };

  errors: Record<string, string> = {};

  constructor(
    private http: HttpClient,
    private router: Router,
    private locationService: LocationService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    this.loadCourses();
    this.loadBoards();
  }

  // ── Computed properties ──

  get hasGroups(): boolean {
    return this.groups.length > 0;
  }

  get hasSubjects(): boolean {
    return this.subjects.length > 0;
  }

  get selectedCourse(): CourseOption | null {
    return this.courses.find(c => c.id === this.form.courseId) ?? null;
  }

  // ═══════════════════════════════════════════════════
  //              BOARDS / CLASSES / GROUPS / SUBJECTS
  //   (mirrors registration.component.ts exactly)
  // ═══════════════════════════════════════════════════

  private readonly FALLBACK_BOARDS = [
    { id: '258c9777-7f4b-49bc-8bcd-ac479088a19f', name: 'IB', order: 1 },
    { id: '2694b9bf-bf25-4941-9295-9428bcadebb4', name: 'Tamil Nadu State Board', order: 2 },
    { id: '3097e4ae-7fab-44a1-a960-12e961a35173', name: 'CBSE', order: 3 },
    { id: '3dfd2184-28da-414f-9040-998182b73b34', name: 'ICSE', order: 4 },
    { id: '9d70735b-479f-4468-96f8-1823e5b4ee7c', name: 'Cambridge', order: 5 },
  ];

  async loadBoards() {
    this.boardsLoading = true;
    try {
      const data: any = await firstValueFrom(this.http.get(`${this.API}/board/get-boards`));
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

  // ── On Board Selection ──
  onBoardSelect(boardId: string) {
    this.selectedBoardId = boardId;
    delete this.errors['boardId'];
    this.loadClasses(boardId);
  }

  // ── Load Classes by boardId ──
  async loadClasses(boardId: string) {
    if (!boardId) {
      this.classes = [];
      this.groups = [];
      this.subjects = [];
      this.form.classId = null;
      this.form.groupId = null;
      this.form.subjectIds = [];
      return;
    }
    this.classesLoading = true;
    this.classes = [];
    this.groups = [];
    this.subjects = [];
    this.form.classId = null;
    this.form.groupId = null;
    this.form.subjectIds = [];
    try {
      const data: any = await firstValueFrom(
        this.http.get(`${this.API}/class/get-classes`, { params: { boardId } })
      );
      this.classes = Array.isArray(data) ? data : data?.data || [];
    } catch {
      this.classes = [];
    }
    this.classesLoading = false;
  }

  // ── On Class Selection ──
  onClassSelect(classId: string | null) {
    this.form.classId = classId;
    this.subjects = [];
    this.form.subjectIds = [];
    delete this.errors['classId'];

    if (classId) {
      // Auto-fill grade immediately from class name
      const selectedClass = this.classes.find((c) => c.id === classId);
      if (selectedClass) {
        this.form.grade = selectedClass.name || '';
      }
      this.loadGroups(classId);
      this.loadCoursesByClass(classId);
    } else {
      this.groups = [];
      this.subjects = [];
      this.form.groupId = null;
      this.form.subjectIds = [];
      this.form.grade = '';
    }
  }

  // ── Load Groups by classId ──
  async loadGroups(classId: string) {
    this.groups = [];
    this.subjects = [];
    this.form.groupId = null;
    this.form.subjectIds = [];
    this._classId = classId;

    if (!classId) return;

    this.groupsLoading = true;
    try {
      const data: any = await firstValueFrom(
        this.http.get(`${this.API}/groups/by-class/${classId}`)
      );
      this.groups = Array.isArray(data) ? data : data?.data || [];
    } catch {
      this.groups = [];
    }
    this.groupsLoading = false;

    // If no groups exist, load subjects directly by class
    if (!this.hasGroups) {
      await this.loadSubjects(classId, 'class');
    }
  }

  // ── Load Subjects by classId or groupId ──
  async loadSubjects(id: string, mode: 'class' | 'group') {
    this.form.subjectIds = [];
    this.subjects = [];
    if (!id) return;

    if (mode === 'class') {
      const selectedClass = this.classes.find((c) => c.id === id);
      if (selectedClass) {
        this.form.grade = selectedClass.name || '';
      }
    }

    this.subjectsLoading = true;
    try {
      let url: string;
      let params: any;

      if (mode === 'group') {
        url = `${this.API}/subject/get-subject/by-group`;
        params = { groupId: id, classId: this._classId };
      } else {
        url = `${this.API}/subject/get-subject/by-class`;
        params = { classId: id };
      }

      const data: any = await firstValueFrom(this.http.get(url, { params }));
      this.subjects = Array.isArray(data) ? data : data?.data || [];
    } catch {
      this.subjects = [];
    }
    this.subjectsLoading = false;
  }

  // ── Group selection ──
  selectGroup(groupId: string) {
    this.form.groupId = groupId;
    this.form.subjectIds = [];
    this.subjects = [];
    delete this.errors['groupId'];
    this.loadSubjects(groupId, 'group');
  }

  // ── Subject toggle ──
  toggleSubject(subjectId: string) {
    const idx = this.form.subjectIds.indexOf(subjectId);
    if (idx === -1) {
      this.form.subjectIds.push(subjectId);
    } else {
      this.form.subjectIds.splice(idx, 1);
    }
    delete this.errors['subjectIds'];
  }

  // ── Load courses filtered by class (optional; falls back to all published) ──
  async loadCoursesByClass(classId: string) {
    this.coursesLoading = true;
    try {
      const data: any = await firstValueFrom(
        this.http.get(`${this.API}/courses/get-course-register/by-class/${classId}`)
      );
      const all: CourseOption[] = Array.isArray(data) ? data : data?.data ?? [];
      this.courses = all.filter(c => c.isPublished !== false && c.isActive !== false);
    } catch {
      // Fallback: keep the already-loaded full course list
    }
    this.coursesLoading = false;
  }

  // ═══════════════════════════════════════════════════
  //                  LOCATION
  // ═══════════════════════════════════════════════════

  async loadCountries() {
    this.countriesLoading = true;
    try {
      const data = await firstValueFrom(this.locationService.getCountries());
      this.countries = this.locationService.transformToDropdownFormat(data);
    } catch {
      this.countries = [];
    }
    this.countriesLoading = false;
  }

  async onCountryChange(countryId: number | null) {
    this.states = [];
    this.cities = [];
    this.form.stateId = null;
    this.form.cityId = null;
    if (!countryId) return;

    this.statesLoading = true;
    try {
      const data = await firstValueFrom(this.locationService.getStatesByCountry(countryId));
      this.states = this.locationService.transformToDropdownFormat(data);
    } catch {
      this.states = [];
    }
    this.statesLoading = false;
  }

  async onStateChange(stateId: number | null) {
    this.cities = [];
    this.form.cityId = null;
    if (!stateId) return;

    this.citiesLoading = true;
    try {
      const data = await firstValueFrom(this.locationService.getCitiesByState(stateId));
      this.cities = this.locationService.transformToDropdownFormat(data);
    } catch {
      this.cities = [];
    }
    this.citiesLoading = false;
  }

  // ═══════════════════════════════════════════════════
  //                  COURSES / BATCHES
  // ═══════════════════════════════════════════════════

  async loadCourses() {
    this.coursesLoading = true;
    try {
      const data: any = await firstValueFrom(
        this.http.get(`${this.API}/courses/get-course-register`)
      );
      const all: CourseOption[] = Array.isArray(data) ? data : data?.data ?? [];
      this.courses = all.filter(c => c.isPublished !== false && c.isActive !== false);
    } catch {
      this.courses = [];
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
        this.http.get(`${this.API}/batches/get-batch-by-id/${courseId}`)
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

  // ═══════════════════════════════════════════════════
  //               USERNAME AVAILABILITY
  // ═══════════════════════════════════════════════════

  async checkUsername() {
    const username = this.form.username.trim();
    this.usernameExists = false;
    this.usernameAvailable = false;
    if (!username) return;

    this.usernameChecking = true;
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.API}/auth/check-username/${encodeURIComponent(username)}`)
      );
      this.usernameExists = res?.exists === true;
      this.usernameAvailable = !this.usernameExists;
      if (this.usernameExists) {
        this.errors['username'] = 'Username is already taken';
      } else {
        delete this.errors['username'];
      }
    } catch {
      this.usernameExists = false;
      this.usernameAvailable = false;
    }
    this.usernameChecking = false;
  }

  // ═══════════════════════════════════════════════════
  //                   VALIDATION
  // ═══════════════════════════════════════════════════

  validate(): boolean {
    this.errors = {};
    const f = this.form;

    // Student info
    if (!f.firstName.trim()) this.errors['firstName'] = 'First name is required';
    if (!f.lastName.trim()) this.errors['lastName'] = 'Last name is required';
    if (!f.username.trim()) this.errors['username'] = 'Username is required';
    else if (this.usernameExists) this.errors['username'] = 'Username is already taken';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) this.errors['email'] = 'Valid email is required';
    if (!f.phone.trim()) this.errors['phone'] = 'Phone is required';
    if (f.password.length < 8) this.errors['password'] = 'Minimum 8 characters required';
    if (!f.gender) this.errors['gender'] = 'Gender is required';

    // Academic
    if (!this.selectedBoardId) this.errors['boardId'] = 'Please select a board';
    if (!f.classId) this.errors['classId'] = 'Please select a class';
    if (!f.grade.trim()) this.errors['grade'] = 'Current grade is required';

    // Group is mandatory only if groups exist for the selected class
    if (f.classId && this.hasGroups && !f.groupId) {
      this.errors['groupId'] = 'Please select a group';
    }

    // Subjects are mandatory only if subjects exist
    if (f.classId && this.hasSubjects && !f.subjectIds.length) {
      this.errors['subjectIds'] = 'Please select at least one subject';
    }

    // Location
    if (!f.countryId) this.errors['countryId'] = 'Country is required';
    if (!f.stateId) this.errors['stateId'] = 'State is required';
    if (!f.cityId) this.errors['cityId'] = 'City is required';
    if (!f.address.trim()) this.errors['address'] = 'Address is required';

    // Parent
    if (!f.parentName.trim()) this.errors['parentName'] = 'Parent name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.parentEmail)) this.errors['parentEmail'] = 'Valid parent email is required';
    if (!f.parentPhone.trim()) this.errors['parentPhone'] = 'Parent phone is required';
    if (!f.relationship) this.errors['relationship'] = 'Relationship is required';

    // Course
    if (!f.courseId) this.errors['courseId'] = 'Please select a course';
    if (!f.batchId) this.errors['batchId'] = 'No active batch found for the selected course';

    return Object.keys(this.errors).length === 0;
  }

  // ═══════════════════════════════════════════════════
  //                     SUBMIT
  // ═══════════════════════════════════════════════════

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
          firstName: this.form.firstName.trim(),
          lastName: this.form.lastName.trim(),
          userName: this.form.username.trim(),
          email: this.form.email.trim(),
          password: this.form.password,
          phone: this.form.phone.trim(),
          countryId: this.form.countryId,
          stateId: this.form.stateId,
          cityId: this.form.cityId,
        },
        gender: this.form.gender,
        address: this.form.address.trim(),
        currentGrade: this.form.grade.trim(),
        classId: this.form.classId || null,
        groupId: this.form.groupId || null,
        subjectIds: this.form.subjectIds,
        parentName: this.form.parentName.trim(),
        relationship: this.form.relationship,
        parentEmail: this.form.parentEmail.trim(),
        parentPhone: this.form.parentPhone.trim(),
      };

      const user: any = await firstValueFrom(
        this.http.post(`${this.API}/auth/student/register`, payload)
      );

      const userId = user?.data?.userId || user?.userId;

      // Step 2: Create subscription
      this.loaderMsg = 'Creating subscription...';

      const sub: any = await firstValueFrom(
        this.http.post(`${this.API}/subscription`, {
          userId,
          courseId: this.form.courseId,
          batchId: this.form.batchId || null,
          paymentType: 1,
        })
      );
      const subscriptionId = sub?.id || sub?.data?.id;

      this.loading = false;

      // Step 3: Payment
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
        })
      );
      this.loading = false;
      this.successData = {
        studentName: `${this.form.firstName} ${this.form.lastName}`.trim(),
        username: this.form.username.trim(),
        email: this.form.email,
        courseName: this.selectedCourse?.title,
        batchName: this.batches.find(b => b.id === this.form.batchId)?.name ?? '',
        amount,
      };
      this.showSuccess = true;
      this.toast('Registration & Payment Successful!', 'success');
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
      prefill: {
        name: `${this.form.firstName} ${this.form.lastName}`.trim(),
        email: this.form.email,
        contact: this.form.phone,
      },
      theme: { color: '#2563eb' },
      handler: (response: any) => {
        this.ngZone.run(async () => {
          await this.recordPayment(
            subscriptionId,
            amount,
            response.razorpay_payment_id,
            user
          );
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
        this.toast('Payment failed: ' + resp.error.description + '. Your registration has been removed.');
      });
    });
    rzp.open();
  }

  private async cancelRegistration(userId: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API}/auth/cancel-registration/${userId}`)
      );
    } catch {
      // Silent — user is already informed via toast; deletion failure is non-critical
    }
  }

  // ── Helpers ──

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

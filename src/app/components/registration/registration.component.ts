import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { LocationService, LocationItem, CountryDto, StateDto, CityDto } from '../../services/location.service';

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

interface GroupEntry {
  id: string;
  name: string;
  description: string | null;
  order: number | null;
}

@Component({
  selector: 'app-registration',
  standalone: false,
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent implements OnInit, OnDestroy {
  private querySub?: Subscription;
  readonly API = environment.apiUrl;
  readonly today = new Date().toISOString().split('T')[0];

  selectedRole: 'teacher' | 'student' | null = null;
  courses: Course[] = [];
  batches: Batch[] = [];
  zonals: any[] = [];
  boards: { id: string; name: string; order: number }[] = [];
  classes: any[] = [];
  groups: GroupEntry[] = [];
  subjects: any[] = [];
  selectedCourse: Course | null = null;
  selectedBatch: Batch | null = null;
  selectedBoardId = '';
  paymentType: 1 | 2 = 1;
  currentStep = 1;
  classId: string = '';

  loading = false;
  loaderMsg = 'Processing...';
  toastMsg = '';
  toastType: 'success' | 'error' = 'error';
  toastVisible = false;
  showSuccess = false;
  showPaymentFailure = false;
  paymentFailureMsg = '';
  coursesLoading = false;
  boardsLoading = false;
  classesLoading = false;
  groupsLoading = false;
  subjectsLoading = false;

  // ── Location fields ──
  countries: LocationItem[] = [];
  states: LocationItem[] = [];
  cities: LocationItem[] = [];
  countriesLoading = false;
  statesLoading = false;
  citiesLoading = false;

  // ── Shared account form fields ──
  form = {
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    // zonalId: '',
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
    countryId: null as number | null,
    stateId: null as number | null,
    cityId: null as number | null,
  };

  // ── Student-specific fields ──
  studentForm = {
    gender: '',
    address: '',
    currentGrade: '',
    parentName: '',
    relationship: '',
    parentEmail: '',
    parentPhone: '',
    learningGoals: '',
    whatsAppNumber: '',
    classId: null as string | null,
    groupId: null as string | null,
    subjectIds: [] as string[],
    countryId: null as number | null,
    stateId: null as number | null,
    cityId: null as number | null,
  };

  showPassword = false;
  errors: Record<string, string> = {};
  successData: any = null;

  // ── Step labels ──
  readonly teacherStepLabels = ['Account', 'Professional', 'Documents'];
  readonly studentStepLabels = ['Account', 'Course', 'Payment', 'Profile', 'Parent Info'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    this.loadBoards();
    this.loadZonals();
    this.loadCountries();
    this.querySub = this.route.queryParamMap.subscribe(params => {
      const role = (params.get('role') ?? 'student') as 'teacher' | 'student';
      this.selectedRole = role;
      this.currentStep = 1;
      this.showSuccess = false;
      this.errors = {};
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
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

  // ── Whether groups/subjects sections are shown ──
  get hasGroups(): boolean {
    return this.groups.length > 0;
  }

  get hasSubjects(): boolean {
    return this.subjects.length > 0;
  }

  // ── Role Selection ──
  selectRole(role: 'teacher' | 'student') {
    this.router.navigate(['/register'], { queryParams: { role } });
  }

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

  backToRole() {
    this.router.navigate(['/login']);
  }

  // ── Courses ──
  async loadCourses(classId: string) {
    this.coursesLoading = true;
    try {
      const data: any = await firstValueFrom(
        this.http.get(`${this.API}/courses/get-course-register/by-class/${classId}`)
      );
      this.courses = Array.isArray(data) ? data : data?.data || [];
    } catch (e: any) {
      this.toast('Failed to load courses: ' + (e.message || 'Unknown error'));
    }
    this.coursesLoading = false;
  }

  async loadZonals() {
    try {
      const data: any = await firstValueFrom(this.http.get(`${this.API}/zonal`));
      this.zonals = Array.isArray(data) ? data : data?.data || [];
    } catch (e: any) {
      this.toast('Failed to load zonals: ' + (e.message || 'Unknown error'));
    }
  }

  // ── Location Services ──

  async loadCountries() {
    this.countriesLoading = true;
    try {
      const data = await firstValueFrom(this.locationService.getCountries());
      this.countries = this.locationService.transformToDropdownFormat(data);
    } catch (e: any) {
      this.toast('Failed to load countries: ' + (e.message || 'Unknown error'));
      this.countries = [];
    }
    this.countriesLoading = false;
  }

  async onCountryChange(countryId: number | null) {
    this.states = [];
    this.cities = [];
    this.statesLoading = false;
    this.citiesLoading = false;

    if (this.selectedRole === 'student') {
      this.studentForm.stateId = null;
      this.studentForm.cityId = null;
    } else {
      this.teacherForm.stateId = null;
      this.teacherForm.cityId = null;
    }

    if (!countryId) return;

    this.statesLoading = true;
    try {
      const data = await firstValueFrom(this.locationService.getStatesByCountry(countryId));
      this.states = this.locationService.transformToDropdownFormat(data);
    } catch (e: any) {
      this.toast('Failed to load states: ' + (e.message || 'Unknown error'));
      this.states = [];
    }
    this.statesLoading = false;
  }

  async onStateChange(stateId: number | null) {
    this.cities = [];
    this.citiesLoading = false;

    if (this.selectedRole === 'student') {
      this.studentForm.cityId = null;
    } else {
      this.teacherForm.cityId = null;
    }

    if (!stateId) return;

    this.citiesLoading = true;
    try {
      const data = await firstValueFrom(this.locationService.getCitiesByState(stateId));
      this.cities = this.locationService.transformToDropdownFormat(data);
    } catch (e: any) {
      this.toast('Failed to load cities: ' + (e.message || 'Unknown error'));
      this.cities = [];
    }
    this.citiesLoading = false;
  }

  // ── Load Classes by boardId ──
  async loadClasses(boardId: string) {
    if (!boardId) {
      this.classes = [];
      this.groups = [];
      this.subjects = [];
      this.studentForm.classId = null;
      this.studentForm.groupId = null;
      this.studentForm.subjectIds = [];
      return;
    }
    this.classesLoading = true;
    this.classes = [];
    this.groups = [];
    this.subjects = [];
    this.studentForm.classId = null;
    this.studentForm.groupId = null;
    this.studentForm.subjectIds = [];
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

  // ── Load Groups by classId ──
  async loadGroups(classId: string) {
    this.groups = [];
    this.subjects = [];
    this.studentForm.groupId = null;
    this.studentForm.subjectIds = [];
    this.classId = classId; // Store classId for later use in subject loading

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

    // After loading groups, also load subjects
    if (!this.hasGroups) {
      await this.loadSubjects(classId, 'class');
    }
  }

  // ── Load Subjects by classId ──
  async loadSubjects(id: string,  mode: 'class' | 'group') {
    this.studentForm.subjectIds = [];
    this.subjects = [];
    if (!id) {
      if (mode === 'class') this.studentForm.currentGrade = '';
      return;
    }

    if (mode === 'class') {
      const selectedClass = this.classes.find((c) => c.id === id);
      if (selectedClass) {
        this.studentForm.currentGrade = selectedClass.name || '';
      }
    }

    this.subjectsLoading = true;
    try {
      let url: string;
      let params: any;

      if (mode === 'group') {
        // ✅ Use group endpoint
        url = `${this.API}/subject/get-subject/by-group`;
        params = { groupId: id, classId: this.classId };
      } else {
        // Use class endpoint (no groups scenario)
        url = `${this.API}/subject/get-subject/by-class`;
        params = { classId: id };
      }

      const data: any = await firstValueFrom(
        this.http.get(url, { params })
      );
      this.subjects = Array.isArray(data) ? data : data?.data || [];
    } catch {
      this.subjects = [];
    }
    this.subjectsLoading = false;
  }

  // ── On Board Selection ──
  onBoardSelect(boardId: string) {
    this.selectedBoardId = boardId;
    delete this.errors['boardId'];
    this.loadClasses(boardId);
  }

  // ── On Class Selection ──
  onClassSelect(classId: string | null) {
    this.studentForm.classId = classId;
    this.subjects = [];
    this.studentForm.subjectIds = [];
    delete this.errors['classId'];

    if (classId) {
      // Auto-fill grade immediately
      const selectedClass = this.classes.find((c) => c.id === classId);
      if (selectedClass) {
        this.studentForm.currentGrade = selectedClass.name || '';
      }
      this.loadGroups(classId);   // groups load first; subjects follow inside loadGroups
      this.loadCourses(classId);
    } else {
      this.groups = [];
      this.subjects = [];
      this.studentForm.groupId = null;
      this.studentForm.subjectIds = [];
      this.studentForm.currentGrade = '';
    }
  }

  // ── Subject toggle helper ──
  toggleSubject(subjectId: string) {
    const idx = this.studentForm.subjectIds.indexOf(subjectId);
    if (idx === -1) {
      this.studentForm.subjectIds.push(subjectId);
    } else {
      this.studentForm.subjectIds.splice(idx, 1);
    }
    delete this.errors['subjectIds'];
  }

  // ── Group selection ──
  selectGroup(groupId: string) {
    this.studentForm.groupId = groupId;
    this.studentForm.subjectIds = [];
    this.subjects = [];
    delete this.errors['groupId'];

    // ✅ KEY CHANGE: Load subjects by groupId when a group is selected
    this.loadSubjects(groupId, 'group');
  }

  async selectCourse(course: Course) {
    this.selectedCourse = course;
    this.selectedBatch = null;
    delete this.errors['course'];

    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API}/batches/get-batch-by-id/${course.id}`)
      );
      if (response) {
        this.selectedBatch = response;
      } else {
        this.selectedBatch = null;
      }
    } catch (error) {
      console.warn('Batch fetch failed', error);
      this.selectedBatch = null;
    }
  }

  // ── Payment type ──
  setPaymentType(type: 1 | 2) {
    this.paymentType = type;
  }

  // ═══════════════════════════════════════════════════
  //                   VALIDATION
  // ═══════════════════════════════════════════════════

  validateStep1(): boolean {
    this.errors = {};
    const { firstName, username, phone, email, password } = this.form;
    if (!firstName.trim()) this.errors['firstName'] = 'First name is required';
    if (!username.trim()) this.errors['username'] = 'Username is required';
    if (!phone.trim()) this.errors['phone'] = 'Phone is required';
    // if (!zonalId.trim()) this.errors['zonalId'] = 'Zonal is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      this.errors['email'] = 'Valid email is required';
    if (password.length < 8)
      this.errors['password'] = 'Minimum 8 characters required';
    return Object.keys(this.errors).length === 0;
  }

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
    if (!t.countryId) this.errors['countryId'] = 'Country is required';
    if (!t.stateId) this.errors['stateId'] = 'State is required';
    if (!t.cityId) this.errors['cityId'] = 'City is required';
    return Object.keys(this.errors).length === 0;
  }

  validateTeacherStep3(): boolean {
    this.errors = {};
    const t = this.teacherForm;
    if (!t.resumeUrl.trim()) this.errors['resumeUrl'] = 'Resume URL is required';
    if (!t.identityProofUrl.trim()) this.errors['identityProofUrl'] = 'Identity proof URL is required';
    if (!t.degreeCertificateUrl.trim()) this.errors['degreeCertificateUrl'] = 'Degree certificate URL is required';
    return Object.keys(this.errors).length === 0;
  }

  validateStudentStep2(): boolean {
    this.errors = {};
    if (!this.selectedBoardId) this.errors['boardId'] = 'Please select a board';
    const s = this.studentForm;
    if (!s.gender) this.errors['gender'] = 'Gender is required';
    if (!s.currentGrade.trim()) this.errors['currentGrade'] = 'Current grade is required';
    if (!s.address.trim()) this.errors['address'] = 'Address is required';
    if (!s.whatsAppNumber.trim()) this.errors['whatsAppNumber'] = 'WhatsApp number is required';
    if (!s.learningGoals.trim()) this.errors['learningGoals'] = 'Learning goals are required';
    if (!s.classId) this.errors['classId'] = 'Please select a class';
    if (!s.countryId) this.errors['countryId'] = 'Country is required';
    if (!s.stateId) this.errors['stateId'] = 'State is required';
    if (!s.cityId) this.errors['cityId'] = 'City is required';

    // Group is mandatory only if groups exist for the selected class
    if (s.classId && this.hasGroups && !s.groupId) {
      this.errors['groupId'] = 'Please select a group';
    }

    // Subjects are mandatory only if subjects exist for the selected class
    if (s.classId && this.hasSubjects && !s.subjectIds.length) {
      this.errors['subjectIds'] = 'Please select at least one subject';
    }

    return Object.keys(this.errors).length === 0;
  }

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

  validateStudentStep4(): boolean {
    this.errors = {};
    if (!this.selectedCourse) {
      this.errors['course'] = 'Please select a course';
      return false;
    }
    if (!this.selectedBatch) {
      this.errors['course'] = 'No active batch found for this course';
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
      if (!this.validateStudentStep4()) return; // Course
      this.currentStep = 3;
    } else if (this.currentStep === 3) {
      // Payment preview — no extra validation, course already validated
      this.currentStep = 4;
    } else if (this.currentStep === 4) {
      if (!this.validateStudentStep2()) return; // Profile
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
      const user: any = await firstValueFrom(
        this.http.post(`${this.API}/auth/teacher/register`, payload)
      );
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
        // zonalId: this.form.zonalId.trim(),
        password: this.form.password,
        phone: this.form.phone.trim(),
        countryId: t.countryId,
        stateId: t.stateId,
        cityId: t.cityId,
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
      countryId: t.countryId,
      stateId: t.stateId,
      cityId: t.cityId,
      resumeUrl: t.resumeUrl.trim(),
      identityProofUrl: t.identityProofUrl.trim(),
      degreeCertificateUrl: t.degreeCertificateUrl.trim(),
    };
  }

  // ═══════════════════════════════════════════════════
  //               STUDENT SUBMIT + RAZORPAY
  // ═══════════════════════════════════════════════════

  async submitStudent() {
    if (!this.validateStudentStep3()) return; // Parent Info (step 5)
    this.loading = true;
    this.loaderMsg = 'Creating your account...';

    try {
      const payload = this.buildStudentPayload();
      const user: any = await firstValueFrom(
        this.http.post(`${this.API}/auth/student/register`, payload)
      );
      const userId = user?.data?.userId || user?.userId;

      this.loaderMsg = 'Creating subscription...';

      const sub: any = await firstValueFrom(
        this.http.post(`${this.API}/subscription`, {
          userId,
          courseId: this.selectedCourse!.id,
          batchId: this.selectedBatch?.id ?? null,
          paymentType: this.paymentType,
        })
      );
      const subscriptionId = sub?.id || sub?.data?.id;

      this.loading = false;

      const isFree = (this.selectedCourse!.price || 0) === 0;

      if (isFree) {
        await this.recordPayment(subscriptionId, 0, 'FREE', user);
      } else {
        const payAmount =
          this.paymentType === 2 && this.selectedCourse!.installmentCount
            ? this.installmentAmount
            : this.netAmount;
        this.openRazorpay(payAmount, subscriptionId, userId, user);
      }
    } catch (e: any) {
      this.loading = false;
      this.toast(e?.error?.message || e?.message || 'Something went wrong');
    }
  }

  private buildStudentPayload() {
    const s = this.studentForm;
    return {
      batchId: this.selectedBatch?.id || '',
      boardId: this.selectedBoardId || null,
      isFreeDemoStudent: false,
      register: {
        // zonalId: this.form.zonalId.trim(),
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        userName: this.form.username.trim(),
        email: this.form.email.trim(),
        password: this.form.password,
        phone: this.form.phone.trim(),
        whatsAppNumber: s.whatsAppNumber.trim(),
        countryId: s.countryId,
        stateId: s.stateId,
        cityId: s.cityId,
      },
      gender: s.gender,
      address: s.address.trim(),
      currentGrade: s.currentGrade.trim(),
      classId: s.classId || null,
      groupId: s.groupId || null,
      subjectIds: s.subjectIds,
      learningGoals: s.learningGoals.trim(),
      parentName: s.parentName.trim(),
      relationship: s.relationship,
      parentEmail: s.parentEmail.trim(),
      parentPhone: s.parentPhone.trim(),

    };
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
      description: this.selectedCourse?.title || 'Course Subscription',
      prefill: {
        name: `${this.form.firstName} ${this.form.lastName}`.trim(),
        email: this.form.email,
        contact: this.form.phone,
      },
      theme: { color: '#2563eb' },
      handler: async (response: any) => {
        await this.recordPayment(subscriptionId, amount, response.razorpay_payment_id, user);
      },
      modal: {
        ondismiss: () => {
          this.toast('Payment cancelled. You can retry.');
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      this.showPaymentFailure = true;
      this.paymentFailureMsg = response.error?.description || 'Payment failed. Please try again.';
    });
    rzp.open();
  }

  async recordPayment(subscriptionId: string, amount: number, txnRef: string, user: any) {
    this.loading = true;
    this.loaderMsg = 'Recording payment...';
    try {
      await firstValueFrom(
        this.http.post(`${this.API}/subscription/pay`, {
          subscriptionId,
          amount,
          transactionReference: txnRef,
        })
      );
      this.loading = false;
      this.triggerSuccess('student', user, { subscriptionId, amount, txnRef });
    } catch (e: any) {
      this.loading = false;
      this.toast(e?.error?.message || 'Payment record failed');
    }
  }

  // ── Helpers ──

  retryPayment() {
    this.showPaymentFailure = false;
    this.paymentFailureMsg = '';
  }

  triggerSuccess(role: string, user: any, extra: any = {}) {
    this.showSuccess = true;
    this.successData = { role, user, extra, course: this.selectedCourse };
    this.toast('Registration successful! 🎉', 'success');

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 5000);
  }

  resetForm() {
    this.selectedRole = null;
    this.currentStep = 1;
    this.showSuccess = false;
    this.showPaymentFailure = false;
    this.paymentFailureMsg = '';
    this.successData = null;
    this.form = { firstName: '', lastName: '', username: '', phone: '', email: '', password: ''};
    this.teacherForm = {
      fullName: '', qualification: '', major: '', experience: 0,
      address: '', whatsAppNumber: '', hasHighSpeedInternet: false,
      readyForEarlyMorning: false, workingType: '', resumeUrl: '',
      identityProofUrl: '', degreeCertificateUrl: '',
      countryId: null, stateId: null, cityId: null,
    };
    this.studentForm = {
      gender: '',
      address: '',
      currentGrade: '',
      parentName: '',
      relationship: '',
      parentEmail: '',
      parentPhone: '',
      learningGoals: '',
      whatsAppNumber: '',
      classId: null,
      groupId: null,
      subjectIds: [],
      countryId: null,
      stateId: null,
      cityId: null,
    };
    this.selectedCourse = null;
    this.selectedBatch = null;
    this.selectedBoardId = '';
    this.paymentType = 1;
    this.classes = [];
    this.groups = [];
    this.subjects = [];
    this.states = [];
    this.cities = [];
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

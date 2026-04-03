import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DemoClassService, DemoClassDto, DemoRegisterPayload } from '../../../services/demo-class.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-demo-register',
  standalone: false,
  templateUrl: './demo-register.component.html',
  styleUrls: ['./demo-register.component.css'],
})
export class DemoRegisterComponent implements OnInit, OnDestroy {

  demoClasses: DemoClassDto[] = [];
  isLoading = false;

  // Selected class
  selectedClass: DemoClassDto | null = null;

  // Form
  studentName  = '';
  studentEmail = '';
  studentPhone = '';

  // Board
  boards: { id: string; name: string }[] = [];
  selectedBoardId = '';
  boardsLoading = false;

  // Class
  allClasses: { id: string; name: string; boardId: string }[] = [];
  filteredClasses: { id: string; name: string; boardId: string }[] = [];
  selectedClassId = '';
  classesLoading = false;

  // UI state
  isSubmitting  = false;
  showSuccess   = false;
  errorMsg      = '';
  errors: Record<string, string> = {};
  joinUrl       = '';
  urlCopied     = false;
  countdown     = '';
  canJoin       = false;

  private timerInterval: any = null;

  // Logged-in student (if any)
  private studentId: string | null = null;

  constructor(private demoClassService: DemoClassService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadClasses();
    this.detectLoggedInStudent();
    this.loadBoards();
    this.loadAllClasses();
  }

  private readonly FALLBACK_CLASSES: { id: string; name: string; boardId: string }[] = [
    { id: 'e5a18cdb-0681-47e0-9d5c-bde5b11a1b1f', name: 'Grade 1', boardId: '3097e4ae-7fab-44a1-a960-12e961a35173' },
    { id: 'db832d2a-0331-4585-91a8-435e9073360e', name: 'Grade 2', boardId: '3097e4ae-7fab-44a1-a960-12e961a35173' },
    { id: 'fe2bfdd6-6caa-48df-8439-6ba0da4b7683', name: 'Grade 3', boardId: '3097e4ae-7fab-44a1-a960-12e961a35173' },
    { id: '5810b6d7-4d4c-4cf9-bbf9-908bba2690ff', name: 'Grade 4', boardId: '3097e4ae-7fab-44a1-a960-12e961a35173' },
    { id: '22f27607-0687-44cd-a154-5d26f90f9546', name: 'Grade 5', boardId: '3097e4ae-7fab-44a1-a960-12e961a35173' },
  ];

  private readonly FALLBACK_BOARDS = [
    { id: '258c9777-7f4b-49bc-8bcd-ac479088a19f', name: 'IB' },
    { id: '2694b9bf-bf25-4941-9295-9428bcadebb4', name: 'Tamil Nadu State Board' },
    { id: '3097e4ae-7fab-44a1-a960-12e961a35173', name: 'CBSE' },
    { id: '3dfd2184-28da-414f-9040-998182b73b34', name: 'ICSE' },
    { id: '9d70735b-479f-4468-96f8-1823e5b4ee7c', name: 'Cambridge' },
  ];

  private loadAllClasses(): void {
    this.classesLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/class/get-classes`).subscribe({
      next: (data) => {
        const loaded = Array.isArray(data) ? data : [];
        this.allClasses = loaded.length ? loaded : this.FALLBACK_CLASSES;
        this.filterClassesByBoard();
        this.classesLoading = false;
      },
      error: () => {
        this.allClasses = this.FALLBACK_CLASSES;
        this.filterClassesByBoard();
        this.classesLoading = false;
      },
    });
  }

  filterClassesByBoard(): void {
    this.selectedClassId = '';
    this.filteredClasses = this.selectedBoardId
      ? this.allClasses.filter(c => c.boardId === this.selectedBoardId)
      : this.allClasses;
  }

  selectBoard(boardId: string): void {
    this.selectedBoardId = boardId;
    delete (this.errors as any)['boardId'];
    this.filterClassesByBoard();
  }

  private loadBoards(): void {
    this.boardsLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/board/get-boards`).subscribe({
      next: (data) => {
        const loaded = Array.isArray(data) ? data : [];
        this.boards = loaded.length ? loaded : this.FALLBACK_BOARDS;
        this.boardsLoading = false;
      },
      error: () => {
        this.boards = this.FALLBACK_BOARDS;
        this.boardsLoading = false;
      },
    });
  }

  private loadClasses(): void {
    this.isLoading = true;
    this.demoClassService.getAll().subscribe({
      next: (res: any) => {
        const all: DemoClassDto[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.demoClasses = all.filter(d => d.status === 'Scheduled');
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  private detectLoggedInStudent(): void {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = (payload.roleName ?? '').toString().toLowerCase();
      if (role === 'student') {
        this.studentId = payload.userId ?? null;
      }
    } catch {}
  }

  selectClass(d: DemoClassDto): void {
    this.selectedClass = d;
    this.showSuccess   = false;
    this.errorMsg      = '';
    this.errors        = {};
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private startCountdown(): void {
    this.clearTimer();
    this.updateCountdown();
    this.timerInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  private updateCountdown(): void {
    if (!this.selectedClass) return;
    const datePart = this.selectedClass.scheduledDate.substring(0, 10);
    const target = new Date(`${datePart}T${this.selectedClass.startTime}`);
    const diff = target.getTime() - Date.now();
    if (diff <= 0) {
      this.canJoin   = true;
      this.countdown = '';
      this.clearTimer();
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    parts.push(`${String(m).padStart(2, '0')}m`);
    parts.push(`${String(s).padStart(2, '0')}s`);
    this.countdown = parts.join(' ');
  }

  copyUrl(): void {
    if (!this.joinUrl) return;
    navigator.clipboard.writeText(this.joinUrl).then(() => {
      this.urlCopied = true;
      setTimeout(() => (this.urlCopied = false), 2500);
    });
  }

  backToList(): void {
    this.selectedClass  = null;
    this.showSuccess    = false;
    this.errorMsg       = '';
    this.errors         = {};
    this.studentName    = '';
    this.studentEmail   = '';
    this.studentPhone   = '';
    this.selectedBoardId = '';
    this.selectedClassId = '';
    this.filteredClasses = [];
    this.joinUrl         = '';
    this.urlCopied       = false;
    this.countdown       = '';
    this.canJoin         = false;
    this.clearTimer();
  }

  get isFull(): boolean {
    return !!this.selectedClass && this.selectedClass.registeredCount >= this.selectedClass.maxStudents;
  }

  validate(): boolean {
    this.errors = {};
    if (!this.selectedBoardId)     this.errors['boardId']  = 'Please select a board';
    if (!this.selectedClassId)     this.errors['classId']  = 'Please select a class';
    if (!this.studentName.trim())  this.errors['name']     = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.studentEmail))
      this.errors['email'] = 'Valid email is required';
    if (!this.studentPhone.trim()) this.errors['phone']    = 'Phone is required';
    return Object.keys(this.errors).length === 0;
  }

  submit(): void {
    if (!this.validate() || !this.selectedClass) return;
    this.isSubmitting = true;
    this.errorMsg     = '';

    const payload: DemoRegisterPayload = {
      demoClassId:  this.selectedClass.id,
      studentName:  this.studentName.trim(),
      studentEmail: this.studentEmail.trim(),
      studentPhone: this.studentPhone.trim(),
      studentId:    this.studentId,
      boardId:      this.selectedBoardId || undefined,
      classId:      this.selectedClassId || undefined,
    };

    this.demoClassService.register(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.joinUrl      = res.joinUrl || '';
        this.showSuccess  = true;
        this.startCountdown();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.errorMsg = err?.error?.message || 'Registration failed. Please try again.';
      },
    });
  }
}

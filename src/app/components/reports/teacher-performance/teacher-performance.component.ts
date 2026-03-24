import { Component, OnInit } from '@angular/core';
import { HttpGeneralService } from '../../../services/http.service';
import {
  PerformanceService,
  TeacherPerformanceRecord,
  TeacherPerformanceStats,
  TeacherDetail,
} from '../../../services/performance.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

@Component({
  selector: 'app-teacher-performance',
  standalone: false,
  templateUrl: './teacher-performance.component.html',
  styleUrls: ['../../../shared-page.css', './teacher-performance.component.css'],
})
export class TeacherPerformanceComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────────────────
  records: TeacherPerformanceRecord[] = [];
  filtered: TeacherPerformanceRecord[] = [];
  teachers: { id: string; name: string }[] = [];

  stats: TeacherPerformanceStats = {
    totalTeachers: 0,
    totalHoursDelivered: 0,
    totalClassesDelivered: 0,
    avgHoursPerTeacher: 0,
  };

  // ── Detail modal ──────────────────────────────────────────────────────────
  detailOpen    = false;
  detailLoading = false;
  detail: TeacherDetail | null = null;

  // ── UI state ──────────────────────────────────────────────────────────────
  isLoading     = false;
  searchQuery   = '';
  teacherFilter = '';

  // ── Pagination ────────────────────────────────────────────────────────────
  pageSize    = 10;
  currentPage = 1;

  get paged(): TeacherPerformanceRecord[] {
    return this.filtered.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize);
  }

  onPageChange(page: number): void { this.currentPage = page; }

  constructor(
    private performanceService: PerformanceService,
    private httpService: HttpGeneralService<any>,
    private commonService: CommonService,
  ) {}

  ngOnInit(): void {
    this.loadTeacherList();
    this.load();
  }

  private loadTeacherList(): void {
    this.httpService.getData(BASE_URL, '/users').subscribe({
      next: (res: any) => {
        const users: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.teachers = users
          .filter(u => (u.roleName ?? u.role ?? '').toString().toLowerCase() === 'teacher')
          .map(u => ({
            id: u.id,
            name: (`${u.firstName ?? ''} ${u.lastName ?? ''}`).trim() || u.userName || u.email || u.id,
          }));
      },
      error: () => {},
    });
  }

  load(): void {
    this.isLoading = true;
    this.performanceService.getTeachers(this.teacherFilter || undefined).subscribe({
      next: (res) => {
        this.stats   = res.stats;
        this.records = res.records;
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load teacher performance.');
        this.isLoading = false;
      },
    });
  }

  onTeacherChange(): void { this.load(); }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.records.filter(r =>
      !q || r.teacherName.toLowerCase().includes(q)
    );
    this.currentPage = 1;
  }

  // ── Detail modal ──────────────────────────────────────────────────────────

  openDetail(r: TeacherPerformanceRecord): void {
    this.detail       = null;
    this.detailOpen   = true;
    this.detailLoading = true;
    this.performanceService.getTeacher(r.teacherId).subscribe({
      next: (d) => { this.detail = d; this.detailLoading = false; },
      error: () => {
        this.commonService.error('Failed to load teacher detail.');
        this.detailLoading = false;
        this.detailOpen    = false;
      },
    });
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.detail     = null;
  }
}

import { Component, OnInit } from '@angular/core';
import { HttpGeneralService } from '../../../services/http.service';
import {
  PerformanceService,
  StudentPerformanceRecord,
  StudentPerformanceStats,
  StudentDetail,
} from '../../../services/performance.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

@Component({
  selector: 'app-student-performance',
  standalone: false,
  templateUrl: './student-performance.component.html',
  styleUrls: ['../../../shared-page.css', './student-performance.component.css'],
})
export class StudentPerformanceComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────────────────
  records: StudentPerformanceRecord[] = [];
  filtered: StudentPerformanceRecord[] = [];
  batches: { id: string; name: string }[] = [];

  stats: StudentPerformanceStats = {
    totalStudents: 0,
    avgOverallScore: 0,
    topPerformers: 0,
    needSupport: 0,
  };

  // ── Detail modal ──────────────────────────────────────────────────────────
  detailOpen    = false;
  detailLoading = false;
  detail: StudentDetail | null = null;

  // ── UI state ──────────────────────────────────────────────────────────────
  isLoading   = false;
  searchQuery = '';
  batchFilter = '';

  // ── Pagination ────────────────────────────────────────────────────────────
  pageSize    = 10;
  currentPage = 1;

  get paged(): StudentPerformanceRecord[] {
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
    this.loadBatches();
    this.load();
  }

  private loadBatches(): void {
    this.httpService.getData(BASE_URL, '/batches').subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.batches = raw.map(b => ({ id: b.id, name: b.name || b.batchName || b.id }));
      },
      error: () => {},
    });
  }

  load(): void {
    this.isLoading = true;
    this.performanceService.getStudents(this.batchFilter || undefined).subscribe({
      next: (res) => {
        this.stats   = res.stats;
        this.records = res.records;
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load student performance.');
        this.isLoading = false;
      },
    });
  }

  onBatchChange(): void { this.load(); }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.records.filter(r =>
      !q ||
      r.studentName.toLowerCase().includes(q) ||
      r.batchName.toLowerCase().includes(q)
    );
    this.currentPage = 1;
  }

  // ── Detail modal ──────────────────────────────────────────────────────────

  openDetail(r: StudentPerformanceRecord): void {
    this.detail      = null;
    this.detailOpen  = true;
    this.detailLoading = true;
    this.performanceService.getStudent(r.studentId).subscribe({
      next: (d) => { this.detail = d; this.detailLoading = false; },
      error: () => {
        this.commonService.error('Failed to load student detail.');
        this.detailLoading = false;
        this.detailOpen    = false;
      },
    });
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.detail     = null;
  }

  hwStatusClass(item: any): string {
    if (item.graded)    return 'sp-hw-graded';
    if (item.submitted) return 'sp-hw-submitted';
    return 'sp-hw-missing';
  }

  hwStatusLabel(item: any): string {
    if (item.graded)    return 'Graded';
    if (item.submitted) return 'Submitted';
    return 'Not Submitted';
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  gradeColor(grade: string): string {
    switch (grade) {
      case 'A': return 'pg-badge--green';
      case 'B': return 'pg-badge--blue';
      case 'C': return 'pg-badge--amber';
      case 'D': return 'pg-badge--orange';
      default:  return 'pg-badge--red';
    }
  }

  scoreBarColor(score: number): string {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }
}

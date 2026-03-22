import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, switchMap, catchError, of } from 'rxjs';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

export interface AttendanceRecord {
  studentId: string;
  student: string;
  batch: string;
  class: string;
  presentDays: number;
  totalDays: number;
  percentage: number;
  lastAttended: string;
  status: 'regular' | 'irregular' | 'absent';
}

export interface AttendanceStats {
  totalStudents: number;
  avgAttendance: number;
  regularCount: number;
  irregularCount: number;
  absentCount: number;
}

export interface AttendanceResponse {
  stats: AttendanceStats;
  records: AttendanceRecord[];
}

@Component({
  selector: 'app-attendance-report',
  standalone: false,
  templateUrl: './attendance-report.component.html',
  styleUrls: ['../../../shared-page.css', './attendance-report.component.css']
})
export class AttendanceReportComponent implements OnInit {

  private readonly API_URL = `${environment.apiUrl}/reports/attendants`;

  searchQuery = '';
  statusFilter = '';
  batchIdFilter: string | null = null;

  records: AttendanceRecord[] = [];
  stats: AttendanceStats = {
    totalStudents: 0,
    avgAttendance: 0,
    regularCount: 0,
    irregularCount: 0,
    absentCount: 0
  };

  isLoading = false;
  errorMessage = '';

  private filterChange$ = new Subject<void>();

  constructor(private httpService: HttpGeneralService<any>) {}

  ngOnInit(): void {
    // Debounce filter/search changes to avoid excessive API calls
    this.filterChange$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => this.fetchAttendance())
      )
      .subscribe({
        next: (data) => this.handleResponse(data),
        error: (err) => this.handleError(err)
      });

    // Initial load
    this.loadAttendance();
  }

  onSearchChange(value?: string): void {
    if (value !== undefined) this.searchQuery = value;
    this.filterChange$.next();
  }

  onStatusFilterChange(): void {
    this.filterChange$.next();
  }

  /** Alias used by some template variants */
  onStatusChange(value?: string): void {
    if (value !== undefined) this.statusFilter = value;
    this.filterChange$.next();
  }

  /** Alias used by some template variants */
  retryLoad(): void {
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.fetchAttendance()
      .pipe(catchError(err => { this.handleError(err); return of(null); }))
      .subscribe(data => {
        if (data) this.handleResponse(data);
        this.isLoading = false;
      });
  }

   private fetchAttendance() {
    const params: string[] = [];

    if (this.batchIdFilter) {
      params.push(`batchId=${encodeURIComponent(this.batchIdFilter)}`);
    }
    if (this.searchQuery?.trim()) {
      params.push(`search=${encodeURIComponent(this.searchQuery.trim())}`);
    }
    if (this.statusFilter) {
      params.push(`status=${encodeURIComponent(this.statusFilter)}`);
    }

    const queryString = params.length ? `?${params.join('&')}` : '';
    const apiRoute = `${this.API_URL}${queryString}`;

    return this.httpService.getData('', apiRoute);
  }

  private handleResponse(data: AttendanceResponse): void {
    this.records = data.records ?? [];
    this.stats = data.stats ?? {
      totalStudents: 0,
      avgAttendance: 0,
      regularCount: 0,
      irregularCount: 0,
      absentCount: 0
    };
    this.isLoading = false;
    this.errorMessage = '';
  }

  private handleError(err: any): void {
    console.error('Failed to load attendance data:', err);
    this.errorMessage = 'Failed to load attendance data. Please try again.';
    this.isLoading = false;
  }

  // Stats are now driven by the API response (server-side filtering)
  get avgAttendance(): number { return this.stats.avgAttendance; }
  get regularCount(): number { return this.stats.regularCount; }
  get irregularCount(): number { return this.stats.irregularCount; }
  get absentCount(): number { return this.stats.absentCount; }

  // filteredRecords now reflects whatever the API returned
  get filteredRecords(): AttendanceRecord[] {
    return this.records;
  }

  percentageColor(pct: number): string {
    if (pct >= 85) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      regular: 'pg-badge--green',
      irregular: 'pg-badge--yellow',
      absent: 'pg-badge--red'
    };
    return map[status] || 'pg-badge--gray';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

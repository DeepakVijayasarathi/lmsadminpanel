import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs/operators';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

export interface PerformanceRecord {
  studentId: string;
  student: string;
  batch: string;
  subject: string;
  avgScore: number;
  quizzesTaken: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PerformanceStats {
  studentsTracked: number;
  avgScore: number;
  topPerformers: number;
  needSupport: number;
}

export interface PerformanceResponse {
  stats: PerformanceStats;
  records: PerformanceRecord[];
  subjects: string[];
}

@Component({
  selector: 'app-performance-report',
  standalone: false,
  templateUrl: './performance-report.component.html',
  styleUrls: ['../../../shared-page.css', './performance-report.component.css']
})
export class PerformanceReportComponent implements OnInit, OnDestroy {
  private readonly API_URL = `${environment.apiUrl}/reports/performance`;
  private destroy$ = new Subject<void>();
  private filterChange$ = new Subject<void>();

  searchQuery = '';
  subjectFilter = '';

  records: PerformanceRecord[] = [];
  subjects: string[] = [];

  stats: PerformanceStats = {
    studentsTracked: 0,
    avgScore: 0,
    topPerformers: 0,
    needSupport: 0
  };

  isLoading = false;
  error: string | null = null;

  constructor(private httpService: HttpGeneralService<any>) {}

  ngOnInit(): void {
    this.filterChange$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => {
          this.isLoading = true;
          this.error = null;

          const params: string[] = [];
          if (this.searchQuery?.trim()) {
            params.push(`search=${encodeURIComponent(this.searchQuery.trim())}`);
          }
          if (this.subjectFilter) {
            params.push(`subject=${encodeURIComponent(this.subjectFilter)}`);
          }

          const apiRoute = `${this.API_URL}${params.length ? '?' + params.join('&') : ''}`;

          return this.httpService.getData('', apiRoute);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.records = response.records;
          this.subjects = response.subjects;
          this.stats = response.stats;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch performance data:', err);
          this.error = 'Failed to load performance data. Please try again.';
          this.isLoading = false;
        }
      });

    // Trigger initial load
    this.filterChange$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(): void {
    this.filterChange$.next();
  }

  onSubjectChange(): void {
    this.filterChange$.next();
  }

  // Stats pulled from API response (not computed locally)
  get studentsTracked(): number { return this.stats.studentsTracked; }
  get avgScore(): number { return this.stats.avgScore; }
  get topPerformers(): number { return this.stats.topPerformers; }
  get needSupport(): number { return this.stats.needSupport; }

  scoreColor(score: number): string {
    if (score >= 85) return '#10b981';
    if (score >= 65) return '#f59e0b';
    return '#ef4444';
  }
}

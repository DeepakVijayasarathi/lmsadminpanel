import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

export interface RevenueRecord {
  month: string;
  year: string;
  subscriptions: number;
  courseFees: number;
  batchFees: number;
  total: number;
  growth: number;
}

export interface RevenueStats {
  totalRevenue: number;
  totalSubscriptions: number;
  totalCourseFees: number;
  latestMonthTotal: number;
  latestMonthLabel: string;
}

export interface RevenueResponse {
  stats: RevenueStats;
  records: RevenueRecord[];
}

@Component({
  selector: 'app-revenue-report',
  standalone: false,
  templateUrl: './revenue-report.component.html',
  styleUrls: ['../../../shared-page.css', './revenue-report.component.css']
})
export class RevenueReportComponent implements OnInit, OnDestroy {
  private readonly API_URL = `${environment.apiUrl}/reports/revenue`;
  private destroy$ = new Subject<void>();
  private filterChange$ = new Subject<void>();

  yearFilter = '';

  records: RevenueRecord[] = [];

  stats: RevenueStats = {
    totalRevenue: 0,
    totalSubscriptions: 0,
    totalCourseFees: 0,
    latestMonthTotal: 0,
    latestMonthLabel: ''
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

          const queryString = this.yearFilter
            ? `?year=${encodeURIComponent(this.yearFilter)}`
            : '';
          const apiRoute = `${this.API_URL}${queryString}`;

          return this.httpService.getData('', apiRoute);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.records = response.records;
          this.stats = response.stats;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch revenue data:', err);
          this.error = 'Failed to load revenue data. Please try again.';
          this.isLoading = false;
        }
      });

    // Initial load
    this.filterChange$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onYearChange(): void {
    this.filterChange$.next();
  }

  // Stats from API response
  get totalRevenue(): number { return this.stats.totalRevenue; }
  get totalSubscriptions(): number { return this.stats.totalSubscriptions; }
  get totalCourseFees(): number { return this.stats.totalCourseFees; }
  get latestMonthTotal(): number { return this.stats.latestMonthTotal; }
  get latestMonthLabel(): string { return this.stats.latestMonthLabel; }

  formatAmount(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }

  growthColor(growth: number): string {
    return growth >= 0 ? '#10b981' : '#ef4444';
  }

  growthIcon(growth: number): string {
    return growth >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
  }
}

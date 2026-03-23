import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import { Permission, PermissionService } from '../../../auth/permission.service';

const BASE_URL = environment.apiUrl;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Quiz {
  id: string;
  title: string;
}

/**
 * Shape returned by GET /api/quiz/{id}/result.
 * Adjust field names below if your API returns different keys.
 */
export interface QuizResult {
  id?: string;
  studentName?: string;        // student display name
  studentId?: string;
  quizTitle?: string;
  score?: number;
  totalMarks?: number;
  passingMarks?: number;
  percentage?: number;
  isPassed?: boolean;
  submittedAt?: string;
  timeTakenMinutes?: number;
}

/**
 * Shape returned by GET /api/quiz/{id}/leaderboard.
 */
export interface LeaderboardEntry {
  rank?: number;
  studentId?: string;
  studentName?: string;
  score?: number;
  percentage?: number;
  timeTakenMinutes?: number;
}

type ResultView = 'results' | 'leaderboard';

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-results',
  standalone: false,
  templateUrl: './results.component.html',
  styleUrls: ['../../../shared-page.css', './results.component.css'],
})
export class ResultsComponent implements OnInit {
  // ── Quiz list for selector ─────────────────────────────────────
  quizzes: Quiz[] = [];
  selectedQuizId: string = '';
  quizzesLoading: boolean = false;

  // ── Result & leaderboard data ──────────────────────────────────
  results: QuizResult[] = [];
  leaderboard: LeaderboardEntry[] = [];

  // ── View toggle ────────────────────────────────────────────────
  activeView: ResultView = 'results';

  // ── Loading & search ───────────────────────────────────────────
  resultsLoading: boolean = false;
  leaderboardLoading: boolean = false;
  searchQuery: string = '';
  gradeFilter: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadQuizzes();
  }

  get p(): Permission {
    return this.permissionService.for(this.router.url);
  }

  // ════════════════════════════════════════════════════════════════
  //  API CALLS
  // ════════════════════════════════════════════════════════════════

  /** GET /api/quiz  — populate quiz selector */
  loadQuizzes(): void {
    this.quizzesLoading = true;
    this.httpService.getData(BASE_URL, '/quiz').subscribe({
      next: (res: any) => {
        this.quizzes = Array.isArray(res) ? res : (res?.data ?? []);
        // Auto-select the first quiz if available
        if (this.quizzes.length > 0) {
          this.selectedQuizId = this.quizzes[0].id;
          this.onQuizChange();
        }
        this.quizzesLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load quizzes.');
        this.quizzesLoading = false;
      },
    });
  }

  /** GET /api/quiz/{id}/result */
  loadResults(): void {
    if (!this.selectedQuizId) return;
    this.resultsLoading = true;
    this.results = [];
    this.httpService
      .getData(BASE_URL, `/quiz/${this.selectedQuizId}/result`)
      .subscribe({
        next: (res: any) => {
          this.results = Array.isArray(res) ? res : (res?.data ?? []);
          this.resultsLoading = false;
        },
        error: () => {
          this.commonService.error('Failed to load results.');
          this.resultsLoading = false;
        },
      });
  }

  /** GET /api/quiz/{id}/leaderboard */
  loadLeaderboard(): void {
    if (!this.selectedQuizId) return;
    this.leaderboardLoading = true;
    this.leaderboard = [];
    this.httpService
      .getData(BASE_URL, `/api/quiz/${this.selectedQuizId}/leaderboard`)
      .subscribe({
        next: (res: any) => {
          this.leaderboard = Array.isArray(res) ? res : (res?.data ?? []);
          this.leaderboardLoading = false;
        },
        error: () => {
          this.commonService.error('Failed to load leaderboard.');
          this.leaderboardLoading = false;
        },
      });
  }

  // ════════════════════════════════════════════════════════════════
  //  EVENT HANDLERS
  // ════════════════════════════════════════════════════════════════

  /** Called whenever the quiz selector changes */
  onQuizChange(): void {
    this.results = [];
    this.leaderboard = [];
    if (this.activeView === 'results') {
      this.loadResults();
    } else {
      this.loadLeaderboard();
    }
  }

  /** Switch between Results and Leaderboard tab */
  setView(view: ResultView): void {
    this.activeView = view;
    if (view === 'results' && this.results.length === 0) {
      this.loadResults();
    } else if (view === 'leaderboard' && this.leaderboard.length === 0) {
      this.loadLeaderboard();
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  DISPLAY HELPERS
  // ════════════════════════════════════════════════════════════════

  get selectedQuizTitle(): string {
    return this.quizzes.find((q) => q.id === this.selectedQuizId)?.title ?? '';
  }

  get totalSubmissions(): number {
    return this.results.length;
  }

  get passRate(): string {
    if (!this.results.length) return '—';
    const passed = this.results.filter((r) => r.isPassed).length;
    return Math.round((passed / this.results.length) * 100) + '%';
  }

  get avgScore(): string {
    if (!this.results.length) return '—';
    const avg =
      this.results.reduce((s, r) => s + (r.percentage ?? 0), 0) /
      this.results.length;
    return Math.round(avg) + '%';
  }

  get topScore(): string {
    if (!this.results.length) return '—';
    const top = Math.max(...this.results.map((r) => r.score ?? 0));
    return String(top);
  }

  /** Derive a letter grade from percentage */
  getGrade(percentage?: number): string {
    if (percentage == null) return '—';
    if (percentage >= 90) return 'A+';
    if (percentage >= 75) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 40) return 'C';
    return 'F';
  }

  gradeBadge(grade: string): string {
    const map: Record<string, string> = {
      'A+': 'pg-badge--purple',
      A: 'pg-badge--indigo',
      B: 'pg-badge--sky',
      C: 'pg-badge--yellow',
      F: 'pg-badge--red',
    };
    return map[grade] ?? 'pg-badge--gray';
  }

  getInitial(name?: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /** Filtered results for the table */
  get filteredResults(): QuizResult[] {
    let list = [...this.results];
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) =>
          r.studentName?.toLowerCase().includes(q) ||
          r.quizTitle?.toLowerCase().includes(q),
      );
    }
    if (this.gradeFilter) {
      list = list.filter(
        (r) => this.getGrade(r.percentage) === this.gradeFilter,
      );
    }
    return list;
  }
}

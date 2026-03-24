import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import {
  Permission,
  PermissionService,
} from '../../../auth/permission.service';

const BASE_URL = environment.apiUrl;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Quiz {
  id: string;
  title: string;
}

/** Actual shape returned by GET /api/quiz/{id}/result */
export interface QuizResult {
  quizId?: string;
  studentId?: string;
  studentName?: string; // may not be returned; shown as '—' if absent
  score?: number;
  totalMarks?: number;
  passingMarks?: number;
  correctCount?: number;
  wrongCount?: number;
  passed?: boolean; // API field (not isPassed)
  status?: string; // "Pass" | "Fail"
  attemptDate?: string; // API field (not submittedAt)
  timeTakenMinutes?: number; // may be absent
  questionResults?: QuestionResult[];
}

export interface QuestionResult {
  questionId?: string;
  questionText?: string;
  selectedOption?: string;
  correctOption?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
}

/** Shape returned by GET /api/quiz/{id}/leaderboard */
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

  loadQuizzes(): void {
    this.quizzesLoading = true;
    this.httpService.getData(BASE_URL, '/quiz').subscribe({
      next: (res: any) => {
        this.quizzes = Array.isArray(res) ? res : (res?.data ?? []);
        this.quizzesLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load quizzes.');
        this.quizzesLoading = false;
      },
    });
  }

  /**
   * GET /api/quiz/{id}/result
   * Response may be a single object OR an array — handled below.
   */
  loadResults(): void {
    if (!this.selectedQuizId) return;
    this.resultsLoading = true;
    this.results = [];
    this.httpService
      .getData(BASE_URL, `/quiz/${this.selectedQuizId}/result`)
      .subscribe({
        next: (res: any) => {
          // Normalise: wrap single object in array
          if (Array.isArray(res)) {
            this.results = res;
          } else if (res?.data) {
            this.results = Array.isArray(res.data) ? res.data : [res.data];
          } else if (res && typeof res === 'object') {
            this.results = [res];
          } else {
            this.results = [];
          }
          this.resultsLoading = false;
        },
        error: () => {
          this.commonService.error('Failed to load results.');
          this.resultsLoading = false;
        },
      });
  }

  loadLeaderboard(): void {
    if (!this.selectedQuizId) return;
    this.leaderboardLoading = true;
    this.leaderboard = [];
    this.httpService
      .getData(BASE_URL, `/quiz/${this.selectedQuizId}/leaderboard`)
      .subscribe({
        next: (res: any) => {
          if (Array.isArray(res)) {
            this.leaderboard = res;
          } else if (res?.data) {
            this.leaderboard = Array.isArray(res.data) ? res.data : [res.data];
          } else {
            this.leaderboard = [];
          }
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

  onQuizChange(): void {
    this.results = [];
    this.leaderboard = [];
    this.searchQuery = '';
    this.gradeFilter = '';
    if (this.activeView === 'results') {
      this.loadResults();
    } else {
      this.loadLeaderboard();
    }
  }

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
    const passed = this.results.filter((r) => r.passed).length;
    return Math.round((passed / this.results.length) * 100) + '%';
  }

  get avgScore(): string {
    if (!this.results.length) return '—';
    const avg =
      this.results.reduce((s, r) => s + this.getPercentage(r), 0) /
      this.results.length;
    return Math.round(avg) + '%';
  }

  get topScore(): string {
    if (!this.results.length) return '—';
    const top = Math.max(...this.results.map((r) => r.score ?? 0));
    return String(top);
  }

  /**
   * Compute percentage: prefer API field, fall back to score/totalMarks.
   */
  getPercentage(r: QuizResult): number {
    if (r.score != null && r.totalMarks != null && r.totalMarks > 0) {
      return Math.round((r.score / r.totalMarks) * 100);
    }
    return 0;
  }

  getGrade(r: QuizResult): string {
    const pct = this.getPercentage(r);
    if (pct >= 90) return 'A+';
    if (pct >= 75) return 'A';
    if (pct >= 60) return 'B';
    if (pct >= 40) return 'C';
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

  /** Use attemptDate (API field) for display */
  formatDate(r: QuizResult): string {
    const dateStr = r.attemptDate ?? (r as any).submittedAt;
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  get filteredResults(): QuizResult[] {
    let list = [...this.results];
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) =>
          r.studentName?.toLowerCase().includes(q) ||
          r.studentId?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q),
      );
    }
    if (this.gradeFilter) {
      list = list.filter((r) => this.getGrade(r) === this.gradeFilter);
    }
    return list;
  }
}

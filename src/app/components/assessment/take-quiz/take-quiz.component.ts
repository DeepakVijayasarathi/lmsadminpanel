import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface QuizInfo {
  id: string;
  title: string;
  description: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
}

export interface AttendQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
}

type QuizPhase = 'loading' | 'intro' | 'in-progress' | 'submitting' | 'result';

export interface QuizResult {
  score?: number;
  totalMarks?: number;
  passingMarks?: number;
  passed?: boolean;
  correctCount?: number;
  totalQuestions?: number;
  questionResults?: any[];
  [key: string]: any;
}

@Component({
  selector: 'app-take-quiz',
  standalone: false,
  templateUrl: './take-quiz.component.html',
  styleUrls: ['./take-quiz.component.css'],
})
export class TakeQuizComponent implements OnInit, OnDestroy {
  quizId: string = '';
  quiz: QuizInfo | null = null;
  questions: AttendQuestion[] = [];

  phase: QuizPhase = 'loading';

  // Timer
  timeRemainingSeconds: number = 0;
  private timerInterval: any = null;

  // Answers map: questionId -> selected option ('A'|'B'|'C'|'D')
  answers: Record<string, string> = {};

  // Navigation
  currentIndex: number = 0;

  // Result
  result: QuizResult | null = null;

  readonly optionKeys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  readonly optionLabels: Record<string, string> = {
    A: 'optionA',
    B: 'optionB',
    C: 'optionC',
    D: 'optionD',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.quizId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.quizId) {
      this.commonService.error('No quiz ID provided.');
      this.router.navigate(['/exams']);
      return;
    }
    this.loadQuizInfo();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // ── Load quiz info ─────────────────────────────────────
  loadQuizInfo(): void {
    this.phase = 'loading';
    this.httpService.getData(BASE_URL, `/quiz/${this.quizId}`).subscribe({
      next: (res: any) => {
        this.quiz = res?.data ?? res;
        this.loadQuestions();
      },
      error: () => {
        this.commonService.error('Failed to load quiz.');
        this.phase = 'intro';
      },
    });
  }

  loadQuestions(): void {
    this.httpService
      .getData(BASE_URL, `/quiz/${this.quizId}/questions`)
      .subscribe({
        next: (res: any) => {
          this.questions = Array.isArray(res) ? res : (res?.data ?? []);
          this.phase = 'intro';
        },
        error: () => {
          this.commonService.error('Failed to load questions.');
          this.phase = 'intro';
        },
      });
  }

  // ── Start quiz ─────────────────────────────────────────
  startQuiz(): void {
    this.httpService
      .postData(BASE_URL, `/quiz/${this.quizId}/start`, {})
      .subscribe({
        next: () => {
          this.answers = {};
          this.currentIndex = 0;
          this.timeRemainingSeconds = (this.quiz?.durationMinutes ?? 60) * 60;
          this.phase = 'in-progress';
          this.startTimer();
        },
        error: (err: any) => {
          // If start fails (e.g. already started), proceed anyway
          this.answers = {};
          this.currentIndex = 0;
          this.timeRemainingSeconds = (this.quiz?.durationMinutes ?? 60) * 60;
          this.phase = 'in-progress';
          this.startTimer();
        },
      });
  }

  // ── Timer ──────────────────────────────────────────────
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemainingSeconds--;
      if (this.timeRemainingSeconds <= 0) {
        this.clearTimer();
        this.submitQuiz(true);
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get timerDisplay(): string {
    const m = Math.floor(this.timeRemainingSeconds / 60);
    const s = this.timeRemainingSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  get timerWarning(): boolean {
    return this.timeRemainingSeconds <= 60;
  }

  get timerCritical(): boolean {
    return this.timeRemainingSeconds <= 30;
  }

  // ── Navigation ─────────────────────────────────────────
  get currentQuestion(): AttendQuestion | null {
    return this.questions[this.currentIndex] ?? null;
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
    }
  }

  prev(): void {
    this.goTo(this.currentIndex - 1);
  }
  next(): void {
    this.goTo(this.currentIndex + 1);
  }

  selectOption(option: string): void {
    if (!this.currentQuestion) return;
    this.answers[this.currentQuestion.id] = option;
  }

  getOptionText(q: AttendQuestion, opt: 'A' | 'B' | 'C' | 'D'): string {
    return (q as any)[`option${opt}`] ?? '';
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  get unansweredCount(): number {
    return this.questions.length - this.answeredCount;
  }

  isAnswered(index: number): boolean {
    const q = this.questions[index];
    return q ? !!this.answers[q.id] : false;
  }

  // ── Submit ─────────────────────────────────────────────
  submitQuiz(autoSubmit = false): void {
    this.clearTimer();
    this.phase = 'submitting';

    const payload = { answers: this.answers };
    this.httpService
      .postData(BASE_URL, `/quiz/${this.quizId}/submit`, payload)
      .subscribe({
        next: (res: any) => {
          this.result = res?.data ?? res ?? {};
          this.phase = 'result';
        },
        error: (err: any) => {
          this.result = {};
          this.phase = 'result';
          if (!autoSubmit) {
            this.commonService.error(
              err?.error?.message || 'Submission completed.',
            );
          }
        },
      });
  }

  retakeQuiz(): void {
    this.phase = 'intro';
    this.result = null;
    this.answers = {};
    this.currentIndex = 0;
    this.clearTimer();
  }

  goBack(): void {
    this.router.navigate(['/my-quizzes']);
  }

  get progressPercent(): number {
    if (!this.questions.length) return 0;
    return Math.round((this.answeredCount / this.questions.length) * 100);
  }

  get passed(): boolean {
    if (this.result?.passed !== undefined) return this.result.passed;
    if (
      this.result?.score !== undefined &&
      this.quiz?.passingMarks !== undefined
    ) {
      return this.result.score >= this.quiz.passingMarks;
    }
    return false;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Topic {
  id: string;
  name: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  topicId: string | null;
  topic?: Topic;
  questionCount?: number;
  createdAt?: string;
}

export interface QuizPayload {
  topicId: string | null;
  title: string;
  description: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
}

export interface Question {
  id?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  marks: number;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | 'questions' | null;
type OptionKey = 'A' | 'B' | 'C' | 'D';

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-exams',
  standalone: false,
  templateUrl: './exams.component.html',
  styleUrls: ['../../../shared-page.css', './exams.component.css'],
})
export class ExamsComponent implements OnInit {
  quizzes: Quiz[] = [];
  filteredQuizzes: Quiz[] = [];
  topics: Topic[] = [];

  searchQuery: string = '';
  isLoading: boolean = false;

  // ── Modal state ────────────────────────────────────────────────
  modalMode: ModalMode = null;
  selectedQuiz: Quiz | null = null;

  // ── Quiz form fields ───────────────────────────────────────────
  formTitle: string = '';
  formDescription: string = '';
  formTopicId: string | null = null;
  formTotalMarks: number = 100;
  formPassingMarks: number = 40;
  formDurationMinutes: number = 60;

  // ── Questions state ────────────────────────────────────────────
  questions: Question[] = [];
  questionsLoading: boolean = false;

  // ── Add-question form ──────────────────────────────────────────
  showAddQuestion: boolean = false;
  qText: string = '';
  qOptionA: string = '';
  qOptionB: string = '';
  qOptionC: string = '';
  qOptionD: string = '';
  qCorrect: string = 'A';
  qMarks: number = 1;
  qSaving: boolean = false;

  // ── Validation ─────────────────────────────────────────────────
  titleError: string = '';
  totalMarksError: string = '';
  passingMarksError: string = '';
  durationError: string = '';
  qTextError: string = '';

  // ── Constants ──────────────────────────────────────────────────
  readonly optionKeys: OptionKey[] = ['A', 'B', 'C', 'D'];
  readonly correctOptions = ['A', 'B', 'C', 'D'];

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadTopics();
    this.loadQuizzes();
  }

  // ════════════════════════════════════════════════════════════════
  //  API CALLS
  // ════════════════════════════════════════════════════════════════

  /** GET /api/quiz */
  loadQuizzes(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/quiz').subscribe({
      next: (res: any) => {
        this.quizzes = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load quizzes.');
        this.isLoading = false;
      },
    });
  }

  /** GET /api/topic (topics for dropdown) */
  loadTopics(): void {
    this.httpService.getData(BASE_URL, '/topic').subscribe({
      next: (res: any) => {
        this.topics = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {
        // Topics are optional; swallow the error silently
      },
    });
  }

  /** POST /api/quiz */
  createQuiz(): void {
    const payload = this.buildPayload();
    this.httpService.postData(BASE_URL, '/quiz', payload).subscribe({
      next: () => {
        this.commonService.success(`Quiz "${payload.title}" created successfully.`);
        this.closeModal();
        this.loadQuizzes();
      },
      error: (err: any) => {
        this.commonService.error(err?.error?.message || 'Failed to create quiz.');
      },
    });
  }

  /** PUT /api/quiz/{id} */
  updateQuiz(): void {
    if (!this.selectedQuiz) return;
    const payload = this.buildPayload();
    this.httpService
      .putData(BASE_URL, `/quiz/${this.selectedQuiz.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success(`Quiz "${payload.title}" updated.`);
          this.closeModal();
          this.loadQuizzes();
        },
        error: (err: any) => {
          this.commonService.error(err?.error?.message || 'Failed to update quiz.');
        },
      });
  }

  /** DELETE /api/quiz/{id} */
  deleteQuiz(): void {
    if (!this.selectedQuiz) return;
    this.httpService
      .deleteData(BASE_URL, `/quiz/${this.selectedQuiz.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(`Quiz "${this.selectedQuiz!.title}" deleted.`);
          this.closeModal();
          this.loadQuizzes();
        },
        error: (err: any) => {
          this.commonService.error(err?.error?.message || 'Failed to delete quiz.');
        },
      });
  }

  /** GET /api/quiz/{id}/questions */
  loadQuestions(quizId: string): void {
    this.questionsLoading = true;
    this.questions = [];
    this.httpService.getData(BASE_URL, `/quiz/${quizId}/questions`).subscribe({
      next: (res: any) => {
        this.questions = Array.isArray(res) ? res : (res?.data ?? []);
        this.questionsLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load questions.');
        this.questionsLoading = false;
      },
    });
  }

  /** POST /api/quiz/{id}/questions */
  addQuestion(): void {
    if (!this.selectedQuiz) return;
    if (!this.qText.trim()) {
      this.qTextError = 'Question text is required.';
      return;
    }

    const payload: Question = {
      questionText: this.qText.trim(),
      optionA: this.qOptionA.trim(),
      optionB: this.qOptionB.trim(),
      optionC: this.qOptionC.trim(),
      optionD: this.qOptionD.trim(),
      correctOption: this.qCorrect,
      marks: this.qMarks,
    };

    this.qSaving = true;
    this.httpService
      .postData(BASE_URL, `/quiz/${this.selectedQuiz.id}/questions`, payload)
      .subscribe({
        next: () => {
          this.commonService.success('Question added.');
          this.resetQuestionForm();
          this.showAddQuestion = false;
          this.loadQuestions(this.selectedQuiz!.id);
          this.qSaving = false;
        },
        error: (err: any) => {
          this.commonService.error(err?.error?.message || 'Failed to add question.');
          this.qSaving = false;
        },
      });
  }

  // ════════════════════════════════════════════════════════════════
  //  MODAL HELPERS
  // ════════════════════════════════════════════════════════════════

  openCreateModal(): void {
    this.resetForm();
    this.selectedQuiz = null;
    this.modalMode = 'create';
  }

  openEditModal(quiz: Quiz): void {
    this.selectedQuiz = quiz;
    this.formTitle = quiz.title;
    this.formDescription = quiz.description ?? '';
    this.formTopicId = quiz.topicId;
    this.formTotalMarks = quiz.totalMarks;
    this.formPassingMarks = quiz.passingMarks;
    this.formDurationMinutes = quiz.durationMinutes;
    this.clearErrors();
    this.modalMode = 'edit';
  }

  openViewModal(quiz: Quiz): void {
    this.selectedQuiz = quiz;
    this.modalMode = 'view';
  }

  openDeleteModal(quiz: Quiz): void {
    this.selectedQuiz = quiz;
    this.modalMode = 'delete';
  }

  openQuestionsModal(quiz: Quiz): void {
    this.selectedQuiz = quiz;
    this.showAddQuestion = false;
    this.resetQuestionForm();
    this.modalMode = 'questions';
    this.loadQuestions(quiz.id);
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedQuiz = null;
    this.questions = [];
    this.showAddQuestion = false;
    this.clearErrors();
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') this.createQuiz();
    else if (this.modalMode === 'edit') this.updateQuiz();
  }

  // ════════════════════════════════════════════════════════════════
  //  VALIDATION & FORM UTILITIES
  // ════════════════════════════════════════════════════════════════

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.formTitle.trim()) {
      this.titleError = 'Title is required.';
      valid = false;
    }
    if (!this.formTotalMarks || this.formTotalMarks < 1) {
      this.totalMarksError = 'Total marks must be at least 1.';
      valid = false;
    }
    if (!this.formPassingMarks || this.formPassingMarks < 1) {
      this.passingMarksError = 'Passing marks must be at least 1.';
      valid = false;
    } else if (this.formPassingMarks > this.formTotalMarks) {
      this.passingMarksError = 'Passing marks cannot exceed total marks.';
      valid = false;
    }
    if (!this.formDurationMinutes || this.formDurationMinutes < 1) {
      this.durationError = 'Duration must be at least 1 minute.';
      valid = false;
    }

    return valid;
  }

  clearErrors(): void {
    this.titleError = '';
    this.totalMarksError = '';
    this.passingMarksError = '';
    this.durationError = '';
    this.qTextError = '';
  }

  private buildPayload(): QuizPayload {
    return {
      topicId: this.formTopicId || null,
      title: this.formTitle.trim(),
      description: this.formDescription.trim(),
      totalMarks: this.formTotalMarks,
      passingMarks: this.formPassingMarks,
      durationMinutes: this.formDurationMinutes,
    };
  }

  private resetForm(): void {
    this.formTitle = '';
    this.formDescription = '';
    this.formTopicId = null;
    this.formTotalMarks = 100;
    this.formPassingMarks = 40;
    this.formDurationMinutes = 60;
    this.clearErrors();
  }

  resetQuestionForm(): void {
    this.qText = '';
    this.qOptionA = '';
    this.qOptionB = '';
    this.qOptionC = '';
    this.qOptionD = '';
    this.qCorrect = 'A';
    this.qMarks = 1;
    this.qTextError = '';
  }

  // ════════════════════════════════════════════════════════════════
  //  DISPLAY HELPERS
  // ════════════════════════════════════════════════════════════════

  getTopicName(topicId: string | null): string {
    if (!topicId) return '—';
    return this.topics.find((t) => t.id === topicId)?.name ?? '—';
  }

  getOption(q: Question, opt: OptionKey): string {
    const key = `option${opt}` as keyof Pick<Question, 'optionA' | 'optionB' | 'optionC' | 'optionD'>;
    return q[key];
  }

  onSearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredQuizzes = this.quizzes.filter((quiz) => {
      return (
        !q ||
        quiz.title.toLowerCase().includes(q) ||
        quiz.description?.toLowerCase().includes(q) ||
        this.getTopicName(quiz.topicId).toLowerCase().includes(q)
      );
    });
  }

  get totalQuestions(): number {
    return this.quizzes.reduce((s, q) => s + (q.questionCount ?? 0), 0);
  }
}

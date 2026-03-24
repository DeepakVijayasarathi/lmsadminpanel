import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface Topic {
  id: string;
  name: string;
}

export interface StudentQuiz {
  id: string;
  title: string;
  description: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  topicId: string | null;
  topic?: Topic;
  courseId: string | null;
  course?: any;
  questionCount?: number;
  createdAt?: string;
}

@Component({
  selector: 'app-student-quizzes',
  standalone: false,
  templateUrl: './student-quizzes.component.html',
  styleUrls: ['../../../shared-page.css', './student-quizzes.component.css'],
})
export class StudentQuizzesComponent implements OnInit {
  quizzes: StudentQuiz[] = [];
  filteredQuizzes: StudentQuiz[] = [];
  topics: Topic[] = [];
  courses: any[] = [];

  searchQuery: string = '';
  isLoading: boolean = false;

  pageSize = 10;
  currentPage = 1;

  get pagedQuizzes(): StudentQuiz[] {
    return this.filteredQuizzes.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredQuizzes.length / this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadTopics();
    this.loadCourses();
    this.loadQuizzes();
  }

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

  loadTopics(): void {
    this.httpService.getData(BASE_URL, '/topic').subscribe({
      next: (res: any) => {
        this.topics = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {},
    });
  }

  loadCourses(): void {
    this.httpService.getData(BASE_URL, '/courses').subscribe({
      next: (res: any) => {
        this.courses = Array.isArray(res) ? res : (res?.data ?? []);
      },
      error: () => {},
    });
  }

  attendQuiz(quiz: StudentQuiz): void {
    this.router.navigate(['/exams/take', quiz.id]);
  }

  getTopicName(topicId: string | null): string {
    if (!topicId) return '—';
    return this.topics.find((t) => t.id === topicId)?.name ?? '—';
  }

  getCourseName(courseId: string | null): string {
    if (!courseId) return '—';
    return this.courses.find((c) => c.id === courseId)?.title ?? '—';
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
        this.getTopicName(quiz.topicId).toLowerCase().includes(q) ||
        this.getCourseName(quiz.courseId).toLowerCase().includes(q)
      );
    });
    this.currentPage = 1;
  }

  get totalQuestions(): number {
    return this.quizzes.reduce((s, q) => s + (q.questionCount ?? 0), 0);
  }
}

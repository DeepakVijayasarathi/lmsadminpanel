import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { HttpGeneralService } from '../../services/http.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

export interface CreateBatchDto {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface CourseDto {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  level: string;
  durationHours: number;
  durationInMonths: number;
  isPublished: boolean;
  price: number;
  isPartialAllowed: boolean;
  installmentCount?: number | null;
  classId: string;
  batches: CreateBatchDto[];
}

@Component({
  selector: 'app-user-plan',
  standalone: false,
  templateUrl: './user-plan.component.html',
  styleUrls: ['./user-plan.component.css'],
})
export class UserPlanComponent implements OnInit {
  @Output() enroll = new EventEmitter<CourseDto>();

  courses: CourseDto[] = [];
  isLoading = true;
  hasError = false;

  constructor(private httpService: HttpGeneralService<any>, private router: Router) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.hasError = false;

    this.httpService
      .getData(environment.apiUrl, '/courses/get-course-register')
      .subscribe({
        next: (res) => {
          this.courses = res;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading courses', err);
          this.isLoading = false;
          this.hasError = true;
        },
      });
  }

  getInstallmentAmount(course: CourseDto): number {
    if (!course.installmentCount || course.installmentCount === 0) {
      return course.price;
    }
    return course.price / course.installmentCount;
  }

  getLevelClass(level: string): string {
    const map: Record<string, string> = {
      beginner: 'level-beginner',
      intermediate: 'level-intermediate',
      advanced: 'level-advanced',
      expert: 'level-expert',
    };
    return map[level?.toLowerCase()] ?? 'level-beginner';
  }

  onEnroll(course: CourseDto): void {
    this.router.navigate(['/register']);
  }
}

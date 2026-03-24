import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/performance';

export interface StudentPerformanceStats {
  totalStudents: number;
  avgOverallScore: number;
  topPerformers: number;
  needSupport: number;
}

export interface StudentPerformanceRecord {
  studentId: string;
  studentName: string;
  batchName: string;

  totalClasses: number;
  attendedClasses: number;
  attendancePercent: number;

  totalHomework: number;
  homeworkSubmitted: number;
  homeworkMarksObtained: number;
  homeworkMaxMarks: number;
  homeworkPercent: number;

  quizzesTaken: number;
  avgQuizScore: number;

  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface StudentPerformanceResponse {
  stats: StudentPerformanceStats;
  records: StudentPerformanceRecord[];
}

// ── Individual student ─────────────────────────────────────────────────────

export interface HomeworkBreakdownItem {
  homeworkId: string;
  title: string;
  maxMarks: number;
  submitted: boolean;
  graded: boolean;
  marksObtained: number | null;
  feedback: string | null;
  submittedAt: string | null;
}

export interface StudentDetail extends StudentPerformanceRecord {
  homeworkBreakdown: HomeworkBreakdownItem[];
}

// ── Teacher ────────────────────────────────────────────────────────────────

export interface TeacherPerformanceStats {
  totalTeachers: number;
  totalHoursDelivered: number;
  totalClassesDelivered: number;
  avgHoursPerTeacher: number;
}

export interface TeacherBatchHours {
  batchId?: string;
  batchName: string;
  classes: number;
  hoursTaught: number;
}

export interface TeacherPerformanceRecord {
  teacherId: string;
  teacherName: string;
  totalClassesTaken: number;
  totalHoursTaught: number;
  batchesCovered: number;
  batchBreakdown: TeacherBatchHours[];
}

export interface TeacherPerformanceResponse {
  stats: TeacherPerformanceStats;
  records: TeacherPerformanceRecord[];
}

// Individual teacher detail (same shape as record)
export type TeacherDetail = TeacherPerformanceRecord;

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  constructor(private http: HttpClient) {}

  /** GET /api/performance/students?batchId= */
  getStudents(batchId?: string): Observable<StudentPerformanceResponse> {
    let params = new HttpParams();
    if (batchId) params = params.set('batchId', batchId);
    return this.http.get<StudentPerformanceResponse>(`${BASE}/students`, { params });
  }

  /** GET /api/performance/students/{studentId} */
  getStudent(studentId: string): Observable<StudentDetail> {
    return this.http.get<StudentDetail>(`${BASE}/students/${studentId}`);
  }

  /** GET /api/performance/teachers */
  getTeachers(teacherId?: string): Observable<TeacherPerformanceResponse> {
    let params = new HttpParams();
    if (teacherId) params = params.set('teacherId', teacherId);
    return this.http.get<TeacherPerformanceResponse>(`${BASE}/teachers`, { params });
  }

  /** GET /api/performance/teachers/{teacherId} */
  getTeacher(teacherId: string): Observable<TeacherDetail> {
    return this.http.get<TeacherDetail>(`${BASE}/teachers/${teacherId}`);
  }
}

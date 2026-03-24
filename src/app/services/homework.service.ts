import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/homeworks';

export interface HomeworkDto {
  id: string;
  teacherId: string;
  batchId: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  attachmentUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SubmissionDto {
  id: string;
  homeworkId: string;
  studentId: string;
  fileUrl: string;
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
}

@Injectable({ providedIn: 'root' })
export class HomeworkService {
  constructor(private http: HttpClient) {}

  /** GET /api/homeworks */
  getAll(): Observable<HomeworkDto[]> {
    return this.http.get<HomeworkDto[]>(BASE);
  }

  /** GET /api/homeworks/batch/{batchId} */
  getByBatch(batchId: string): Observable<HomeworkDto[]> {
    return this.http.get<HomeworkDto[]>(`${BASE}/batch/${batchId}`);
  }

  /** POST /api/homeworks  (multipart/form-data) */
  create(
    teacherId: string,
    batchId: string,
    title: string,
    description: string,
    dueDate: string,
    maxMarks: number,
    file?: File | null
  ): Observable<HomeworkDto> {
    const form = new FormData();
    form.append('teacherId', teacherId);
    form.append('batchId', batchId);
    form.append('title', title);
    form.append('description', description);
    form.append('dueDate', dueDate);
    form.append('maxMarks', maxMarks.toString());
    if (file) form.append('attachmentFile', file);
    return this.http.post<HomeworkDto>(BASE, form);
  }

  /** POST /api/homeworks/{id}/submit  (multipart/form-data) */
  submit(homeworkId: string, studentId: string, file: File): Observable<{ message: string }> {
    const form = new FormData();
    form.append('homeworkId', homeworkId);
    form.append('studentId', studentId);
    form.append('file', file);
    return this.http.post<{ message: string }>(`${BASE}/${homeworkId}/submit`, form);
  }

  /** GET /api/homeworks/{id}/submissions */
  getSubmissions(homeworkId: string): Observable<SubmissionDto[]> {
    return this.http.get<SubmissionDto[]>(`${BASE}/${homeworkId}/submissions`);
  }

  /** PUT /api/homeworks/submissions/{submissionId}/grade */
  grade(submissionId: string, marks: number, feedback: string): Observable<any> {
    return this.http.put(`${BASE}/submissions/${submissionId}/grade`, { marks, feedback });
  }
}

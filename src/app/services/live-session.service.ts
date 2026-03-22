import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/livesession';

export interface LiveSessionDto {
  id: string;
  batchId: string;
  courseId: string;
  teacherId: string;
  title: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
  status: string;
  // Optionally returned by some endpoints
  batch?: { id: string; name?: string; batchName?: string };
  teacher?: { id: string; firstName?: string; lastName?: string };
}

export interface CreateLiveSessionDto {
  batchId: string;
  courseId: string;
  teacherId: string;
  title: string;
  startTime: string;
  endTime: string;
}

export interface JoinUrlsDto {
  sessionId: string;
  title: string;
  adminUrl: string;
  teacherUrl: string;
  studentUrl: string;
}

@Injectable({ providedIn: 'root' })
export class LiveSessionService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<LiveSessionDto[]> {
    return this.http.get<LiveSessionDto[]>(BASE);
  }

  create(dto: CreateLiveSessionDto): Observable<LiveSessionDto> {
    return this.http.post<LiveSessionDto>(BASE, dto);
  }

  /** GET /livesession/{id}/join-url?fullName=...&role=admin|teacher|student */
  getJoinUrl(id: string, fullName: string, role: 'admin' | 'teacher' | 'student'): Observable<{ joinUrl: string }> {
    const params = new HttpParams()
      .set('fullName', fullName)
      .set('role', role);
    return this.http.get<{ joinUrl: string }>(`${BASE}/${id}/join-url`, { params });
  }

  /** GET /livesession/{id}/join-urls — returns all 3 role URLs at once */
  getJoinUrls(id: string): Observable<JoinUrlsDto> {
    return this.http.get<JoinUrlsDto>(`${BASE}/${id}/join-urls`);
  }

  start(id: string): Observable<LiveSessionDto> {
    return this.http.post<LiveSessionDto>(`${BASE}/${id}/start`, {});
  }

  end(id: string): Observable<LiveSessionDto> {
    return this.http.post<LiveSessionDto>(`${BASE}/${id}/end`, {});
  }

  updateStatus(id: string, status: number): Observable<any> {
    const params = new HttpParams().set('status', String(status));
    return this.http.put<any>(`${BASE}/${id}/status`, null, { params });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/democlass';

export interface DemoClassDto {
  id: string;
  title: string;
  description: string;
  boardId: string;
  boardName?: string;
  classId: string;
  className?: string;
  subject: string;
  topic: string;
  teacherId: string;
  teacherName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
  registeredCount: number;
  status: 'Scheduled' | 'Live' | 'Completed' | 'Canceled';
}

export interface DemoClassPayload {
  title: string;
  description: string;
  boardId: string;
  classId: string;
  subject: string;
  topic: string;
  teacherId: string;
  teacherName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
}

export interface DemoRegistrationDto {
  id: string;
  demoClassId: string;
  demoClassTitle: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  registeredAt: string;
  hasAttended: boolean;
}

export interface DemoRegisterPayload {
  demoClassId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentId?: string | null;
  boardId?: string;
  classId?: string;
}

@Injectable({ providedIn: 'root' })
export class DemoClassService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<DemoClassDto[]> {
    return this.http.get<DemoClassDto[]>(BASE);
  }

  getById(id: string): Observable<DemoClassDto> {
    return this.http.get<DemoClassDto>(`${BASE}/${id}`);
  }

  create(payload: DemoClassPayload): Observable<DemoClassDto> {
    return this.http.post<DemoClassDto>(BASE, payload);
  }

  update(id: string, payload: DemoClassPayload): Observable<DemoClassDto> {
    return this.http.put<DemoClassDto>(`${BASE}/${id}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${BASE}/${id}`);
  }

  getRegistrations(id: string): Observable<DemoRegistrationDto[]> {
    return this.http.get<DemoRegistrationDto[]>(`${BASE}/${id}/registrations`);
  }

  register(payload: DemoRegisterPayload): Observable<DemoRegistrationDto> {
    return this.http.post<DemoRegistrationDto>(`${BASE}/register`, payload);
  }
}

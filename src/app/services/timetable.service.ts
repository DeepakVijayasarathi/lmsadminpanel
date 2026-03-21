import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/livesession';

export interface TimetableSlotDto {
  id:           string;
  day:          string;
  session:      number;
  subject:      string;
  topic:        string;
  teacher:      string;
  batch:        string;
  category:     string;
  startTime:    string;
  endTime:      string;
  status:       string;
  meetingId:    string;
  meetingLink:  string;
  recordingUrl: string;
}

export interface TimetablePayload {
  batchId:   string | null;
  teacherId: string | null;
  courseId:  string | null;
  sessionId: string | null;
  day:       string;
  session:   number;
  subject:   string;
  topic:     string;
  teacher:   string;
  batch:     string;
  category:  string;
  status:    string;
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<TimetableSlotDto[]> {
    return this.http.get<TimetableSlotDto[]>(`${BASE}`);
  }

  createSlot(payload: TimetablePayload): Observable<TimetableSlotDto> {
    return this.http.post<TimetableSlotDto>(`${BASE}/timetable`, payload);
  }

  updateSlot(id: string, payload: TimetablePayload): Observable<TimetableSlotDto> {
    return this.http.put<TimetableSlotDto>(`${BASE}/timetable/${id}`, payload);
  }

  getJoinUrl(id: string, fullName: string, isModerator = false): Observable<{ joinUrl: string }> {
    return this.http.get<{ joinUrl: string }>(`${BASE}/${id}/join-url`, {
      params: { fullName, isModerator: String(isModerator) }
    });
  }

  start(id: string): Observable<any> {
    return this.http.post(`${BASE}/${id}/start`, {});
  }

  end(id: string): Observable<any> {
    return this.http.post(`${BASE}/${id}/end`, {});
  }

  triggerRecording(id: string): Observable<{ recordingUrl: string }> {
    return this.http.post<{ recordingUrl: string }>(`${BASE}/${id}/recording`, {});
  }
}

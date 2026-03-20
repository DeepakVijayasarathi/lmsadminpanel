import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const BASE = 'http://localhost:5195/api/livesession';

export interface TimetableSlotDto {
  id:          string;
  day:         string;
  session:     number;
  subject:     string;
  topic:       string;
  teacher:     string;
  batch:       string;
  category:    string;
  startTime:   string;
  endTime:     string;
  status:      string;
  meetingId:   string;
  meetingLink: string;
}

export interface TimetablePayload {
  day:       string;
  session:   number;
  subject:   string;
  topic:     string;
  teacher:   string;
  batch:     string;
  category:  string;
  startTime: string;
  endTime:   string;
  status:    string;
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  constructor(private http: HttpClient) {}

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
}

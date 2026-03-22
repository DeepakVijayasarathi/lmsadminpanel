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
  playbackUrl:  string;
  mp4Url:       string;
}

export interface TimetablePayload {
  batchId:   string | null;
  teacherId: string | null;
  courseId:  string | null;
  sessionId: string | null;
  day:       string | null;
  session:   number;
  subject:   string;
  topic:     string;
  teacher:   string;
  batch:     string;
  category:  string;
  status:    string;
}

export interface RecordingResult {
  isReady:      boolean;
  playbackUrl:  string | null;
  bucketUrl:    string | null;
  mp4Url:       string | null;
  deskshareUrl: string | null;
}

export interface SessionAnalytic {
  userName:          string;
  bbbUserId:         string;
  isModerator:       boolean;
  onlineTimeSeconds: number;
  talkTimeSeconds:   number;
  webcamTimeSeconds: number;
  messageCount:      number;
  raiseHandCount:    number;
  emojiCount:        number;
  activityScore:     number;
  joinTime:          string;
  leaveTime:         string;
  status:            string;
}

@Injectable({ providedIn: 'root' })
export class TimetableService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<TimetableSlotDto[]> {
    return this.http.get<TimetableSlotDto[]>(`${BASE}`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${BASE}/${id}`);
  }

  createSlot(payload: TimetablePayload): Observable<TimetableSlotDto> {
    return this.http.post<TimetableSlotDto>(`${BASE}/timetable`, payload);
  }

  updateSlot(id: string, payload: TimetablePayload): Observable<TimetableSlotDto> {
    return this.http.put<TimetableSlotDto>(`${BASE}/timetable/${id}`, payload);
  }

  getJoinUrl(id: string, fullName: string, role: 'admin' | 'teacher' | 'student' = 'admin'): Observable<{ joinUrl: string }> {
    return this.http.get<{ joinUrl: string }>(`${BASE}/${id}/join-url`, {
      params: { fullName, role }
    });
  }

  start(id: string): Observable<any> {
    return this.http.post(`${BASE}/${id}/start`, {});
  }

  end(id: string): Observable<any> {
    return this.http.post(`${BASE}/${id}/end`, {});
  }

  checkRecordingReady(id: string): Observable<RecordingResult> {
    return this.http.get<RecordingResult>(`${BASE}/${id}/recording-ready`);
  }

  triggerRecording(id: string): Observable<RecordingResult> {
    return this.http.post<RecordingResult>(`${BASE}/${id}/recording`, {});
  }

  getAnalytics(id: string): Observable<SessionAnalytic[]> {
    return this.http.get<SessionAnalytic[]>(`${BASE}/${id}/analytics`);
  }
}

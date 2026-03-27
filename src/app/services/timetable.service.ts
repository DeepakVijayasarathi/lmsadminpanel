import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/livesession';
const TIMETABLE_BASE = environment.apiUrl + '/timetable';

export interface SubstitutePayload {
  batchId:              string;
  teacherId:            string;
  courseId:              string;
  sessionSlotId:        string;
  dayOfWeek:            number;
  date:                 string;
  substituteTeacherId:  string | null;
  mergedIntoBatchId:    string | null;
}

export interface TimetableSlotDto {
  id:                   string;
  batchId:              string;
  teacherId:            string;
  courseId:              string;
  sessionSlotId:        string;
  dayOfWeek:            number;       // 0=Sun … 6=Sat
  slotNumber:           number;
  slotName:             string;       // e.g. "Session 1"
  startTime:            string;       // "09:00:00" (read-only, from SessionSlot)
  endTime:              string;       // "10:30:00"
  meetingUrl:           string;
  substituteTeacherId:  string | null;
  substitutionDate:     string | null;
  isMergedClass:        boolean;
  mergedIntoBatchId:    string | null;
}

export interface TimetableCreatePayload {
  batchId:        string;
  teacherId:      string;
  courseId:        string;
  sessionSlotId:  string;
  dayOfWeek:      number;
}

export interface RecordingResult {
  isReady:      boolean;
  state:        string | null;   // pending | processing | processed | published | completed | not_recorded
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
    return this.http.get<TimetableSlotDto[]>(TIMETABLE_BASE);
  }

  getById(id: string): Observable<TimetableSlotDto> {
    return this.http.get<TimetableSlotDto>(`${TIMETABLE_BASE}/${id}`);
  }

  getByBatch(batchId: string): Observable<TimetableSlotDto[]> {
    return this.http.get<TimetableSlotDto[]>(`${TIMETABLE_BASE}/by-batch/${batchId}`);
  }

  getByTeacher(teacherId: string): Observable<TimetableSlotDto[]> {
    return this.http.get<TimetableSlotDto[]>(`${TIMETABLE_BASE}/by-teacher/${teacherId}`);
  }

  createSlot(payload: TimetableCreatePayload): Observable<TimetableSlotDto> {
    return this.http.post<TimetableSlotDto>(TIMETABLE_BASE, payload);
  }

  updateSlot(id: string, payload: TimetableCreatePayload): Observable<TimetableSlotDto> {
    return this.http.put<TimetableSlotDto>(`${TIMETABLE_BASE}/${id}`, payload);
  }

  deleteSlot(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${TIMETABLE_BASE}/${id}`);
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

  /** GET /livesession/{id}/recording-status — returns state + progress info */
  getRecordingStatus(id: string): Observable<RecordingResult> {
    return this.http.get<RecordingResult>(`${BASE}/${id}/recording-status`);
  }

  triggerRecording(id: string): Observable<RecordingResult> {
    return this.http.post<RecordingResult>(`${BASE}/${id}/recording`, {});
  }

  getAnalytics(id: string): Observable<SessionAnalytic[]> {
    return this.http.get<SessionAnalytic[]>(`${BASE}/${id}/analytics`);
  }

  assignSubstitute(timetableId: string, payload: SubstitutePayload): Observable<any> {
    return this.http.post<any>(`${TIMETABLE_BASE}/${timetableId}/substitute`, payload);
  }
}

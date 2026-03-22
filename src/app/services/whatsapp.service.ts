import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/whatsapp';

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  constructor(private http: HttpClient) {}

  /** POST /api/whatsapp/reminder/{sessionId} — remind all batch students */
  sendReminder(sessionId: string): Observable<any> {
    return this.http.post(`${BASE}/reminder/${sessionId}`, {});
  }

  /** POST /api/whatsapp/timetable/{batchId} — send timetable to all batch students */
  sendTimetable(batchId: string): Observable<any> {
    return this.http.post(`${BASE}/timetable/${batchId}`, {});
  }

  /** POST /api/whatsapp/send — send custom message to a single number */
  sendCustom(phone: string, message: string): Observable<any> {
    return this.http.post(`${BASE}/send`, { phone, message });
  }
}

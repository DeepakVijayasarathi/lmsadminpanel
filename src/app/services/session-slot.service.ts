import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/sessionslot`;

export interface SessionSlot {
  id: string;
  slotNumber: number;
  name: string;
  startTime: string;
  endTime: string;
}

export interface SessionSlotPayload {
  slotNumber: number;
  name: string;
  startTime: string;
  endTime: string;
}

@Injectable({ providedIn: 'root' })
export class SessionSlotService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<SessionSlot[]> {
    return this.http.get<SessionSlot[]>(BASE);
  }

  getById(id: string): Observable<SessionSlot> {
    return this.http.get<SessionSlot>(`${BASE}/${id}`);
  }

  create(payload: SessionSlotPayload): Observable<SessionSlot> {
    return this.http.post<SessionSlot>(BASE, payload);
  }

  update(id: string, payload: SessionSlotPayload): Observable<SessionSlot> {
    return this.http.put<SessionSlot>(`${BASE}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}

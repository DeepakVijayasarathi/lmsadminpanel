import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl + '/appsetting';

export interface AppSettingDto {
  key:   string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class AppSettingService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<AppSettingDto[]> {
    return this.http.get<AppSettingDto[]>(BASE);
  }

  getByKey(key: string): Observable<AppSettingDto> {
    return this.http.get<AppSettingDto>(`${BASE}/${key}`);
  }

  update(key: string, value: string): Observable<any> {
    return this.http.put(`${BASE}/${key}`, { key, value });
  }

  toggleRecording(): Observable<any> {
    return this.http.post(`${BASE}/toggle-recording`, {});
  }
}

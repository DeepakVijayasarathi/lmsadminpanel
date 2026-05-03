import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TokenStorageService } from '../auth/token-storage.service';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly API = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
  ) {}

  getUserProfile() {
    const userId = this.tokenStorage.getUserId();
    return this.http.get<any>(`${this.API}/users/${userId}`);
  }

  updateUserProfile(data: any) {
    const userId = this.tokenStorage.getUserId();
    return this.http.put<any>(`${this.API}/users/${userId}`, data);
  }
}

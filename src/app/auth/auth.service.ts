import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedInSubject: BehaviorSubject<boolean>;

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.isLoggedInSubject = new BehaviorSubject<boolean>(
      this.tokenStorage.getAccessToken() != null
    );
  }

  get isLoggedIn$() {
    return this.isLoggedInSubject.asObservable();
  };

  login(credentials: any) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        this.tokenStorage.saveTokens(res.accessToken, res.refreshToken, res.expiresTime);
        this.isLoggedInSubject.next(true);
      })
    );
  }

  refreshToken() {
    const refreshToken = this.tokenStorage.getRefreshToken();

    return this.http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(res => {
        this.tokenStorage.saveTokens(res.accessToken, res.refreshToken, res.expiresTime);
      }),
      catchError(err => {
        this.toastr.error("Session expired, please login again.", "Token Expired");
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout() {
    this.toastr.info("You have been logged out", "Logged Out");
    this.tokenStorage.clear();
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }
}
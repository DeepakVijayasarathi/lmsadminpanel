import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService, 
    private tokenStorage: TokenStorageService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    let authReq = req;

    const token = this.tokenStorage.getAccessToken();
    const isExpired = this.tokenStorage.isTokenExpired();

    if (token && !isExpired) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    // If token expired → refresh
    if (token && isExpired) {
      return this.authService.refreshToken().pipe(
        switchMap(() => {
          const newToken = this.tokenStorage.getAccessToken();
          const newReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });
          return next.handle(newReq);
        }),
        catchError(err => {
          this.authService.logout();
          return throwError(() => err);
        })
      );
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // If API returns 401 → logout
        if (error.status === 401) {
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}

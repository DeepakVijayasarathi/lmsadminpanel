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

    if (req.url.includes('/auth/login') || 
        req.url.includes('/auth/login/send-otp') ||
        req.url.includes('/auth/login/verify-otp')) {
      return next.handle(req);
    }

    let authReq = req;

    const token = this.tokenStorage.getAccessToken();
    const isExpired = this.tokenStorage.isTokenExpired();

    if (token && !isExpired) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

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
        if (error.status === 401) {
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}

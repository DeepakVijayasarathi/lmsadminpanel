import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {

  saveTokens(access: string, refresh: string, expiresIn: number) {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem('tokenExpiry', expiryTime.toString());
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  getTokenExpiry() {
    return Number(localStorage.getItem('tokenExpiry'));
  }

  isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    return !expiry || Date.now() > expiry;
  }

  getUserName(): string {
    const token = this.getAccessToken();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.name || payload.email || payload.sub || '';
    } catch {
      return '';
    }
  }

  getRoleName(): string {
    return localStorage.getItem('roleName') || '';
  }

  clear() {
    localStorage.clear();
  }
}

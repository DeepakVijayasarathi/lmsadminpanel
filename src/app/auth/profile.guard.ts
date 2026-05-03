import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class ProfileGuard implements CanActivate {
  constructor(
    private tokenStorage: TokenStorageService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    const token = this.tokenStorage.getAccessToken();
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}

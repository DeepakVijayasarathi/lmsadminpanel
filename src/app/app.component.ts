import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'admin-panel';
  isLoginPage = true;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {

        const url = this.router.url;

        this.isLoginPage =
          url.startsWith('/login') ||
          url.startsWith('/reset-password') ||
          url.startsWith('/forgot-password') ||
          url.startsWith('/register') ||
          url.startsWith('/demo-register') ||
          url.startsWith('/user-plan');

        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    });
  }
}

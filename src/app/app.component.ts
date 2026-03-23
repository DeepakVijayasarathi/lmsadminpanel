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
        this.isLoginPage = this.router.url === '/login' || this.router.url === '/register';

        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    });
  }
}

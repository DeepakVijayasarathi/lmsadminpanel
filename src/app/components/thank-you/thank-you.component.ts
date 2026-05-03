import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-thank-you',
  standalone: false,
  templateUrl: './thank-you.component.html',
  styleUrls: ['./thank-you.component.css'],
})
export class ThankYouComponent implements OnInit, OnDestroy {
  data: any = null;
  countdown = 10;
  private timer: any;

  constructor(private router: Router) {}

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;
    if (state?.role) {
      this.data = state;
    }
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.goToLogin();
      }
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  formatCurrency(amount: number): string {
    return '₹' + Number(amount).toLocaleString('en-IN');
  }

  goToLogin() {
    clearInterval(this.timer);
    this.router.navigate(['/login']);
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StudentService } from '../../services/student.service';

export const ROLE_IDS = {
  ADMIN: 'Admin',
  ITADMIN: 'ItAdmin',
  TEACHER: 'Teacher',
  ZONALADMIN: 'ZonalAdmin',
  STUDENT: 'Student'
};

@Component({
  selector: 'app-common-dashboard',
  standalone: false,
  templateUrl: './common-dashboard.component.html',
  styleUrl: './common-dashboard.component.css'
})
export class CommonDashboardComponent implements OnInit {

  roleName: string | null = null;
  ROLE_IDS = ROLE_IDS;

  showProfilePopup = false;
  profileCompletion = 0;
  profilePopupLoading = false;

  private readonly PROFILE_FIELDS = [
    'firstName', 'lastName', 'phone', 'gender',
    'dateOfBirth', 'address', 'countryId',
    'parentName', 'parentEmail', 'parentPhone',
  ];

  constructor(
    private studentService: StudentService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.roleName = localStorage.getItem('roleName');
    if (this.roleName === ROLE_IDS.STUDENT) {
      await this.loadProfileCompletion();
      const dismissed = sessionStorage.getItem('pcp-dismissed') === '1';
      if (this.profileCompletion < 100 && !dismissed) {
        this.showProfilePopup = true;
      }
    }
  }

  private async loadProfileCompletion(): Promise<void> {
    this.profilePopupLoading = true;
    try {
      const res: any = await firstValueFrom(this.studentService.getUserProfile());
      const profile = res?.data || res;
      const filled = this.PROFILE_FIELDS.filter(f => {
        const v = profile[f];
        return v !== null && v !== undefined && v !== '';
      }).length;
      this.profileCompletion = Math.round((filled / this.PROFILE_FIELDS.length) * 100);
    } catch {
      this.profileCompletion = 0;
    }
    this.profilePopupLoading = false;
  }

  dismissProfilePopup(): void {
    this.showProfilePopup = false;
    sessionStorage.setItem('pcp-dismissed', '1');
  }

  goToProfile(): void {
    this.showProfilePopup = false;
    sessionStorage.setItem('pcp-dismissed', '1');
    this.router.navigate(['/profile']);
  }

  get circumference(): number {
    return 2 * Math.PI * 40;
  }

  get dashOffset(): number {
    return this.circumference * (1 - this.profileCompletion / 100);
  }
}

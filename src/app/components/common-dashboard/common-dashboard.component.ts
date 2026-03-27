import { Component, OnInit } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { TeacherDashboardComponent } from '../teacher-dashboard/teacher-dashboard.component';
import { StudentDashboardComponent } from '../student-dashboard/student-dashboard.component';

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

  ngOnInit(): void {
    this.roleName = localStorage.getItem('roleName');
    console.log('ROLE NAME:', this.roleName);
  }
}

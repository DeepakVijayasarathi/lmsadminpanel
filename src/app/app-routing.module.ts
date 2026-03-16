import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UsersComponent } from './components/users/users.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // dashboard
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },

  // Curriculum
  { path: 'boards',    component: BoardsComponent,    canActivate: AG },
  { path: 'classes',   component: ClassesComponent,   canActivate: AG },
  { path: 'subjects',  component: SubjectsComponent,  canActivate: AG },
  { path: 'topics',    component: TopicsComponent,    canActivate: AG },

  // Learning
  { path: 'courses',       component: CoursesComponent,     canActivate: AG },
  { path: 'batches',       component: BatchesComponent,     canActivate: AG },
  { path: 'live-classes',  component: LiveClassesComponent, canActivate: AG },
  { path: 'library',       component: LibraryComponent,     canActivate: AG },

  // Assessment
  { path: 'exams',    component: ExamsComponent,   canActivate: AG },
  { path: 'results',  component: ResultsComponent, canActivate: AG },

  // Communication
  { path: 'notifications', component: NotificationsComponent, canActivate: AG },
  { path: 'announcements', component: AnnouncementsComponent, canActivate: AG },

  // Finance
  { path: 'payments',      component: PaymentsComponent,      canActivate: AG },
  { path: 'subscriptions', component: SubscriptionsComponent, canActivate: AG },
  { path: 'refunds',       component: RefundsComponent,       canActivate: AG },

  // Reports
  { path: 'attendance-report',   component: AttendanceReportComponent,   canActivate: AG },
  { path: 'performance-report',  component: PerformanceReportComponent,  canActivate: AG },
  { path: 'revenue-report',      component: RevenueReportComponent,      canActivate: AG },

  // System
  { path: 'roles',    component: RolesComponent,    canActivate: AG },
  { path: 'settings', component: SettingsComponent, canActivate: AG },

  // Dashboard (keep existing)
  { path: 'dashboard', component: DashboardComponent, canActivate: AG },

  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

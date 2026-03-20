import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BoardsComponent } from './components/curriculum/boards/boards.component';
import { ClassesComponent } from './components/curriculum/classes/classes.component';
import { ExamsComponent } from './components/assessment/exams/exams.component';
import { ResultsComponent } from './components/assessment/results/results.component';
import { AnnouncementsComponent } from './components/communication/announcements/announcements.component';
import { NotificationsComponent } from './components/communication/notifications/notifications.component';
import { SubjectsComponent } from './components/curriculum/subjects/subjects.component';
import { TopicsComponent } from './components/curriculum/topics/topics.component';
import { PaymentsComponent } from './components/finance/payments/payments.component';
import { RefundsComponent } from './components/finance/refunds/refunds.component';
import { SubscriptionsComponent } from './components/finance/subscriptions/subscriptions.component';
import { BatchesComponent } from './components/learning/batches/batches.component';
import { CoursesComponent } from './components/learning/courses/courses.component';
import { LibraryComponent } from './components/learning/library/library.component';
import { LiveClassesComponent } from './components/learning/live-classes/live-classes.component';
import { AttendanceReportComponent } from './components/reports/attendance-report/attendance-report.component';
import { PerformanceReportComponent } from './components/reports/performance-report/performance-report.component';
import { RevenueReportComponent } from './components/reports/revenue-report/revenue-report.component';
import { RolesComponent } from './components/system/roles/roles.component';
import { SettingsComponent } from './components/system/settings/settings.component';
import { StudentsComponent } from './components/users/students/students.component';
import { TeachersComponent } from './components/users/teachers/teachers.component';
import { ParentsComponent } from './components/users/parents/parents.component';
import { MenuComponent } from './components/system/menu/menu.component';
import { TimetableComponent } from './components/learning/timetable/timetable.component';
import { SessionSlotsComponent } from './components/learning/session-slots/session-slots.component';
import { TeacherDashboardComponent } from './components/teacher-dashboard/teacher-dashboard.component';
import { StudentDashboardComponent } from './components/student-dashboard/student-dashboard.component';
import { RegistrationComponent } from './components/registration/registration.component';

const AG = [AuthGuard];

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },

  // dashboard
  { path: 'dashboard', component: DashboardComponent, canActivate: AG },
  { path: 'student-dashboard', component: StudentDashboardComponent, canActivate: AG },
  { path: 'teacher-dashboard', component: TeacherDashboardComponent, canActivate: AG },

  // User
  { path: 'students',    component: StudentsComponent,    canActivate: AG },
  { path: 'teachers',   component: TeachersComponent,   canActivate: AG },
  { path: 'parents',  component: ParentsComponent,  canActivate: AG },

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
  { path: 'timetable',     component: TimetableComponent,   canActivate: AG },
  { path: 'session-slots', component: SessionSlotsComponent, canActivate: AG },

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
  { path: 'menu',     component: MenuComponent,     canActivate: AG },

  // Dashboard (keep existing)
  { path: 'dashboard', component: DashboardComponent, canActivate: AG },

  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

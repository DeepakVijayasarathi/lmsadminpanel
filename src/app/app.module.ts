import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HttpGeneralService } from './services/http.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { StudentDashboardComponent } from './components/student-dashboard/student-dashboard.component';
import { TeacherDashboardComponent } from './components/teacher-dashboard/teacher-dashboard.component';
import { AuthInterceptor } from './auth/auth.interceptor';
import { StudentsComponent } from './components/users/students/students.component';
import { TeachersComponent } from './components/users/teachers/teachers.component';
import { ParentsComponent } from './components/users/parents/parents.component';
import { BoardsComponent } from './components/curriculum/boards/boards.component';
import { ClassesComponent } from './components/curriculum/classes/classes.component';
import { SubjectsComponent } from './components/curriculum/subjects/subjects.component';
import { TopicsComponent } from './components/curriculum/topics/topics.component';
import { CoursesComponent } from './components/learning/courses/courses.component';
import { BatchesComponent } from './components/learning/batches/batches.component';
import { LiveClassesComponent } from './components/learning/live-classes/live-classes.component';
import { LibraryComponent } from './components/learning/library/library.component';
import { ExamsComponent } from './components/assessment/exams/exams.component';
import { ResultsComponent } from './components/assessment/results/results.component';
import { NotificationsComponent } from './components/communication/notifications/notifications.component';
import { AnnouncementsComponent } from './components/communication/announcements/announcements.component';
import { PaymentsComponent } from './components/finance/payments/payments.component';
import { SubscriptionsComponent } from './components/finance/subscriptions/subscriptions.component';
import { RefundsComponent } from './components/finance/refunds/refunds.component';
import { AttendanceReportComponent } from './components/reports/attendance-report/attendance-report.component';
import { PerformanceReportComponent } from './components/reports/performance-report/performance-report.component';
import { RevenueReportComponent } from './components/reports/revenue-report/revenue-report.component';
import { RolesComponent } from './components/system/roles/roles.component';
import { SettingsComponent } from './components/system/settings/settings.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminLayoutComponent,
    DashboardComponent,
    StudentDashboardComponent,
    TeacherDashboardComponent,
    StudentsComponent,
    TeachersComponent,
    ParentsComponent,
    BoardsComponent,
    ClassesComponent,
    SubjectsComponent,
    TopicsComponent,
    CoursesComponent,
    BatchesComponent,
    LiveClassesComponent,
    LibraryComponent,
    ExamsComponent,
    ResultsComponent,
    NotificationsComponent,
    AnnouncementsComponent,
    PaymentsComponent,
    SubscriptionsComponent,
    RefundsComponent,
    AttendanceReportComponent,
    PerformanceReportComponent,
    RevenueReportComponent,
    RolesComponent,
    SettingsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgApexchartsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot()
  ],
  providers: [
    HttpGeneralService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

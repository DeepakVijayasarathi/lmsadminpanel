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
import { DeleteConfirmationModalComponent } from './components/controls/delete-confirmation-modal/delete-confirmation-modal.component';
import { CommonPaginationComponent } from './components/controls/common-pagination/common-pagination.component';
import { ActionButtonsComponent } from './components/controls/action-buttons/action-buttons.component';
import { ParentsComponent } from './components/users/parents/parents.component';
import { TeachersComponent } from './components/users/teachers/teachers.component';
import { StudentsComponent } from './components/users/students/students.component';
import { RolesComponent } from './components/system/roles/roles.component';
import { SettingsComponent } from './components/system/settings/settings.component';
import { AttendanceReportComponent } from './components/reports/attendance-report/attendance-report.component';
import { PerformanceReportComponent } from './components/reports/performance-report/performance-report.component';
import { RevenueReportComponent } from './components/reports/revenue-report/revenue-report.component';
import { LiveClassesComponent } from './components/learning/live-classes/live-classes.component';
import { LibraryComponent } from './components/learning/library/library.component';
import { CoursesComponent } from './components/learning/courses/courses.component';
import { BatchesComponent } from './components/learning/batches/batches.component';
import { SubscriptionsComponent } from './components/finance/subscriptions/subscriptions.component';
import { RefundsComponent } from './components/finance/refunds/refunds.component';
import { PaymentsComponent } from './components/finance/payments/payments.component';
import { TopicsComponent } from './components/curriculum/topics/topics.component';
import { SubjectsComponent } from './components/curriculum/subjects/subjects.component';
import { ClassesComponent } from './components/curriculum/classes/classes.component';
import { BoardsComponent } from './components/curriculum/boards/boards.component';
import { NotificationsComponent } from './components/communication/notifications/notifications.component';
import { AnnouncementsComponent } from './components/communication/announcements/announcements.component';
import { ResultsComponent } from './components/assessment/results/results.component';
import { ExamsComponent } from './components/assessment/exams/exams.component';
import { HomeworksComponent } from './components/assessment/homeworks/homeworks.component';
import { MenuComponent } from './components/system/menu/menu.component';
import { TimetableComponent } from './components/learning/timetable/timetable.component';
import { SessionSlotsComponent } from './components/learning/session-slots/session-slots.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { VideoPlayerComponent } from './components/controls/video-player/video-player.component';
import { RecordVideoComponent } from './components/learning/record-video/record-video.component';
import { CommonDashboardComponent } from './components/common-dashboard/common-dashboard.component';
import { TakeQuizComponent } from './components/assessment/take-quiz/take-quiz.component';
import { StudentQuizzesComponent } from './components/assessment/student-quizzes/student-quizzes.component';
import { StudentPerformanceComponent } from './components/reports/student-performance/student-performance.component';
import { TeacherPerformanceComponent } from './components/reports/teacher-performance/teacher-performance.component';
import { DemoClassesComponent } from './components/learning/demo-classes/demo-classes.component';
import { DemoRegisterComponent } from './components/learning/demo-classes/demo-register.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminLayoutComponent,
    DashboardComponent,
    ParentsComponent,
    TeachersComponent,
    StudentsComponent,
    StudentDashboardComponent,
    TeacherDashboardComponent,
    RolesComponent,
    SettingsComponent,
    AttendanceReportComponent,
    PerformanceReportComponent,
    RevenueReportComponent,
    LiveClassesComponent,
    LibraryComponent,
    CoursesComponent,
    BatchesComponent,
    SubscriptionsComponent,
    RefundsComponent,
    PaymentsComponent,
    TopicsComponent,
    SubjectsComponent,
    ClassesComponent,
    BoardsComponent,
    NotificationsComponent,
    AnnouncementsComponent,
    ResultsComponent,
    ExamsComponent,
    HomeworksComponent,
    MenuComponent,
    TimetableComponent,
    SessionSlotsComponent,

    DeleteConfirmationModalComponent,
    CommonPaginationComponent,
    ActionButtonsComponent,
    RegistrationComponent,
    VideoPlayerComponent,
    RecordVideoComponent,
    CommonDashboardComponent,
    TakeQuizComponent,
    StudentQuizzesComponent,
    StudentPerformanceComponent,
    TeacherPerformanceComponent,
    DemoClassesComponent,
    DemoRegisterComponent,
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

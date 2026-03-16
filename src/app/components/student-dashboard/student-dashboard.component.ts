import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  standalone: false,
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  currentTime = '';
  private timeInterval: any;

  student = {
    name: 'Aryan Mehta',
    class: 'Class 12 — Science',
    avatar: 'A',
    streak: 14,
  };

  stats = [
    { label: 'Courses Enrolled', value: '8', icon: 'fa-solid fa-book-open', color: '#0d9488', bg: '#ccfbf1' },
    { label: 'Attendance', value: '88%', icon: 'fa-solid fa-calendar-check', color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Assignments Due', value: '3', icon: 'fa-solid fa-file-pen', color: '#d97706', bg: '#fef3c7' },
    { label: 'Avg. Quiz Score', value: '76%', icon: 'fa-solid fa-trophy', color: '#db2777', bg: '#fce7f3' },
  ];

  todaysClasses = [
    { time: '09:00 AM', subject: 'Mathematics', topic: 'Calculus — Integration', teacher: 'Dr. Priya Sharma', status: 'done', duration: '60 min' },
    { time: '11:00 AM', subject: 'Physics', topic: 'Mechanics — Newton\'s Laws', teacher: 'Mr. Arjun Nair', status: 'live', duration: '45 min' },
    { time: '02:00 PM', subject: 'Chemistry', topic: 'Organic Chemistry', teacher: 'Ms. Kavitha Reddy', status: 'upcoming', duration: '60 min' },
    { time: '04:00 PM', subject: 'English', topic: 'Essay Writing', teacher: 'Mr. Rajan Pillai', status: 'upcoming', duration: '45 min' },
  ];

  courses = [
    { name: 'Mathematics', icon: 'fa-solid fa-square-root-variable', progress: 72, color: '#4f46e5', lessons: 36, done: 26 },
    { name: 'Physics', icon: 'fa-solid fa-atom', progress: 58, color: '#0d9488', lessons: 28, done: 16 },
    { name: 'Chemistry', icon: 'fa-solid fa-flask', progress: 45, color: '#f97316', lessons: 32, done: 14 },
    { name: 'Biology', icon: 'fa-solid fa-dna', progress: 81, color: '#059669', lessons: 24, done: 19 },
    { name: 'English', icon: 'fa-solid fa-book', progress: 90, color: '#db2777', lessons: 20, done: 18 },
  ];

  assignments = [
    { subject: 'Mathematics', title: 'Integration Practice Set 4', due: 'Today, 11:59 PM', priority: 'high' },
    { subject: 'Physics', title: 'Lab Report — Pendulum Experiment', due: 'Tomorrow, 6:00 PM', priority: 'medium' },
    { subject: 'Chemistry', title: 'Organic Reactions Worksheet', due: 'Mar 20, 5:00 PM', priority: 'low' },
  ];

  recentResults = [
    { subject: 'Mathematics', quiz: 'Unit 5 Quiz', score: 82, total: 100, date: 'Mar 14' },
    { subject: 'Physics', quiz: 'Mid-term Test', score: 74, total: 100, date: 'Mar 12' },
    { subject: 'Chemistry', quiz: 'Chapter 6 Quiz', score: 91, total: 100, date: 'Mar 10' },
    { subject: 'Biology', quiz: 'Unit 3 Assessment', score: 68, total: 100, date: 'Mar 8' },
  ];

  getScoreColor(score: number): string {
    if (score >= 85) return '#059669';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  }

  getScoreBg(score: number): string {
    if (score >= 85) return '#dcfce7';
    if (score >= 70) return '#fef9c3';
    return '#fee2e2';
  }

  ngOnInit(): void {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    this.currentDate = now;
  }
}

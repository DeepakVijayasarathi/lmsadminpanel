import { Component, OnInit } from '@angular/core';

export interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  batches: number;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar: string;
}

@Component({
  selector: 'app-teachers',
  standalone: false,
  templateUrl: './teachers.component.html',
  styleUrls: ['../../../shared-page.css', './teachers.component.css']
})
export class TeachersComponent implements OnInit {

  searchTerm = '';
  filterStatus = '';

  teachers: Teacher[] = [
    { id: 1, name: 'Dr. Rajesh Kumar',    email: 'rajesh.kumar@lms.com',    phone: '+91 98001 11001', subject: 'Mathematics',    batches: 5, status: 'active',   joinDate: '2022-06-01', avatar: 'RK' },
    { id: 2, name: 'Prof. Meena Verma',   email: 'meena.verma@lms.com',     phone: '+91 98002 22002', subject: 'Physics',         batches: 4, status: 'active',   joinDate: '2021-08-15', avatar: 'MV' },
    { id: 3, name: 'Sunita Rao',          email: 'sunita.rao@lms.com',       phone: '+91 98003 33003', subject: 'Chemistry',       batches: 3, status: 'active',   joinDate: '2023-01-10', avatar: 'SR' },
    { id: 4, name: 'Amit Joshi',          email: 'amit.joshi@lms.com',       phone: '+91 98004 44004', subject: 'English',         batches: 6, status: 'active',   joinDate: '2020-11-20', avatar: 'AJ' },
    { id: 5, name: 'Kavitha Nambiar',     email: 'kavitha.nambiar@lms.com',  phone: '+91 98005 55005', subject: 'Biology',         batches: 4, status: 'active',   joinDate: '2022-03-05', avatar: 'KN' },
    { id: 6, name: 'Deepak Malhotra',     email: 'deepak.malhotra@lms.com',  phone: '+91 98006 66006', subject: 'History',         batches: 2, status: 'inactive', joinDate: '2021-07-18', avatar: 'DM' },
    { id: 7, name: 'Preethi Shankar',     email: 'preethi.shankar@lms.com',  phone: '+91 98007 77007', subject: 'Computer Science', batches: 5, status: 'active',   joinDate: '2023-04-12', avatar: 'PS' },
  ];

  get filteredTeachers(): Teacher[] {
    return this.teachers.filter(t => {
      const matchSearch = !this.searchTerm ||
        t.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.filterStatus || t.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  ngOnInit(): void {}
}

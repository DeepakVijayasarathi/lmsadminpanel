import { Component, OnInit } from '@angular/core';

export interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  batch: string;
  class: string;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar: string;
}

@Component({
  selector: 'app-students',
  standalone: false,
  templateUrl: './students.component.html',
  styleUrls: ['../../../shared-page.css', './students.component.css']
})
export class StudentsComponent implements OnInit {

  searchTerm = '';
  filterStatus = '';

  students: Student[] = [
    { id: 1, name: 'Aarav Sharma',    email: 'aarav.sharma@email.com',    phone: '+91 98765 43210', batch: 'Batch A',  class: 'Grade 10', status: 'active',   joinDate: '2024-01-15', avatar: 'AS' },
    { id: 2, name: 'Priya Patel',     email: 'priya.patel@email.com',     phone: '+91 87654 32109', batch: 'Batch B',  class: 'Grade 11', status: 'active',   joinDate: '2024-02-20', avatar: 'PP' },
    { id: 3, name: 'Rohan Mehta',     email: 'rohan.mehta@email.com',     phone: '+91 76543 21098', batch: 'Batch A',  class: 'Grade 9',  status: 'inactive', joinDate: '2023-11-05', avatar: 'RM' },
    { id: 4, name: 'Sneha Iyer',      email: 'sneha.iyer@email.com',      phone: '+91 65432 10987', batch: 'Batch C',  class: 'Grade 12', status: 'active',   joinDate: '2024-03-10', avatar: 'SI' },
    { id: 5, name: 'Karan Singh',     email: 'karan.singh@email.com',     phone: '+91 54321 09876', batch: 'Batch B',  class: 'Grade 10', status: 'active',   joinDate: '2024-01-28', avatar: 'KS' },
    { id: 6, name: 'Ananya Reddy',    email: 'ananya.reddy@email.com',    phone: '+91 43210 98765', batch: 'Batch D',  class: 'Grade 11', status: 'inactive', joinDate: '2023-09-14', avatar: 'AR' },
    { id: 7, name: 'Vikram Nair',     email: 'vikram.nair@email.com',     phone: '+91 32109 87654', batch: 'Batch C',  class: 'Grade 9',  status: 'active',   joinDate: '2024-02-08', avatar: 'VN' },
    { id: 8, name: 'Divya Krishnan',  email: 'divya.krishnan@email.com',  phone: '+91 21098 76543', batch: 'Batch A',  class: 'Grade 12', status: 'active',   joinDate: '2024-03-22', avatar: 'DK' },
  ];

  get filteredStudents(): Student[] {
    return this.students.filter(s => {
      const matchSearch = !this.searchTerm ||
        s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.batch.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.filterStatus || s.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  ngOnInit(): void {}
}

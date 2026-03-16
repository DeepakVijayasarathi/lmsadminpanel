import { Component, OnInit } from '@angular/core';

export interface Parent {
  id: number;
  name: string;
  email: string;
  phone: string;
  children: number;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar: string;
}

@Component({
  selector: 'app-parents',
  standalone: false,
  templateUrl: './parents.component.html',
  styleUrls: ['../../../shared-page.css', './parents.component.css']
})
export class ParentsComponent implements OnInit {

  searchTerm = '';

  parents: Parent[] = [
    { id: 1, name: 'Suresh Sharma',    email: 'suresh.sharma@email.com',   phone: '+91 90001 10001', children: 2, status: 'active',   joinDate: '2024-01-15', avatar: 'SS' },
    { id: 2, name: 'Lalitha Patel',    email: 'lalitha.patel@email.com',   phone: '+91 90002 20002', children: 1, status: 'active',   joinDate: '2024-02-20', avatar: 'LP' },
    { id: 3, name: 'Mohan Mehta',      email: 'mohan.mehta@email.com',     phone: '+91 90003 30003', children: 3, status: 'inactive', joinDate: '2023-10-08', avatar: 'MM' },
    { id: 4, name: 'Geetha Iyer',      email: 'geetha.iyer@email.com',     phone: '+91 90004 40004', children: 2, status: 'active',   joinDate: '2024-03-11', avatar: 'GI' },
    { id: 5, name: 'Ramesh Singh',     email: 'ramesh.singh@email.com',    phone: '+91 90005 50005', children: 1, status: 'active',   joinDate: '2024-01-30', avatar: 'RS' },
    { id: 6, name: 'Usha Reddy',       email: 'usha.reddy@email.com',      phone: '+91 90006 60006', children: 2, status: 'active',   joinDate: '2023-12-05', avatar: 'UR' },
  ];

  get filteredParents(): Parent[] {
    return this.parents.filter(p =>
      !this.searchTerm ||
      p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      p.phone.includes(this.searchTerm)
    );
  }

  ngOnInit(): void {}
}

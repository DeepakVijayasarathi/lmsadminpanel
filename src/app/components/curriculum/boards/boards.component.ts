import { Component } from '@angular/core';

interface Board {
  id: number;
  name: string;
  shortCode: string;
  classCount: number;
  subjectCount: number;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

@Component({
  selector: 'app-boards',
  standalone: false,
  templateUrl: './boards.component.html',
  styleUrls: ['../../../shared-page.css', './boards.component.css']
})
export class BoardsComponent {
  searchQuery = '';

  boards: Board[] = [
    { id: 1, name: 'Central Board of Secondary Education', shortCode: 'CBSE',      classCount: 12, subjectCount: 38, status: 'Active',   createdDate: '12 Jan 2023' },
    { id: 2, name: 'Indian Certificate of Secondary Education', shortCode: 'ICSE', classCount: 10, subjectCount: 34, status: 'Active',   createdDate: '15 Jan 2023' },
    { id: 3, name: 'Maharashtra State Board',                   shortCode: 'MHSB', classCount: 12, subjectCount: 32, status: 'Active',   createdDate: '20 Feb 2023' },
    { id: 4, name: 'International Baccalaureate',               shortCode: 'IB',   classCount:  6, subjectCount: 28, status: 'Active',   createdDate: '05 Mar 2023' },
    { id: 5, name: 'National Institute of Open Schooling',      shortCode: 'NIOS', classCount:  4, subjectCount: 30, status: 'Active',   createdDate: '10 Mar 2023' },
    { id: 6, name: 'Cambridge Assessment International',        shortCode: 'CAIE', classCount:  4, subjectCount: 30, status: 'Inactive', createdDate: '18 Apr 2023' },
  ];

  get filteredBoards(): Board[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.boards;
    return this.boards.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.shortCode.toLowerCase().includes(q)
    );
  }
}

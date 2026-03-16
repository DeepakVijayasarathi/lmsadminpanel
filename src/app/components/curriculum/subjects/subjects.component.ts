import { Component } from '@angular/core';

interface Subject {
  id: number;
  name: string;
  code: string;
  className: string;
  board: string;
  topicCount: number;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-subjects',
  standalone: false,
  templateUrl: './subjects.component.html',
  styleUrls: ['../../../shared-page.css', './subjects.component.css']
})
export class SubjectsComponent {
  searchQuery = '';
  selectedClass = '';

  subjects: Subject[] = [
    { id: 1, name: 'Mathematics',       code: 'MATH-10', className: 'Class 10', board: 'CBSE', topicCount: 18, status: 'Active'   },
    { id: 2, name: 'Physics',           code: 'PHY-11',  className: 'Class 11', board: 'CBSE', topicCount: 22, status: 'Active'   },
    { id: 3, name: 'Chemistry',         code: 'CHEM-11', className: 'Class 11', board: 'ICSE', topicCount: 20, status: 'Active'   },
    { id: 4, name: 'Biology',           code: 'BIO-10',  className: 'Class 10', board: 'CBSE', topicCount: 16, status: 'Active'   },
    { id: 5, name: 'English',           code: 'ENG-9',   className: 'Class 9',  board: 'MHSB', topicCount: 14, status: 'Active'   },
    { id: 6, name: 'History',           code: 'HIST-9',  className: 'Class 9',  board: 'ICSE', topicCount: 12, status: 'Active'   },
    { id: 7, name: 'Geography',         code: 'GEO-8',   className: 'Class 8',  board: 'CBSE', topicCount: 11, status: 'Inactive' },
    { id: 8, name: 'Computer Science',  code: 'CS-12',   className: 'Class 12', board: 'CBSE', topicCount: 24, status: 'Active'   },
  ];

  get classes(): string[] {
    return [...new Set(this.subjects.map(s => s.className))];
  }

  get filteredSubjects(): Subject[] {
    let list = this.subjects;
    if (this.selectedClass) {
      list = list.filter(s => s.className === this.selectedClass);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.board.toLowerCase().includes(q)
      );
    }
    return list;
  }
}

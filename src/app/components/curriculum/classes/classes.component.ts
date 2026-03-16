import { Component } from '@angular/core';

interface ClassEntry {
  id: number;
  name: string;
  board: string;
  studentCount: number;
  batchCount: number;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-classes',
  standalone: false,
  templateUrl: './classes.component.html',
  styleUrls: ['../../../shared-page.css', './classes.component.css']
})
export class ClassesComponent {
  searchQuery = '';
  selectedBoard = '';

  classes: ClassEntry[] = [
    { id: 1, name: 'Class 1',  board: 'CBSE', studentCount: 320, batchCount: 8,  status: 'Active'   },
    { id: 2, name: 'Class 3',  board: 'CBSE', studentCount: 298, batchCount: 7,  status: 'Active'   },
    { id: 3, name: 'Class 5',  board: 'ICSE', studentCount: 275, batchCount: 6,  status: 'Active'   },
    { id: 4, name: 'Class 7',  board: 'ICSE', studentCount: 342, batchCount: 9,  status: 'Active'   },
    { id: 5, name: 'Class 9',  board: 'CBSE', studentCount: 410, batchCount: 10, status: 'Active'   },
    { id: 6, name: 'Class 10', board: 'MHSB', studentCount: 388, batchCount: 9,  status: 'Active'   },
    { id: 7, name: 'Class 11', board: 'CBSE', studentCount: 365, batchCount: 8,  status: 'Active'   },
    { id: 8, name: 'Class 12', board: 'MHSB', studentCount: 449, batchCount: 11, status: 'Inactive' },
  ];

  get boards(): string[] {
    return [...new Set(this.classes.map(c => c.board))];
  }

  get filteredClasses(): ClassEntry[] {
    let list = this.classes;
    if (this.selectedBoard) {
      list = list.filter(c => c.board === this.selectedBoard);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.board.toLowerCase().includes(q)
      );
    }
    return list;
  }
}

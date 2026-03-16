import { Component } from '@angular/core';

interface Topic {
  id: number;
  title: string;
  subject: string;
  className: string;
  chapterNo: number;
  duration: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-topics',
  standalone: false,
  templateUrl: './topics.component.html',
  styleUrls: ['../../../shared-page.css', './topics.component.css']
})
export class TopicsComponent {
  searchQuery = '';
  selectedSubject = '';

  topics: Topic[] = [
    { id: 1, title: 'Differential Calculus',        subject: 'Mathematics',      className: 'Class 12', chapterNo: 5,  duration: '8 hrs',  status: 'Active'   },
    { id: 2, title: 'Newtonian Mechanics',           subject: 'Physics',          className: 'Class 11', chapterNo: 3,  duration: '10 hrs', status: 'Active'   },
    { id: 3, title: 'Organic Chemistry Basics',      subject: 'Chemistry',        className: 'Class 11', chapterNo: 7,  duration: '12 hrs', status: 'Active'   },
    { id: 4, title: 'Cell Division & Mitosis',       subject: 'Biology',          className: 'Class 10', chapterNo: 4,  duration: '6 hrs',  status: 'Active'   },
    { id: 5, title: 'Prose & Comprehension',         subject: 'English',          className: 'Class 9',  chapterNo: 2,  duration: '5 hrs',  status: 'Active'   },
    { id: 6, title: 'World War II',                  subject: 'History',          className: 'Class 9',  chapterNo: 9,  duration: '7 hrs',  status: 'Active'   },
    { id: 7, title: 'Climate Zones & Biomes',        subject: 'Geography',        className: 'Class 8',  chapterNo: 6,  duration: '6 hrs',  status: 'Inactive' },
    { id: 8, title: 'Object-Oriented Programming',  subject: 'Computer Science', className: 'Class 12', chapterNo: 4,  duration: '14 hrs', status: 'Active'   },
  ];

  get subjects(): string[] {
    return [...new Set(this.topics.map(t => t.subject))];
  }

  get filteredTopics(): Topic[] {
    let list = this.topics;
    if (this.selectedSubject) {
      list = list.filter(t => t.subject === this.selectedSubject);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.className.toLowerCase().includes(q)
      );
    }
    return list;
  }
}

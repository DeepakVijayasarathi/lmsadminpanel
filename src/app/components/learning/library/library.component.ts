import { Component } from '@angular/core';

interface LibraryResource {
  id: number;
  title: string;
  subject: string;
  type: 'PDF' | 'Video' | 'Notes' | 'Presentation';
  class: string;
  uploadedBy: string;
  fileSize: string;
  downloads: number;
  status: 'active' | 'draft' | 'archived';
  uploadDate: string;
}

@Component({
  selector: 'app-library',
  standalone: false,
  templateUrl: './library.component.html',
  styleUrls: ['../../../shared-page.css', './library.component.css']
})
export class LibraryComponent {
  searchQuery = '';
  typeFilter = '';

  resources: LibraryResource[] = [
    { id: 1, title: 'Algebra Formulas – Complete Guide', subject: 'Mathematics', type: 'PDF', class: 'Class 10', uploadedBy: 'Dr. Anita Sharma', fileSize: '2.4 MB', downloads: 348, status: 'active', uploadDate: '2026-02-10' },
    { id: 2, title: 'Newton\'s Laws of Motion – Video Lecture', subject: 'Physics', type: 'Video', class: 'Class 11', uploadedBy: 'Mr. Rajesh Kumar', fileSize: '145 MB', downloads: 276, status: 'active', uploadDate: '2026-02-15' },
    { id: 3, title: 'Organic Chemistry – Class Notes', subject: 'Chemistry', type: 'Notes', class: 'Class 12', uploadedBy: 'Ms. Priya Nair', fileSize: '1.8 MB', downloads: 189, status: 'active', uploadDate: '2026-02-20' },
    { id: 4, title: 'Cell Division – Presentation Slides', subject: 'Biology', type: 'Presentation', class: 'Class 11', uploadedBy: 'Dr. Suresh Menon', fileSize: '8.6 MB', downloads: 142, status: 'active', uploadDate: '2026-03-01' },
    { id: 5, title: 'Shakespeare\'s Works – Study Material', subject: 'English', type: 'PDF', class: 'Class 10', uploadedBy: 'Ms. Kavitha Rao', fileSize: '3.2 MB', downloads: 210, status: 'active', uploadDate: '2026-03-05' },
    { id: 6, title: 'French Revolution – Video Summary', subject: 'History', type: 'Video', class: 'Class 10', uploadedBy: 'Mr. Arun Pillai', fileSize: '88 MB', downloads: 95, status: 'draft', uploadDate: '2026-03-08' },
    { id: 7, title: 'Data Structures – Quick Notes', subject: 'Computer Science', type: 'Notes', class: 'Class 12', uploadedBy: 'Ms. Deepa Iyer', fileSize: '1.1 MB', downloads: 164, status: 'active', uploadDate: '2026-03-10' }
  ];

  get filteredResources(): LibraryResource[] {
    return this.resources.filter(r => {
      const matchesSearch = !this.searchQuery ||
        r.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.uploadedBy.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesType = !this.typeFilter || r.type === this.typeFilter;
      return matchesSearch && matchesType;
    });
  }

  getTypeChipClass(type: string): string {
    const map: Record<string, string> = {
      PDF: 'res-type res-type--pdf',
      Video: 'res-type res-type--video',
      Notes: 'res-type res-type--notes',
      Presentation: 'res-type res-type--ppt'
    };
    return map[type] || 'res-type';
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      PDF: 'fa-file-pdf',
      Video: 'fa-video',
      Notes: 'fa-note-sticky',
      Presentation: 'fa-file-powerpoint'
    };
    return map[type] || 'fa-file';
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      active: 'pg-badge pg-badge--green',
      draft: 'pg-badge pg-badge--yellow',
      archived: 'pg-badge pg-badge--gray'
    };
    return map[status] || 'pg-badge';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

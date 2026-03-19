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
    { id: 1,  title: 'Physics Formula Sheet – NEET & JEE',            subject: 'Physics',     type: 'PDF',          class: 'NEET / JEE',          uploadedBy: 'Dr. Vikram Sharma',  fileSize: '3.2 MB',  downloads: 1248, status: 'active',   uploadDate: '2026-01-10' },
    { id: 2,  title: 'Mechanics Complete – Video Lecture Series',       subject: 'Physics',     type: 'Video',        class: 'JEE Main 2025',       uploadedBy: 'Mr. Rahul Gupta',    fileSize: '820 MB',  downloads: 876,  status: 'active',   uploadDate: '2026-01-18' },
    { id: 3,  title: 'Organic Chemistry – Reaction Mechanism Notes',    subject: 'Chemistry',   type: 'Notes',        class: 'NEET 2025 – Batch A', uploadedBy: 'Ms. Pooja Iyer',     fileSize: '4.6 MB',  downloads: 964,  status: 'active',   uploadDate: '2026-01-25' },
    { id: 4,  title: 'Biology – Human Physiology Slides (NEET)',        subject: 'Biology',     type: 'Presentation', class: 'NEET 2025 – Batch B', uploadedBy: 'Dr. Meena Krishnan', fileSize: '12.4 MB', downloads: 742,  status: 'active',   uploadDate: '2026-02-05' },
    { id: 5,  title: 'Mathematics – Calculus & Integration Guide',      subject: 'Mathematics', type: 'PDF',          class: 'JEE Advanced 2025',   uploadedBy: 'Dr. Kiran Patel',    fileSize: '5.8 MB',  downloads: 682,  status: 'active',   uploadDate: '2026-02-12' },
    { id: 6,  title: 'Inorganic Chemistry – NCERT Solutions Video',     subject: 'Chemistry',   type: 'Video',        class: 'NEET 2025 – Batch A', uploadedBy: 'Dr. Sanjay Mishra',  fileSize: '560 MB',  downloads: 598,  status: 'active',   uploadDate: '2026-02-20' },
    { id: 7,  title: 'Genetics & Evolution – Quick Notes (NEET)',       subject: 'Biology',     type: 'Notes',        class: 'NEET 2025 – Batch B', uploadedBy: 'Ms. Divya Nair',     fileSize: '2.1 MB',  downloads: 524,  status: 'active',   uploadDate: '2026-03-01' },
    { id: 8,  title: 'JEE Adv – Previous Year Paper Analysis Slides',  subject: 'Physics',     type: 'Presentation', class: 'JEE Advanced 2025',   uploadedBy: 'Dr. Vikram Sharma',  fileSize: '18.2 MB', downloads: 488,  status: 'active',   uploadDate: '2026-03-06' },
    { id: 9,  title: 'Coordinate Geometry – Problem Set PDF',           subject: 'Mathematics', type: 'PDF',          class: 'JEE Main 2025',       uploadedBy: 'Mr. Arjun Verma',    fileSize: '6.4 MB',  downloads: 412,  status: 'draft',    uploadDate: '2026-03-10' },
    { id: 10, title: 'Electrostatics – Concept Video (NEET+JEE)',       subject: 'Physics',     type: 'Video',        class: 'NEET / JEE',          uploadedBy: 'Dr. Vikram Sharma',  fileSize: '380 MB',  downloads: 356,  status: 'active',   uploadDate: '2026-03-12' },
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

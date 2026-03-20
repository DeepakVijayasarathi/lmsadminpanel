import { Component } from '@angular/core';
import { CommonService } from '../../../services/common.service';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: 'students' | 'teachers' | 'all';
  postedBy: string;
  postedAt: string;
  pinned: boolean;
  status: 'active' | 'expired';
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-announcements',
  standalone: false,
  templateUrl: './announcements.component.html',
  styleUrls: ['../../../shared-page.css', './announcements.component.css']
})
export class AnnouncementsComponent {
  searchQuery = '';
  audienceFilter = '';

  modalMode: ModalMode = null;
  selectedAnn: Announcement | null = null;

  // Form fields
  formTitle = '';
  formContent = '';
  formAudience: 'students' | 'teachers' | 'all' = 'all';
  formPinned = false;
  formTitleError = '';
  formContentError = '';

  nextId = 7;

  announcements: Announcement[] = [
    { id: 1, title: 'Mid-Term Exams Begin March 20', content: 'All students are informed that mid-term examinations will commence from March 20. Detailed schedule has been shared via the app.', audience: 'students', postedBy: 'Admin', postedAt: '2026-03-15', pinned: true,  status: 'active' },
    { id: 2, title: 'Staff Training on March 18',    content: 'All teaching staff are required to attend the mandatory training session on March 18 in the conference room.', audience: 'teachers', postedBy: 'Principal', postedAt: '2026-03-14', pinned: true,  status: 'active' },
    { id: 3, title: 'New Library Hours Effective April', content: 'Library will now remain open from 7 AM to 8 PM on all working days starting April 1.', audience: 'all', postedBy: 'Admin', postedAt: '2026-03-13', pinned: false, status: 'active' },
    { id: 4, title: 'Annual Sports Day Registration',  content: 'Registration for the Annual Sports Day is now open. Last date for registration is March 25.', audience: 'students', postedBy: 'Sports Coordinator', postedAt: '2026-03-12', pinned: true,  status: 'active' },
    { id: 5, title: 'Winter Break Schedule',           content: 'School will be closed for winter break from December 25 to January 5. Classes resume January 6.', audience: 'all', postedBy: 'Admin', postedAt: '2025-12-20', pinned: false, status: 'expired' },
    { id: 6, title: 'Q3 Exam Results Published',       content: 'Q3 examination results have been published. Students can view their scores in the results section.', audience: 'students', postedBy: 'Admin', postedAt: '2025-11-30', pinned: false, status: 'expired' },
  ];

  constructor(private commonService: CommonService) {}

  get filteredAnnouncements(): Announcement[] {
    const q = this.searchQuery.toLowerCase();
    return this.announcements.filter(a => {
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.postedBy.toLowerCase().includes(q);
      const matchAudience = !this.audienceFilter || a.audience === this.audienceFilter;
      return matchSearch && matchAudience;
    });
  }

  get activeCount(): number { return this.announcements.filter(a => a.status === 'active').length; }
  get pinnedCount(): number { return this.announcements.filter(a => a.pinned).length; }
  get expiredCount(): number { return this.announcements.filter(a => a.status === 'expired').length; }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedAnn = null;
    this.formTitle = ''; this.formContent = ''; this.formAudience = 'all'; this.formPinned = false;
    this.formTitleError = ''; this.formContentError = '';
  }

  openEditModal(ann: Announcement): void {
    this.modalMode = 'edit';
    this.selectedAnn = ann;
    this.formTitle = ann.title; this.formContent = ann.content; this.formAudience = ann.audience; this.formPinned = ann.pinned;
    this.formTitleError = ''; this.formContentError = '';
  }

  openViewModal(ann: Announcement): void { this.modalMode = 'view'; this.selectedAnn = ann; }
  openDeleteModal(ann: Announcement): void { this.modalMode = 'delete'; this.selectedAnn = ann; }
  closeModal(): void { this.modalMode = null; this.selectedAnn = null; this.formTitleError = ''; this.formContentError = ''; }

  validateForm(): boolean {
    this.formTitleError = ''; this.formContentError = '';
    let valid = true;
    if (!this.formTitle.trim()) { this.formTitleError = 'Title is required.'; valid = false; }
    if (!this.formContent.trim()) { this.formContentError = 'Content is required.'; valid = false; }
    return valid;
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    const today = new Date().toISOString().split('T')[0];
    if (this.modalMode === 'create') {
      this.announcements.unshift({
        id: this.nextId++,
        title: this.formTitle.trim(),
        content: this.formContent.trim(),
        audience: this.formAudience,
        postedBy: 'Admin',
        postedAt: today,
        pinned: this.formPinned,
        status: 'active'
      });
      this.commonService.success(`Announcement "${this.formTitle.trim()}" posted.`);
    } else if (this.modalMode === 'edit' && this.selectedAnn) {
      const idx = this.announcements.findIndex(a => a.id === this.selectedAnn!.id);
      if (idx > -1) {
        this.announcements[idx] = { ...this.announcements[idx], title: this.formTitle.trim(), content: this.formContent.trim(), audience: this.formAudience, pinned: this.formPinned };
      }
      this.commonService.success('Announcement updated.');
    }
    this.closeModal();
  }

  deleteAnnouncement(): void {
    if (!this.selectedAnn) return;
    this.announcements = this.announcements.filter(a => a.id !== this.selectedAnn!.id);
    this.commonService.success(`Announcement "${this.selectedAnn.title}" deleted.`);
    this.closeModal();
  }

  audienceBadge(audience: string): string {
    const map: Record<string, string> = { students: 'pg-badge--blue', teachers: 'pg-badge--purple', all: 'pg-badge--indigo' };
    return map[audience] || 'pg-badge--gray';
  }

  statusBadge(status: string): string {
    return status === 'active' ? 'pg-badge--green' : 'pg-badge--gray';
  }
}

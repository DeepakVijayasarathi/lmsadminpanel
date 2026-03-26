import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { HttpGeneralService } from '../../../services/http.service';
import { environment } from '../../../../environments/environment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BASE_URL = environment.apiUrl;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ParentStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export interface Parent {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt?: string;
  students: ParentStudent[]; // API returns "students", not "children"
}

type ModalMode =
  | 'view'
  | 'delete'
  | 'block'
  | 'device-reset'
  | 'unblock'
  | null;

@Component({
  selector: 'app-parents',
  standalone: false,
  templateUrl: './parents.component.html',
  styleUrls: ['../../../shared-page.css', './parents.component.css'],
})
export class ParentsComponent implements OnInit {
  parents: Parent[] = [];
  filteredParents: Parent[] = [];

  searchTerm: string = '';
  filterStatus: string = '';
  isLoading: boolean = false;

  modalMode: ModalMode = null;
  selectedParent: Parent | null = null;

  formBlockReason: string = '';
  blockReasonError: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadParents();
  }

  // ─── Load ────────────────────────────────────────────────────

  loadParents(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/batches/parents').subscribe({
      next: (res: any) => {
        this.parents = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load parents.');
        this.isLoading = false;
      },
    });
  }

  // ─── Actions ─────────────────────────────────────────────────

  deleteParent(): void {
    if (!this.selectedParent) return;
    this.httpService
      .deleteData(BASE_URL, `/batches/parents/${this.selectedParent.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(`"${this.selectedParent!.name}" deleted.`);
          this.closeModal();
          this.loadParents();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to delete parent.',
          );
        },
      });
  }

  blockParent(): void {
    if (!this.selectedParent) return;
    if (!this.formBlockReason.trim()) {
      this.blockReasonError = 'Block reason is required.';
      return;
    }
    this.httpService
      .putData(BASE_URL, `/batches/parents/${this.selectedParent.id}/block`, {
        reason: this.formBlockReason.trim(),
      })
      .subscribe({
        next: () => {
          this.commonService.success(`"${this.selectedParent!.name}" blocked.`);
          this.closeModal();
          this.loadParents();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to block parent.',
          );
        },
      });
  }

  deviceReset(): void {
    if (!this.selectedParent) return;
    this.httpService
      .putData(
        BASE_URL,
        `/batches/parents/${this.selectedParent.id}/device-reset`,
        {},
      )
      .subscribe({
        next: () => {
          this.commonService.success('Device reset successful.');
          this.closeModal();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to reset device.',
          );
        },
      });
  }

  // ─── Modals ──────────────────────────────────────────────────

  openViewModal(parent: Parent): void {
    this.selectedParent = { ...parent }; // clone to ensure change detection
    this.modalMode = 'view';
  }

  openDeleteModal(parent: Parent): void {
    this.selectedParent = { ...parent };
    this.modalMode = 'delete';
  }

  openBlockModal(parent: Parent): void {
    this.selectedParent = { ...parent };
    this.formBlockReason = '';
    this.blockReasonError = '';
    this.modalMode = 'block';
  }

  openDeviceResetModal(parent: Parent): void {
    this.selectedParent = { ...parent };
    this.modalMode = 'device-reset';
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedParent = null;
    this.formBlockReason = '';
    this.blockReasonError = '';
  }

  // ─── Filters ─────────────────────────────────────────────────

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.parents];
    if (this.filterStatus) {
      list = list.filter((p) =>
        this.filterStatus === 'active' ? p.isActive : !p.isActive,
      );
    }
    const q = this.searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.includes(q) ||
          p.relationship?.toLowerCase().includes(q) ||
          p.students?.some(
            (s) =>
              s.firstName?.toLowerCase().includes(q) ||
              s.lastName?.toLowerCase().includes(q) ||
              s.email?.toLowerCase().includes(q),
          ),
      );
    }
    this.filteredParents = list;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  getStudentInitials(student: ParentStudent): string {
    return (
      (
        (student.firstName?.[0] ?? '') + (student.lastName?.[0] ?? '')
      ).toUpperCase() || '?'
    );
  }

  getStudentFullName(student: ParentStudent): string {
    return `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim();
  }

  get totalActive(): number {
    return this.parents.filter((p) => p.isActive).length;
  }

  get totalInactive(): number {
    return this.parents.filter((p) => !p.isActive).length;
  }

  exportToPdf(): void {
    const doc = new jsPDF();
    const now = new Date();

    // ── Header bar ──────────────────────────────────────────────────────────────
    doc.setFillColor(147, 51, 234); // purple-600
    doc.rect(0, 0, 210, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Parents Report', 14, 14);

    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exported: ${dateStr}`, 196, 14, { align: 'right' });

    // ── Summary chips ────────────────────────────────────────────────────────────
    const stats = [
      {
        label: 'Total',
        value: this.parents.length,
        color: [147, 51, 234] as [number, number, number],
      },
      {
        label: 'Active',
        value: this.totalActive,
        color: [16, 185, 129] as [number, number, number],
      },
      {
        label: 'Inactive',
        value: this.totalInactive,
        color: [239, 68, 68] as [number, number, number],
      },
    ];

    let chipX = 14;
    stats.forEach((stat) => {
      doc.setFillColor(...stat.color);
      doc.roundedRect(chipX, 27, 42, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${stat.label}: ${stat.value}`, chipX + 21, 33.5, {
        align: 'center',
      });
      chipX += 46;
    });

    // ── Table ────────────────────────────────────────────────────────────────────
    // Parents table — one row per parent, students listed as comma-separated names
    const rows = this.filteredParents.map((p, i) => {
      const studentNames = p.students?.length
        ? p.students.map((s) => this.getStudentFullName(s)).join(', ')
        : '—';
      return [
        i + 1,
        p.name || '—',
        p.relationship || '—',
        p.email || '—',
        p.phone || '—',
        studentNames,
        p.isActive ? 'Active' : 'Inactive',
      ];
    });

    autoTable(doc, {
      startY: 42,
      head: [
        ['#', 'Name', 'Relationship', 'Email', 'Phone', 'Students', 'Status'],
      ],
      body: rows,
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [40, 40, 40],
      },
      alternateRowStyles: {
        fillColor: [250, 245, 255],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        5: { cellWidth: 45 }, // Students column — needs more room
        6: { halign: 'center' },
      },
      didDrawCell: (data) => {
        // Status column (index 6)
        if (data.section === 'body' && data.column.index === 6) {
          const isActive = data.cell.raw === 'Active';
          doc.setFillColor(
            ...((isActive ? [209, 250, 229] : [254, 226, 226]) as [
              number,
              number,
              number,
            ]),
          );
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            'F',
          );
          doc.setTextColor(
            ...((isActive ? [6, 95, 70] : [153, 27, 27]) as [
              number,
              number,
              number,
            ]),
          );
          doc.setFontSize(8);
          doc.text(
            data.cell.raw as string,
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 1,
            { align: 'center' },
          );
        }
      },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(7.5);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${pageNum} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 8,
          { align: 'center' },
        );
      },
    });

    const fileName = `parents_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;
    doc.save(fileName);
  }

  unblockParent(): void {
    if (!this.selectedParent) return;
    this.httpService
      .putData(BASE_URL, `/batches/parents/${this.selectedParent.id}/block`, {
        reason: '',
      })
      .subscribe({
        next: () => {
          this.commonService.success(
            `"${this.selectedParent!.name}" unblocked.`,
          );
          this.closeModal();
          this.loadParents();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to unblock parent.',
          );
        },
      });
  }

  openUnblockModal(parent: Parent): void {
    this.modalMode = 'unblock';
    this.selectedParent = parent;
  }
}

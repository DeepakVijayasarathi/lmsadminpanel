import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { HttpGeneralService } from '../../services/http.service';
import { environment } from '../../../environments/environment';

const BASE_URL = environment.apiUrl;

export interface Zonal {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ZonalPayload {
  name: string;
  code: string;
  description: string;
}

export interface ZonalUpdatePayload {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

@Component({
  selector: 'app-zonal',
  standalone: false,
  templateUrl: './zonal.component.html',
  styleUrls: ['../../shared-page.css', './zonal.component.css'],
})
export class ZonalComponent implements OnInit {
  zonals: Zonal[] = [];
  filteredZonals: Zonal[] = [];

  searchTerm: string = '';
  filterStatus: string = '';
  isLoading: boolean = false;

  pageSize = 10;
  currentPage = 1;

  get pagedZonals(): Zonal[] {
    return this.filteredZonals.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredZonals.length / this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // Modal
  modalMode: ModalMode = null;
  selectedZonal: Zonal | null = null;

  // Form fields
  formName: string = '';
  formCode: string = '';
  formDescription: string = '';
  formIsActive: boolean = true;

  // Errors
  nameError: string = '';
  codeError: string = '';

  constructor(
    private commonService: CommonService,
    private httpService: HttpGeneralService<any>,
  ) {}

  ngOnInit(): void {
    this.loadZonals();
  }

  // ─── Load ────────────────────────────────────────────────────

  loadZonals(): void {
    this.isLoading = true;
    this.httpService.getData(BASE_URL, '/zonal').subscribe({
      next: (res: any) => {
        this.zonals = Array.isArray(res) ? res : (res?.data ?? []);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.commonService.error('Failed to load zonals.');
        this.isLoading = false;
      },
    });
  }

  // ─── CRUD ────────────────────────────────────────────────────

  createZonal(): void {
    const payload: ZonalPayload = {
      name: this.formName.trim(),
      code: this.formCode.trim(),
      description: this.formDescription.trim(),
    };
    this.httpService.postData(BASE_URL, '/zonal', payload).subscribe({
      next: () => {
        this.commonService.success('Zonal created successfully.');
        this.closeModal();
        this.loadZonals();
      },
      error: (err: any) => {
        this.commonService.error(
          err?.error?.message || 'Failed to create zonal.',
        );
      },
    });
  }

  updateZonal(): void {
    if (!this.selectedZonal) return;
    const payload: ZonalUpdatePayload = {
      name: this.formName.trim(),
      code: this.formCode.trim(),
      description: this.formDescription.trim(),
      isActive: this.formIsActive,
    };
    this.httpService
      .putData(BASE_URL, `/zonal/${this.selectedZonal.id}`, payload)
      .subscribe({
        next: () => {
          this.commonService.success('Zonal updated successfully.');
          this.closeModal();
          this.loadZonals();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to update zonal.',
          );
        },
      });
  }

  deleteZonal(): void {
    if (!this.selectedZonal) return;
    this.httpService
      .deleteData(BASE_URL, `/zonal/${this.selectedZonal.id}`)
      .subscribe({
        next: () => {
          this.commonService.success(
            `Zonal "${this.selectedZonal!.name}" deleted.`,
          );
          this.closeModal();
          this.loadZonals();
        },
        error: (err: any) => {
          this.commonService.error(
            err?.error?.message || 'Failed to delete zonal.',
          );
        },
      });
  }

  // ─── Modals ──────────────────────────────────────────────────

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedZonal = null;
    this.resetForm();
  }

  openEditModal(zonal: Zonal): void {
    this.modalMode = 'edit';
    this.selectedZonal = zonal;
    this.formName = zonal.name;
    this.formCode = zonal.code;
    this.formDescription = zonal.description;
    this.formIsActive = zonal.isActive;
    this.clearErrors();
  }

  openViewModal(zonal: Zonal): void {
    this.modalMode = 'view';
    this.selectedZonal = zonal;
  }

  openDeleteModal(zonal: Zonal): void {
    this.modalMode = 'delete';
    this.selectedZonal = zonal;
  }

  closeModal(): void {
    this.modalMode = null;
    this.selectedZonal = null;
    this.clearErrors();
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    if (this.modalMode === 'create') this.createZonal();
    else if (this.modalMode === 'edit') this.updateZonal();
  }

  validateForm(): boolean {
    this.clearErrors();
    let valid = true;
    if (!this.formName.trim()) {
      this.nameError = 'Name is required.';
      valid = false;
    }
    if (!this.formCode.trim()) {
      this.codeError = 'Code is required.';
      valid = false;
    }
    return valid;
  }

  resetForm(): void {
    this.formName = '';
    this.formCode = '';
    this.formDescription = '';
    this.formIsActive = true;
    this.clearErrors();
  }

  clearErrors(): void {
    this.nameError = '';
    this.codeError = '';
  }

  // ─── Filters ─────────────────────────────────────────────────

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.zonals];
    if (this.filterStatus) {
      list = list.filter((z) =>
        this.filterStatus === 'active' ? z.isActive : !z.isActive,
      );
    }
    const q = this.searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (z) =>
          z.name?.toLowerCase().includes(q) ||
          z.code?.toLowerCase().includes(q) ||
          z.description?.toLowerCase().includes(q),
      );
    }
    this.filteredZonals = list;
    this.currentPage = 1;
  }

  // ─── Stats ───────────────────────────────────────────────────

  get totalActive(): number {
    return this.zonals.filter((z) => z.isActive).length;
  }

  get totalInactive(): number {
    return this.zonals.filter((z) => !z.isActive).length;
  }

  // ─── Export ──────────────────────────────────────────────────

  exportToPdf(): void {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();
        const now = new Date();

        doc.setFillColor(20, 184, 166); // teal-500
        doc.rect(0, 0, 210, 22, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Zonals Report', 14, 14);

        const dateStr = now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Exported: ${dateStr}`, 196, 14, { align: 'right' });

        const stats = [
          {
            label: 'Total',
            value: this.zonals.length,
            color: [20, 184, 166] as [number, number, number],
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

        const rows = this.filteredZonals.map((z, i) => [
          i + 1,
          z.name || '—',
          z.code || '—',
          z.description || '—',
          z.isActive ? 'Active' : 'Inactive',
        ]);

        autoTable(doc, {
          startY: 42,
          head: [['#', 'Name', 'Code', 'Description', 'Status']],
          body: rows,
          headStyles: {
            fillColor: [20, 184, 166],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
          },
          bodyStyles: { fontSize: 8.5, textColor: [40, 40, 40] },
          alternateRowStyles: { fillColor: [240, 253, 250] },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            4: { halign: 'center' },
          },
          didDrawCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 4) {
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
          didDrawPage: (data: any) => {
            const pageCount = (doc as any).internal.getNumberOfPages();
            const pageNum = (doc as any).internal.getCurrentPageInfo()
              .pageNumber;
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

        const fileName = `zonals_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;
        doc.save(fileName);
      });
    });
  }
}

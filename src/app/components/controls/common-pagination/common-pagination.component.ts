import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-common-pagination',
  standalone: false,
  templateUrl: './common-pagination.component.html',
  styleUrl: './common-pagination.component.css',
})
export class CommonPaginationComponent implements OnChanges {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalRecords: number = 0;

  @Output() pageChange = new EventEmitter<number>();

  pages: (number | '...')[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.buildPages();
  }

  buildPages(): void {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | '...')[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 3) pages.push('...');
      pages.push(total);
    }

    this.pages = pages;
  }

  goTo(page: number | '...'): void {
    if (page === '...' || page === this.currentPage) return;
    this.pageChange.emit(page as number);
  }

  prev(): void {
    if (this.currentPage > 1) this.pageChange.emit(this.currentPage - 1);
  }

  next(): void {
    if (this.currentPage < this.totalPages)
      this.pageChange.emit(this.currentPage + 1);
  }

  get startRecord(): number {
    return Math.min(
      (this.currentPage - 1) * this.pageSize + 1,
      this.totalRecords,
    );
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }

  isEllipsis(page: number | '...'): boolean {
    return page === '...';
  }
}

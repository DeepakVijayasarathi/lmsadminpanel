import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-delete-confirmation-modal',
  standalone: false,
  templateUrl: './delete-confirmation-modal.component.html',
  styleUrl: './delete-confirmation-modal.component.css',
})
export class DeleteConfirmationModalComponent {
  @Input() isVisible: boolean = false;
  @Input() itemName: string = '';
  @Input() isDeleting: boolean = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel();
    }
  }
}

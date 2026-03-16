import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-action-buttons',
  standalone: false,
  templateUrl: './action-buttons.component.html',
  styleUrl: './action-buttons.component.css',
})
export class ActionButtonsComponent {
  @Input() showView: boolean = true;
  @Input() showEdit: boolean = true;
  @Input() showDelete: boolean = true;

  @Output() view = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
}

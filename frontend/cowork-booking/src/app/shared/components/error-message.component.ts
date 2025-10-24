import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center py-8 px-4">
      <mat-icon class="text-red-500 text-6xl mb-4">error_outline</mat-icon>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">{{ title }}</h3>
      <p class="text-gray-600 text-center">{{ message }}</p>
    </div>
  `,
  styles: []
})
export class ErrorMessageComponent {
  @Input() title = 'Oops! Something went wrong';
  @Input() message = 'Please try again later.';
}

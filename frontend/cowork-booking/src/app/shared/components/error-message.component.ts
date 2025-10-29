import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-8 px-4">
      <div class="text-red-500 text-6xl mb-4">⚠️</div>
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

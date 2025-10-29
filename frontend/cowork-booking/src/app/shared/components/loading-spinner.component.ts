import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" [style.width.px]="diameter" [style.height.px]="diameter"></div>
    </div>
  `,
  styles: []
})
export class LoadingSpinnerComponent {
  @Input() diameter = 50;
}

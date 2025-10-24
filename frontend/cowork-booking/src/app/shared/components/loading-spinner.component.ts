import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="flex justify-center items-center py-8">
      <mat-spinner [diameter]="diameter"></mat-spinner>
    </div>
  `,
  styles: []
})
export class LoadingSpinnerComponent {
  @Input() diameter = 50;
}

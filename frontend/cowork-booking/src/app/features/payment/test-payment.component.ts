import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookingService } from '../../core/services/booking.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-test-payment',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatSnackBarModule, TranslateModule],
  templateUrl: './test-payment.component.html',
  styleUrls: ['./test-payment.component.scss']
})
export class TestPaymentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly bookingService = inject(BookingService);

  flow = signal<'booking' | 'workspace'>('booking');
  bookingId = signal<number | null>(null);
  workspaceId = signal<number | null>(null);
  methodId = signal<number | null>(null);
  amount = signal<number | null>(null);

  loading = signal(false);

  ngOnInit(): void {
    const flow = (this.route.snapshot.queryParamMap.get('flow') || 'booking').toLowerCase();
    this.flow.set(flow === 'workspace' ? 'workspace' : 'booking');

    const bookingId = Number(this.route.snapshot.queryParamMap.get('bookingId'));
    const workspaceId = Number(this.route.snapshot.queryParamMap.get('workspaceId'));
    const methodId = Number(this.route.snapshot.queryParamMap.get('methodId'));
    const amount = Number(this.route.snapshot.queryParamMap.get('amount'));

    this.bookingId.set(Number.isFinite(bookingId) && bookingId > 0 ? bookingId : null);
    this.workspaceId.set(Number.isFinite(workspaceId) && workspaceId > 0 ? workspaceId : null);
    this.methodId.set(Number.isFinite(methodId) && methodId > 0 ? methodId : 2);
    this.amount.set(Number.isFinite(amount) && amount > 0 ? amount : 1000);
  }

  completePayment(): void {
    if (this.flow() === 'booking') {
      this.completeBookingPayment();
      return;
    }

    this.snackBar.open('Test payment completed successfully.', 'Close', {
      duration: 2500,
      panelClass: ['success-snackbar']
    });
    this.router.navigate(['/owner/dashboard']);
  }

  private completeBookingPayment(): void {
    if (!this.bookingId() || !this.methodId()) {
      this.snackBar.open('Missing booking payment information.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.loading.set(true);
    this.bookingService.processPayment(this.bookingId()!, this.methodId()!).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open('Payment processed successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/my-bookings']);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Payment failed', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  cancel(): void {
    if (this.flow() === 'workspace') {
      this.router.navigate(['/owner/dashboard']);
      return;
    }
    this.router.navigate(['/my-bookings']);
  }
}

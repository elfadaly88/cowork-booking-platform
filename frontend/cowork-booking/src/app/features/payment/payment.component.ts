import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../core/services/booking.service';
import { PaymentMethod } from '../../core/models/booking.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatSnackBarModule,
    FormsModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    TranslateModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  bookingId: number | null = null;
  paymentMethods: PaymentMethod[] = [];
  selectedMethodId: number | null = null;

  loading = true;
  submitting = false;
  error: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('bookingId');
    if (id) {
      this.bookingId = +id;
      this.loadPaymentMethods();
    } else {
      this.error = 'No booking information available';
      this.loading = false;
    }
  }

  loadPaymentMethods(): void {
    this.bookingService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
        if (methods.length > 0) {
            this.selectedMethodId = methods[0].id;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Unable to fetch payment methods';
        this.loading = false;
      }
    });
  }

  onConfirmPayment(): void {
    if (!this.bookingId || !this.selectedMethodId) return;

    const selectedMethod = this.paymentMethods.find(m => m.id === this.selectedMethodId);
    const isCreditCardPayment = selectedMethod?.name?.toLowerCase() === 'credit card';

    if (isCreditCardPayment) {
      this.router.navigate(['/payment/test'], {
        queryParams: {
          flow: 'booking',
          bookingId: this.bookingId,
          methodId: this.selectedMethodId
        }
      });
      return;
    }

    this.submitting = true;
    const isCashPayment = selectedMethod?.name?.toLowerCase() === 'cash';

    this.bookingService.processPayment(this.bookingId, this.selectedMethodId).subscribe({
      next: () => {
        this.submitting = false;
        const successMessage = isCashPayment
          ? 'Reservation submitted. Waiting owner approval for cash payment.'
          : 'Payment processed successfully!';

        this.snackBar.open(successMessage, 'Close', { duration: 3500, panelClass: ['success-snackbar'] });
        this.router.navigate(['/my-bookings']);
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open('Payment failed', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }
}

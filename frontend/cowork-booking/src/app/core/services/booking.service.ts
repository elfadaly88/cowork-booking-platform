import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingRequest, BookingResponse, CancelBookingRequest, PaymentMethod } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/bookings`;

  /** POST /bookings → create a new booking */
  createBooking(booking: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.baseUrl, booking).pipe(
      catchError(err => {
        const message = err?.error?.message || 'Failed to create booking. The room may already be fully booked.';
        return throwError(() => new Error(message));
      })
    );
  }

  /** GET /bookings/my-bookings → current user's booking history */
  getMyBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/my-bookings`).pipe(
      catchError(err => {
        const message = err?.error?.message || 'Failed to load your bookings';
        return throwError(() => new Error(message));
      })
    );
  }

  /** GET /bookings/:id → single booking details */
  getBookingById(id: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError(err => throwError(() => new Error(err?.error?.message || 'Booking not found')))
    );
  }

  /** PATCH /bookings/:id/cancel → cancel a booking */
  cancelBooking(id: number, reason?: string): Observable<{ message: string }> {
    const body: CancelBookingRequest = { cancellationReason: reason };
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}/cancel`, body).pipe(
      catchError(err => {
        const message = err?.error?.message || 'Failed to cancel booking';
        return throwError(() => new Error(message));
      })
    );
  }

  /** GET /bookings (Admin only) */
  getAllBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(this.baseUrl).pipe(
      catchError(err => throwError(() => new Error(err?.error?.message || 'Failed to load bookings')))
    );
  }

  /** GET /paymentmethods */
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${environment.apiBaseUrl}/paymentmethods`).pipe(
      catchError(err => throwError(() => new Error('Failed to load payment methods')))
    );
  }

  /** POST /bookings/:id/pay */
  processPayment(bookingId: number, paymentMethodId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${bookingId}/pay`, { paymentMethodId }).pipe(
      catchError(err => throwError(() => new Error(err?.error?.message || 'Payment processing failed')))
    );
  }
}


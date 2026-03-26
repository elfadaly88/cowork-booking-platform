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

  /** GET /bookings/workspace-bookings (Owner only) — all bookings for the owner's workspaces */
  getWorkspaceBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/workspace-bookings`).pipe(
      catchError(err => {
        const status = err?.status;
        const message = err?.error?.message
          || (status === 401 || status === 403
            ? 'Authorization failed while loading workspace bookings. Please sign in again.'
            : 'Failed to load workspace bookings');
        return throwError(() => new Error(message));
      })
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

  /** POST /bookings/:id/approve-cash */
  approveCashBooking(bookingId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${bookingId}/approve-cash`, {}).pipe(
      catchError(err => throwError(() => new Error(err?.error?.message || 'Failed to approve cash reservation')))
    );
  }

  /** POST /bookings/:id/reject */
  rejectBooking(bookingId: number, reason?: string): Observable<{ message: string }> {
    const body = reason ? { reason } : {};
    return this.http.post<{ message: string }>(`${this.baseUrl}/${bookingId}/reject`, body).pipe(
      catchError(err => throwError(() => new Error(err?.error?.message || 'Failed to reject reservation')))
    );
  }

  /** GET /bookings/check-availability — returns { available, message } */
  checkAvailability(
    roomId: number,
    startTime: string,
    endTime: string
  ): Observable<{ available: boolean; message: string }> {
    const params = { roomId: roomId.toString(), startTime, endTime };
    return this.http
      .get<{ available: boolean; message: string }>(`${this.baseUrl}/check-availability`, { params })
      .pipe(
        catchError(err =>
          throwError(() => new Error(err?.error?.message || 'Failed to check availability'))
        )
      );
  }
}


import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingRequest, BookingResponse } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * POST /bookings → create a new booking
   */
  createBooking(booking: BookingRequest): Observable<BookingResponse> {
    const url = `${this.baseUrl}/bookings`;
    return this.http.post<BookingResponse>(url, booking).pipe(
      catchError((err) => {
        const message = err?.error?.message || 'Failed to create booking';
        return throwError(() => new Error(message));
      })
    );
  }
}

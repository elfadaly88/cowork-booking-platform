import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingResponse, BookingStatus } from '../../core/models/booking.model';

@Component({
    selector: 'app-my-bookings',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './my-bookings.component.html',
    styleUrls: ['./my-bookings.component.scss']
})
export class MyBookingsComponent implements OnInit {
    private readonly bookingService = inject(BookingService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    bookings = signal<BookingResponse[]>([]);
    loading = signal(true);
    error = signal<string | null>(null);
    cancellingId = signal<number | null>(null);
    filterStatus = signal<string>('all');

    // Cancellation dialog
    showCancelDialog = signal(false);
    selectedBookingId = signal<number | null>(null);
    cancelReason = '';
    successMessage = signal<string | null>(null);

    // Computed: filtered bookings based on selected status tab
    filteredBookings = computed(() => {
        const status = this.filterStatus();
        const all = this.bookings();
        if (status === 'all') return all;
        return all.filter(b => b.status.toLowerCase() === status.toLowerCase());
    });

    // Computed: stats
    totalBookings = computed(() => this.bookings().length);
    confirmedCount = computed(() => this.bookings().filter(b => b.status === 'Confirmed').length);
    cancelledCount = computed(() => this.bookings().filter(b => b.status === 'Cancelled').length);
    completedCount = computed(() => this.bookings().filter(b => b.status === 'Completed').length);
    totalSpent = computed(() =>
        this.bookings()
            .filter(b => b.status !== 'Cancelled')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    );

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }
        this.loadBookings();
    }

    loadBookings(): void {
        this.loading.set(true);
        this.error.set(null);

        this.bookingService.getMyBookings().subscribe({
            next: (data) => {
                this.bookings.set(data || []);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.message || 'Unable to load bookings');
                this.loading.set(false);
            }
        });
    }

    // ─── Cancel flow ────────────────────────────────────────────────────────────

    openCancelDialog(bookingId: number): void {
        this.selectedBookingId.set(bookingId);
        this.cancelReason = '';
        this.showCancelDialog.set(true);
    }

    closeCancelDialog(): void {
        this.showCancelDialog.set(false);
        this.selectedBookingId.set(null);
        this.cancelReason = '';
    }

    confirmCancel(): void {
        const id = this.selectedBookingId();
        if (!id) return;

        this.cancellingId.set(id);
        this.closeCancelDialog();

        this.bookingService.cancelBooking(id, this.cancelReason || undefined).subscribe({
            next: () => {
                // Update the booking status in-place (no full reload)
                this.bookings.update(list =>
                    list.map(b => b.id === id ? { ...b, status: 'Cancelled' as BookingStatus } : b)
                );
                this.cancellingId.set(null);
                this.successMessage.set('Booking cancelled successfully.');
                setTimeout(() => this.successMessage.set(null), 4000);
            },
            error: (err) => {
                this.error.set(err.message);
                this.cancellingId.set(null);
            }
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    canCancel(booking: BookingResponse): boolean {
        if (booking.status === 'Cancelled' || booking.status === 'Completed') return false;
        // Only allow cancellation if the booking is in the future
        return new Date(booking.startTime) > new Date();
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Confirmed': return 'status-confirmed';
            case 'Cancelled': return 'status-cancelled';
            case 'Completed': return 'status-completed';
            default: return 'status-pending';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'Confirmed': return '✅';
            case 'Cancelled': return '❌';
            case 'Completed': return '🏁';
            default: return '⏳';
        }
    }

    getDurationHours(start: string, end: string): number {
        const ms = new Date(end).getTime() - new Date(start).getTime();
        return Math.round((ms / 3600000) * 10) / 10;
    }

    isUpcoming(booking: BookingResponse): boolean {
        return new Date(booking.startTime) > new Date() && booking.status === 'Confirmed';
    }

    isPast(booking: BookingResponse): boolean {
        return new Date(booking.endTime) < new Date();
    }

    viewWorkspace(workspaceId: number): void {
        this.router.navigate(['/workspace', workspaceId]);
    }

    rebookRoom(booking: BookingResponse): void {
        this.router.navigate(['/booking', booking.roomId]);
    }
}

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WorkspaceService } from '../../core/services/workspace.service';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { Workspace } from '../../core/models/workspace.model';
import { BookingResponse } from '../../core/models/booking.model';
import { Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent implements OnInit, OnDestroy {
  workspaces = signal<Workspace[]>([]);
  bookings = signal<BookingResponse[]>([]);
  loading = signal(false);
  bookingsLoading = signal(false);
  errorMessage = signal('');
  bookingsError = signal('');
  activeTab = signal<'workspaces' | 'reservations'>('workspaces');
  unreadNotifications = signal(0);
  latestNotification = signal('');

  private pollingSub?: Subscription;
  private knownBookingIds = new Set<number>();

  // ─── Computed stats ───────────────────────────────────────────────────
  totalRooms = computed(() => this.workspaces().reduce((s, w) => s + (w.rooms?.length ?? 0), 0));
  totalCapacity = computed(() => this.workspaces().reduce((s, w) =>
    s + (w.rooms?.reduce((rs, r) => rs + r.capacity, 0) ?? 0), 0));
  activeBookings = computed(() =>
    this.bookings().filter(b => b.status === 'Confirmed' || b.status === 'Pending').length);
  sortedBookings = computed(() =>
    [...this.bookings()].sort((a, b) => {
      const d1 = new Date(a.createdAt).getTime();
      const d2 = new Date(b.createdAt).getTime();
      if (d1 !== d2) return d2 - d1;
      return b.id - a.id;
    }));

  constructor(
    private workspaceService: WorkspaceService,
    private bookingService: BookingService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyWorkspaces();
    this.loadReservations();
    this.startReservationPolling();
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  loadMyWorkspaces(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.workspaceService.getMyWorkspaces().subscribe({
      next: (workspaces) => { this.workspaces.set(workspaces); this.loading.set(false); },
      error: (error) => { this.errorMessage.set(error.message || 'Failed to load your workspaces'); this.loading.set(false); }
    });
  }

  loadReservations(showNotification = false): void {
    this.bookingsLoading.set(true);
    this.bookingsError.set('');
    this.bookingService.getWorkspaceBookings().subscribe({
      next: (bookings) => {
        const sorted = [...(bookings ?? [])].sort((a, b) => {
          const d1 = new Date(a.createdAt).getTime();
          const d2 = new Date(b.createdAt).getTime();
          if (d1 !== d2) return d2 - d1;
          return b.id - a.id;
        });

        if (showNotification) {
          const incoming = sorted.filter(b => !this.knownBookingIds.has(b.id));
          if (incoming.length > 0) {
            this.unreadNotifications.update(v => v + incoming.length);
            this.latestNotification.set(`${incoming.length} new reservation${incoming.length > 1 ? 's' : ''} received`);
            Swal.fire({
              toast: true,
              position: 'top-end',
              timer: 3500,
              showConfirmButton: false,
              icon: 'info',
              title: this.latestNotification()
            });
          }
        }

        this.knownBookingIds = new Set(sorted.map(b => b.id));
        this.bookings.set(sorted);
        this.bookingsLoading.set(false);
      },
      error: (err) => { this.bookingsError.set(err.message || 'Failed to load reservations'); this.bookingsLoading.set(false); }
    });
  }

  startReservationPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = interval(20000).subscribe(() => {
      this.refreshReservationsSilently();
    });
  }

  refreshReservationsSilently(): void {
    this.bookingService.getWorkspaceBookings().subscribe({
      next: (bookings) => {
        const sorted = [...(bookings ?? [])].sort((a, b) => {
          const d1 = new Date(a.createdAt).getTime();
          const d2 = new Date(b.createdAt).getTime();
          if (d1 !== d2) return d2 - d1;
          return b.id - a.id;
        });

        const incoming = sorted.filter(b => !this.knownBookingIds.has(b.id));
        if (incoming.length > 0) {
          this.unreadNotifications.update(v => v + incoming.length);
          this.latestNotification.set(`${incoming.length} new reservation${incoming.length > 1 ? 's' : ''} received`);
          Swal.fire({
            toast: true,
            position: 'top-end',
            timer: 3500,
            showConfirmButton: false,
            icon: 'info',
            title: this.latestNotification()
          });
        }

        this.knownBookingIds = new Set(sorted.map(b => b.id));
        this.bookings.set(sorted);
      },
      error: () => { }
    });
  }

  clearNotifications(): void {
    this.unreadNotifications.set(0);
    this.latestNotification.set('');
  }

  switchTab(tab: 'workspaces' | 'reservations'): void {
    this.activeTab.set(tab);
    if (tab === 'reservations') {
      this.clearNotifications();
    }
  }

  addNewWorkspace(): void { this.router.navigate(['/owner/workspace/new']); }
  editWorkspace(workspaceId: number): void { this.router.navigate(['/owner/workspace/edit', workspaceId]); }
  viewWorkspace(workspaceId: number): void { this.router.navigate(['/workspace', workspaceId]); }

  getTotalRooms(workspace: Workspace): number { return workspace.rooms?.length || 0; }
  getTotalCapacity(workspace: Workspace): number {
    return workspace.rooms?.reduce((sum, room) => sum + room.capacity, 0) || 0;
  }
  getMinPrice(workspace: Workspace): number | null {
    const prices = workspace.rooms?.map(r => r.pricePerHour) ?? [];
    return prices.length ? Math.min(...prices) : null;
  }
  getApprovalStatus(workspace: Workspace): string {
    return workspace.isApproved ? 'Approved' : 'Pending Approval';
  }
  getApprovalClass(workspace: Workspace): string {
    return workspace.isApproved ? 'status-approved' : 'status-pending';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Confirmed: 'status-confirmed',
      Pending: 'status-pending-b',
      Cancelled: 'status-cancelled',
      Completed: 'status-completed'
    };
    return map[status] ?? '';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      Confirmed: '✓', Pending: '⏳', Cancelled: '✕', Completed: '★'
    };
    return map[status] ?? '•';
  }

  getPaymentStatusClass(status?: string): string {
    const map: Record<string, string> = {
      Paid: 'payment-paid',
      Pending: 'payment-pending',
      Failed: 'payment-failed'
    };
    return map[status ?? ''] ?? 'payment-pending';
  }

  canApproveCash(booking: BookingResponse): boolean {
    const methodName = (booking.paymentMethodName || '').toLowerCase();
    return booking.status === 'Pending' && methodName === 'cash';
  }

  approveCashBooking(booking: BookingResponse): void {
    if (!this.canApproveCash(booking)) return;

    this.bookingService.approveCashBooking(booking.id).subscribe({
      next: (res) => {
        this.bookings.update(list =>
          list.map(b => b.id === booking.id ? { ...b, status: 'Confirmed' } : b)
        );

        Swal.fire({
          icon: 'success',
          title: 'Cash Reservation Approved',
          text: res.message || 'Reservation approved and user notified.',
          timer: 2500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Approval Failed',
          text: err.message || 'Unable to approve reservation right now.'
        });
      }
    });
  }

  rejectBooking(booking: BookingResponse): void {
    if (booking.status !== 'Pending') return;

    Swal.fire({
      icon: 'warning',
      title: 'Reject Reservation?',
      text: `Are you sure you want to reject the reservation from ${booking.userFullName || 'guest'}? They will be notified.`,
      input: 'textarea',
      inputPlaceholder: 'Optional: Enter reason for rejection',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      inputAttributes: {
        maxlength: '250'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const reason = result.value || undefined;
        this.bookingService.rejectBooking(booking.id, reason).subscribe({
          next: (res) => {
            this.bookings.update(list =>
              list.map(b => b.id === booking.id ? { ...b, status: 'Cancelled' } : b)
            );

            Swal.fire({
              icon: 'success',
              title: 'Reservation Rejected',
              text: res.message || 'Reservation rejected and user notified.',
              timer: 2500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Rejection Failed',
              text: err.message || 'Unable to reject reservation right now.'
            });
          }
        });
      }
    });
  }
}

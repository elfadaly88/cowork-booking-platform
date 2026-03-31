import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { BookingResponse } from '../../core/models/booking.model';
import { Workspace } from '../../core/models/workspace.model';

interface RevenuePoint {
  label: string;
  value: number;
  pct: number;
}

interface CityPoint {
  city: string;
  count: number;
}

interface SalesOpportunity {
  title: string;
  detail: string;
  action: string;
}

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DecimalPipe, TranslateModule],
  templateUrl: './business-dashboard.component.html',
  styleUrls: ['./business-dashboard.component.scss']
})
export class BusinessDashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  loadingError = signal('');

  bookings = signal<BookingResponse[]>([]);
  workspaces = signal<Workspace[]>([]);
  pendingWorkspaces = signal<Workspace[]>([]);

  userName = computed(() => this.auth.currentUser()?.firstName ?? 'Partner');
  roleLabel = computed(() => this.auth.isAdmin()
    ? this.translate.instant('BUSINESS.PLATFORM_VIEW')
    : this.translate.instant('BUSINESS.OWNER_VIEW'));

  thisMonthRevenue = computed(() => {
    const now = new Date();
    return this.bookings()
      .filter(b => {
        const d = new Date(b.createdAt);
        return d.getFullYear() === now.getFullYear()
          && d.getMonth() === now.getMonth()
          && (b.paymentStatus === 'Paid' || b.status === 'Confirmed' || b.status === 'Completed');
      })
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  });

  occupancyRate = computed(() => {
    const totalRooms = this.workspaces().reduce((sum, w) => sum + (w.rooms?.length ?? 0), 0);
    if (totalRooms === 0) return 0;

    const active = this.bookings().filter(b => b.status === 'Confirmed' || b.status === 'Completed').length;
    const roughCapacity = totalRooms * 12;
    return Math.min(100, Math.round((active / Math.max(1, roughCapacity)) * 100));
  });

  conversionRate = computed(() => {
    const total = this.bookings().length;
    if (total === 0) return 0;
    const paid = this.bookings().filter(b => b.paymentStatus === 'Paid').length;
    return Math.round((paid / total) * 100);
  });

  activeLeads = computed(() => this.bookings().filter(b => b.status === 'Pending').length);

  trendPoints = computed<RevenuePoint[]>(() => {
    const now = new Date();
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const values = [0, 0, 0, 0];

    for (const booking of this.bookings()) {
      const d = new Date(booking.createdAt);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
        continue;
      }
      const week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
      values[week] += booking.totalPrice || 0;
    }

    const max = Math.max(...values, 1);
    return labels.map((label, i) => ({ label, value: values[i], pct: Math.max(6, Math.round((values[i] / max) * 100)) }));
  });

  cityPoints = computed<CityPoint[]>(() => {
    const map = new Map<string, number>();
    for (const ws of this.workspaces()) {
      const city = ws.city || 'Unknown';
      map.set(city, (map.get(city) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  opportunities = computed<SalesOpportunity[]>(() => {
    const list: SalesOpportunity[] = [];

    if (this.pendingWorkspaces().length > 0) {
      list.push({
        title: this.translate.instant('BUSINESS.OPP_PENDING_TITLE'),
        detail: this.translate.instant('BUSINESS.OPP_PENDING_DETAIL', { count: this.pendingWorkspaces().length }),
        action: this.translate.instant('BUSINESS.OPP_PENDING_ACTION')
      });
    }

    if (this.activeLeads() > 0) {
      list.push({
        title: this.translate.instant('BUSINESS.OPP_LEADS_TITLE'),
        detail: this.translate.instant('BUSINESS.OPP_LEADS_DETAIL', { count: this.activeLeads() }),
        action: this.translate.instant('BUSINESS.OPP_LEADS_ACTION')
      });
    }

    if (this.conversionRate() < 60) {
      list.push({
        title: this.translate.instant('BUSINESS.OPP_CONVERSION_TITLE'),
        detail: this.translate.instant('BUSINESS.OPP_CONVERSION_DETAIL', { rate: this.conversionRate() }),
        action: this.translate.instant('BUSINESS.OPP_CONVERSION_ACTION')
      });
    }

    if (list.length === 0) {
      list.push({
        title: this.translate.instant('BUSINESS.OPP_HEALTHY_TITLE'),
        detail: this.translate.instant('BUSINESS.OPP_HEALTHY_DETAIL'),
        action: this.translate.instant('BUSINESS.OPP_HEALTHY_ACTION')
      });
    }

    return list;
  });

  constructor() {
    this.loadDashboardData();
  }

  refresh(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.loadingError.set('');

    const bookings$ = this.auth.isAdmin() ? this.bookingService.getAllBookings() : this.bookingService.getWorkspaceBookings();
    const workspaces$ = this.auth.isAdmin() ? this.workspaceService.getWorkspaces() : this.workspaceService.getMyWorkspaces();

    const requests = this.auth.isAdmin()
      ? {
          bookings: bookings$,
          workspaces: workspaces$,
          pending: this.workspaceService.getPendingWorkspaces()
        }
      : {
          bookings: bookings$,
          workspaces: workspaces$,
          pending: this.workspaceService.getMyWorkspaces()
        };

    forkJoin(requests).subscribe({
      next: ({ bookings, workspaces, pending }) => {
        this.bookings.set(bookings ?? []);
        this.workspaces.set(workspaces ?? []);
        this.pendingWorkspaces.set(this.auth.isAdmin() ? pending ?? [] : (pending ?? []).filter(w => !w.isApproved));
        this.loading.set(false);
      },
      error: (err) => {
        this.loadingError.set(err?.message || 'Unable to load dashboard insights right now.');
        this.loading.set(false);
      }
    });
  }
}

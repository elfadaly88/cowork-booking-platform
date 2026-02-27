import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../core/services/workspace.service';
import { AuthService } from '../../core/services/auth.service';
import { Workspace } from '../../core/models/workspace.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private readonly workspaceService = inject(WorkspaceService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  allWorkspaces = signal<Workspace[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ─── Search & Filter State ────────────────────────────────────────────
  searchQuery = signal('');
  selectedCity = signal('');
  selectedMaxPrice = signal<number | null>(null);
  selectedMinCapacity = signal<number | null>(null);
  sortBy = signal<'name' | 'price' | 'rating' | 'rooms'>('name');
  viewMode = signal<'grid' | 'list'>('grid');

  // ─── Derived lists ────────────────────────────────────────────────────
  cities = computed(() => {
    const unique = [...new Set(this.allWorkspaces().map(w => w.city).filter(Boolean))];
    return unique.sort();
  });

  filteredWorkspaces = computed(() => {
    let list = [...this.allWorkspaces()];
    const q = this.searchQuery().toLowerCase().trim();
    const city = this.selectedCity();
    const maxPrice = this.selectedMaxPrice();
    const minCap = this.selectedMinCapacity();

    if (q) {
      list = list.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        w.city?.toLowerCase().includes(q) ||
        w.address?.toLowerCase().includes(q)
      );
    }
    if (city) list = list.filter(w => w.city === city);
    if (maxPrice !== null) {
      list = list.filter(w =>
        !w.rooms?.length || w.rooms.some(r => r.pricePerHour <= maxPrice)
      );
    }
    if (minCap !== null) {
      list = list.filter(w =>
        w.rooms?.some(r => r.capacity >= minCap!)
      );
    }

    // Sort
    const sort = this.sortBy();
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'rating') return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      if (sort === 'rooms') return (b.rooms?.length ?? 0) - (a.rooms?.length ?? 0);
      if (sort === 'price') {
        const aMin = Math.min(...(a.rooms?.map(r => r.pricePerHour) ?? [Infinity]));
        const bMin = Math.min(...(b.rooms?.map(r => r.pricePerHour) ?? [Infinity]));
        return aMin - bMin;
      }
      return 0;
    });
    return list;
  });

  hasActiveFilters = computed(() =>
    !!this.searchQuery() || !!this.selectedCity() ||
    this.selectedMaxPrice() !== null || this.selectedMinCapacity() !== null
  );

  currentUser = this.authService.currentUser;

  ngOnInit(): void {
    if (this.authService.isAdmin()) { this.router.navigate(['/admin']); return; }
    if (this.authService.isOwner()) { this.router.navigate(['/owner/dashboard']); return; }
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    this.loading.set(true);
    this.error.set(null);
    this.workspaceService.getAvailableWorkspaces().subscribe({
      next: (data) => { this.allWorkspaces.set(data ?? []); this.loading.set(false); },
      error: (err) => {
        this.error.set('Unable to connect to backend. Please ensure the API server is running.');
        this.loading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCity.set('');
    this.selectedMaxPrice.set(null);
    this.selectedMinCapacity.set(null);
    this.sortBy.set('name');
  }

  getMinPrice(workspace: Workspace): number | null {
    if (!workspace.rooms?.length) return null;
    return Math.min(...workspace.rooms.map(r => r.pricePerHour));
  }

  getTotalSeats(workspace: Workspace): number {
    return workspace.rooms?.reduce((sum, r) => sum + r.capacity, 0) ?? 0;
  }

  viewWorkspace(id: number): void { this.router.navigate(['/workspace', id]); }
  goToMyBookings(): void { this.router.navigate(['/my-bookings']); }
  goToProfile(): void { this.router.navigate(['/profile']); }

  logout(): void { this.authService.logout(); }
}

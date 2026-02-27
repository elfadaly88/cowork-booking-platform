import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkspaceService, WorkspaceReview } from '../../core/services/workspace.service';
import { AuthService } from '../../core/services/auth.service';
import { Workspace, Room, WorkspaceImage, WorkspaceSchedulePeriod } from '../../core/models/workspace.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message.component';

@Component({
  selector: 'app-workspace-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent
  ],
  templateUrl: './workspace-details.component.html',
  styleUrls: ['./workspace-details.component.scss']
})
export class WorkspaceDetailsComponent implements OnInit {
  private readonly workspaceService = inject(WorkspaceService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  workspace: Workspace | null = null;
  schedulePeriod: WorkspaceSchedulePeriod | null = null;
  loading = false;
  error: string | null = null;

  // ─── Images ─────────────────────────────────────────────────────────────────
  images = signal<WorkspaceImage[]>([]);
  activeImageIndex = signal(0);

  // ─── Reviews ─────────────────────────────────────────────────────────────────
  reviews = signal<WorkspaceReview[]>([]);
  myReview = signal<WorkspaceReview | null>(null);
  reviewsLoading = signal(false);
  showReviewForm = signal(false);

  // Review form
  myRating = 5;
  myComment = '';
  submittingReview = signal(false);
  reviewError = signal<string | null>(null);
  reviewSuccess = signal<string | null>(null);

  isAuthenticated = this.authService.isAuthenticated;

  readonly dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWorkspace(+id);
      this.loadSchedule(+id);
      this.loadImages(+id);
      this.loadReviews(+id);
      if (this.authService.isAuthenticated()) {
        this.loadMyReview(+id);
      }
    }
  }

  loadWorkspace(id: number): void {
    this.loading = true;
    this.error = null;

    this.workspaceService.getWorkspaceById(id).subscribe({
      next: (data) => {
        this.workspace = data;
        this.loading = false;
      },
      error: (err) => {
        console.warn('Backend API not available for workspace details:', err);
        this.error = 'Unable to connect to backend. Please ensure the API server is running.';
        this.workspace = null;
        this.loading = false;
      }
    });
  }

  loadSchedule(id: number): void {
    this.workspaceService.getActiveSchedule(id).subscribe({
      next: (data) => { this.schedulePeriod = data; },
      error: () => { this.schedulePeriod = null; }
    });
  }

  // ─── Images ──────────────────────────────────────────────────────────────────

  loadImages(id: number): void {
    this.workspaceService.getImages(id).subscribe({
      next: (imgs) => this.images.set(imgs ?? []),
      error: () => this.images.set([])
    });
  }

  setActiveImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  nextImage(): void {
    const imgs = this.images();
    if (imgs.length > 1) {
      this.activeImageIndex.set((this.activeImageIndex() + 1) % imgs.length);
    }
  }

  prevImage(): void {
    const imgs = this.images();
    if (imgs.length > 1) {
      const idx = this.activeImageIndex();
      this.activeImageIndex.set(idx === 0 ? imgs.length - 1 : idx - 1);
    }
  }

  // ─── Reviews ─────────────────────────────────────────────────────────────────

  loadReviews(id: number): void {
    this.reviewsLoading.set(true);
    this.workspaceService.getReviews(id).subscribe({
      next: (data) => { this.reviews.set(data ?? []); this.reviewsLoading.set(false); },
      error: () => { this.reviews.set([]); this.reviewsLoading.set(false); }
    });
  }

  loadMyReview(id: number): void {
    this.workspaceService.getMyReview(id).subscribe({
      next: (r) => {
        this.myReview.set(r);
        if (r) {
          this.myRating = r.rating;
          this.myComment = r.comment ?? '';
        }
      },
      error: () => this.myReview.set(null)
    });
  }

  openReviewForm(): void {
    this.showReviewForm.set(true);
    this.reviewError.set(null);
    this.reviewSuccess.set(null);
  }

  cancelReviewForm(): void {
    this.showReviewForm.set(false);
    this.reviewError.set(null);
    const existing = this.myReview();
    if (existing) {
      this.myRating = existing.rating;
      this.myComment = existing.comment ?? '';
    } else {
      this.myRating = 5;
      this.myComment = '';
    }
  }

  submitReview(): void {
    const id = this.workspace?.id;
    if (!id) return;
    this.submittingReview.set(true);
    this.reviewError.set(null);

    this.workspaceService.submitReview(id, this.myRating, this.myComment).subscribe({
      next: (res) => {
        this.submittingReview.set(false);
        this.showReviewForm.set(false);
        this.reviewSuccess.set(res?.message ?? 'Review submitted!');
        // Reload all reviews & my review
        this.loadReviews(id);
        this.loadMyReview(id);
        setTimeout(() => this.reviewSuccess.set(null), 4000);
      },
      error: (err) => {
        this.submittingReview.set(false);
        this.reviewError.set(err?.message ?? 'Failed to submit review.');
      }
    });
  }

  deleteMyReview(): void {
    const id = this.workspace?.id;
    if (!id) return;
    this.workspaceService.deleteMyReview(id).subscribe({
      next: () => {
        this.myReview.set(null);
        this.myRating = 5;
        this.myComment = '';
        this.reviewSuccess.set('Review deleted.');
        this.loadReviews(id);
        setTimeout(() => this.reviewSuccess.set(null), 3000);
      },
      error: () => { }
    });
  }

  getAverageRating(): number {
    const r = this.reviews();
    if (!r.length) return 0;
    return r.reduce((sum, rv) => sum + rv.rating, 0) / r.length;
  }

  getStarArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= Math.round(rating));
  }

  // ─── Schedule ─────────────────────────────────────────────────────────────────

  getDaySchedule(dayOfWeek: number) {
    return this.schedulePeriod?.schedules.find(s => s.dayOfWeek === dayOfWeek);
  }

  // ─── Rooms ────────────────────────────────────────────────────────────────────

  bookRoom(room: Room): void {
    this.router.navigate(['/booking', room.id], {
      state: {
        room: room,
        workspace: this.workspace
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/workspaces']);
  }
}

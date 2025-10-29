import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace, Room, WorkspaceSchedulePeriod } from '../../core/models/workspace.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message.component';

@Component({
  selector: 'app-workspace-details',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent
  ],
  templateUrl: './workspace-details.component.html',
  styleUrls: ['./workspace-details.component.scss']
})
export class WorkspaceDetailsComponent implements OnInit {
  private readonly workspaceService = inject(WorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  workspace: Workspace | null = null;
  schedulePeriod: WorkspaceSchedulePeriod | null = null;
  loading = false;
  error: string | null = null;

  readonly dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWorkspace(+id);
      this.loadSchedule(+id);
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
      next: (data) => {
        this.schedulePeriod = data;
      },
      error: (err) => {
        console.warn('Backend API not available for schedule:', err);
        // Schedule is optional, so don't set error for this
        this.schedulePeriod = null;
      }
    });
  }

  getDaySchedule(dayOfWeek: number) {
    return this.schedulePeriod?.schedules.find(s => s.dayOfWeek === dayOfWeek);
  }

  bookRoom(room: Room): void {
    this.router.navigate(['/booking', room.id], {
      state: {
        room: room,
        workspace: this.workspace
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}


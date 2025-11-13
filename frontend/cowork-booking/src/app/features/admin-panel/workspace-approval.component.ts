import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace } from '../../core/models/workspace.model';

@Component({
  selector: 'app-workspace-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-approval.component.html',
  styleUrls: ['./workspace-approval.component.scss']
})
export class WorkspaceApprovalComponent implements OnInit {
  pendingWorkspaces = signal<Workspace[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private workspaceService: WorkspaceService) {}

  ngOnInit(): void {
    this.loadPendingWorkspaces();
  }

  loadPendingWorkspaces(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.workspaceService.getPendingWorkspaces().subscribe({
      next: (workspaces) => {
        this.pendingWorkspaces.set(workspaces);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Failed to load pending workspaces');
        this.loading.set(false);
      }
    });
  }

  approveWorkspace(workspaceId: number): void {
    if (!confirm('Are you sure you want to approve this workspace?')) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.workspaceService.approveWorkspace(workspaceId).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Workspace approved successfully');
        // Remove the approved workspace from the list
        this.pendingWorkspaces.update(workspaces =>
          workspaces.filter(w => w.id !== workspaceId)
        );
        this.loading.set(false);

        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Failed to approve workspace');
        this.loading.set(false);
      }
    });
  }

  rejectWorkspace(workspaceId: number): void {
    if (!confirm('Are you sure you want to reject this workspace? This will delete it permanently.')) {
      return;
    }

    // For now, just remove from UI - you can implement a delete endpoint later
    this.pendingWorkspaces.update(workspaces =>
      workspaces.filter(w => w.id !== workspaceId)
    );
    this.successMessage.set('Workspace rejected');
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  getTotalRooms(workspace: Workspace): number {
    return workspace.rooms?.length || 0;
  }

  getTotalCapacity(workspace: Workspace): number {
    return workspace.rooms?.reduce((sum, room) => sum + room.capacity, 0) || 0;
  }
}

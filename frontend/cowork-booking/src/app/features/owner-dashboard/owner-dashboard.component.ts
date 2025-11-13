import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WorkspaceService } from '../../core/services/workspace.service';
import { AuthService } from '../../core/services/auth.service';
import { Workspace } from '../../core/models/workspace.model';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent implements OnInit {
  workspaces = signal<Workspace[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private workspaceService: WorkspaceService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyWorkspaces();
  }

  loadMyWorkspaces(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.workspaceService.getMyWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces.set(workspaces);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Failed to load your workspaces');
        this.loading.set(false);
      }
    });
  }

  addNewWorkspace(): void {
    this.router.navigate(['/owner/workspace/new']);
  }

  editWorkspace(workspaceId: number): void {
    this.router.navigate(['/owner/workspace/edit', workspaceId]);
  }

  viewWorkspace(workspaceId: number): void {
    this.router.navigate(['/workspace', workspaceId]);
  }

  getTotalRooms(workspace: Workspace): number {
    return workspace.rooms?.length || 0;
  }

  getTotalCapacity(workspace: Workspace): number {
    return workspace.rooms?.reduce((sum, room) => sum + room.capacity, 0) || 0;
  }

  getApprovalStatus(workspace: Workspace): string {
    return workspace.isApproved ? '✅ Approved' : '⏳ Pending Approval';
  }

  getApprovalClass(workspace: Workspace): string {
    return workspace.isApproved ? 'status-approved' : 'status-pending';
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace } from '../../core/models/workspace.model';
import Swal from 'sweetalert2';

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
    const workspace = this.pendingWorkspaces().find(w => w.id === workspaceId);
    if (workspace?.approvalPaymentStatus !== 'Paid') {
      this.errorMessage.set('Workspace fee must be paid before approval.');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    Swal.fire({
      title: 'Approve Workspace?',
      text: 'This will make the workspace visible to all users for booking.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    }).then(result => {
      if (!result.isConfirmed) return;

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
    });
  }

  confirmFeePayment(workspaceId: number): void {
    Swal.fire({
      title: 'Confirm Workspace Fee Payment?',
      text: 'Use this after receiving the owner subscription fee for this workspace.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirm Payment',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    }).then(result => {
      if (!result.isConfirmed) return;

      this.loading.set(true);
      this.workspaceService.confirmWorkspaceFeePayment(workspaceId).subscribe({
        next: (response) => {
          this.successMessage.set(response.message || 'Workspace fee payment confirmed');
          this.pendingWorkspaces.update(workspaces =>
            workspaces.map(w => w.id === workspaceId
              ? {
                  ...w,
                  approvalPaymentStatus: 'Paid',
                  approvalPaymentPaidAt: new Date().toISOString(),
                  subscriptionStartDate: new Date().toISOString(),
                  subscriptionEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
                }
              : w)
          );
          this.loading.set(false);
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Failed to confirm fee payment');
          this.loading.set(false);
        }
      });
    });
  }

  rejectWorkspace(workspaceId: number): void {
    Swal.fire({
      title: 'Reject Workspace?',
      text: 'This will permanently delete the workspace and cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    }).then(result => {
      if (!result.isConfirmed) return;

      // For now, just remove from UI - you can implement a delete endpoint later
      this.pendingWorkspaces.update(workspaces =>
        workspaces.filter(w => w.id !== workspaceId)
      );
      this.successMessage.set('Workspace rejected');
      setTimeout(() => this.successMessage.set(''), 3000);
    });
  }

  getTotalRooms(workspace: Workspace): number {
    return workspace.rooms?.length || 0;
  }

  getTotalCapacity(workspace: Workspace): number {
    return workspace.rooms?.reduce((sum, room) => sum + room.capacity, 0) || 0;
  }

  getMinPrice(workspace: Workspace): number | null {
    const prices = workspace.rooms?.map(r => r.pricePerHour) ?? [];
    return prices.length ? Math.min(...prices) : null;
  }
}

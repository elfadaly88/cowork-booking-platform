import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-owner-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-approval.component.html',
  styleUrls: ['./owner-approval.component.scss']
})
export class OwnerApprovalComponent implements OnInit {
  pendingOwners = signal<User[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadPendingOwners();
  }

  loadPendingOwners(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.getPendingOwners().subscribe({
      next: (owners) => {
        this.pendingOwners.set(owners);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load pending owners', error);
        this.errorMessage.set('Failed to load pending owner requests');
        this.isLoading.set(false);
      }
    });
  }

  approveOwner(userId: string): void {
    if (!confirm('Are you sure you want to approve this owner account?')) {
      return;
    }

    this.authService.approveOwner(userId, true).subscribe({
      next: () => {
        this.successMessage.set('Owner account approved successfully');
        this.loadPendingOwners();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Failed to approve owner', error);
        this.errorMessage.set('Failed to approve owner account');
      }
    });
  }

  rejectOwner(userId: string): void {
    if (!confirm('Are you sure you want to reject this owner account?')) {
      return;
    }

    this.authService.approveOwner(userId, false).subscribe({
      next: () => {
        this.successMessage.set('Owner account rejected');
        this.loadPendingOwners();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Failed to reject owner', error);
        this.errorMessage.set('Failed to reject owner account');
      }
    });
  }
}

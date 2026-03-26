import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace } from '../../core/models/workspace.model';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly workspaceService = inject(WorkspaceService);

    private readonly cardIcons = ['🏙️', '⭐', '🎯', '🏢', '💼', '🌟'];

    featuredWorkspaces: Workspace[] = [];

    ngOnInit(): void {
        this.workspaceService.getAvailableWorkspaces().subscribe({
            next: (workspaces) => {
                this.featuredWorkspaces = workspaces.slice(0, 3);
            },
            error: () => { /* silent fail – landing page is public */ }
        });
    }

    getCardIcon(index: number): string {
        return this.cardIcons[index % this.cardIcons.length];
    }

    getMinPrice(workspace: Workspace): string {
        const prices = workspace.rooms?.map(r => r.pricePerHour) ?? [];
        return prices.length ? `EGP ${Math.min(...prices)}/hr` : '';
    }

    getSeatsLabel(workspace: Workspace): string {
        const seats = workspace.rooms?.reduce((sum, r) => sum + (r.availableSeats ?? r.capacity), 0) ?? 0;
        return seats > 0 ? `${seats} seats available` : workspace.city;
    }

    features = [
        { icon: '🏢', title: 'Flexible Spaces', desc: 'Choose from private offices, shared desks, and conference rooms.' },
        { icon: '⚡', title: 'Instant Booking', desc: 'Book any space in seconds. No calls, no paperwork.' },
        { icon: '💳', title: 'Pay Per Hour', desc: 'Only pay for the time you actually use. No hidden fees.' },
        { icon: '📍', title: 'Prime Locations', desc: 'Access workspaces across multiple cities and neighborhoods.' },
        { icon: '🔒', title: 'Secure Access', desc: 'Smart access control with real-time availability updates.' },
        { icon: '📊', title: 'Analytics', desc: 'Workspace owners get detailed occupancy & revenue reports.' }
    ];

    stats = [
        { value: '500+', label: 'Workspaces' },
        { value: '50K+', label: 'Bookings' },
        { value: '120+', label: 'Cities' },
        { value: '4.9★', label: 'Avg Rating' }
    ];

    onGetStarted(): void {
        if (this.authService.isAuthenticated()) {
            // Already logged in — send to the right dashboard
            if (this.authService.isAdmin()) this.router.navigate(['/admin']);
            else if (this.authService.isOwner()) this.router.navigate(['/owner/dashboard']);
            else this.router.navigate(['/workspaces']);
        } else {
            this.router.navigate(['/register']);
        }
    }

    onExplore(): void {
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/workspaces']);
        } else {
            this.router.navigate(['/login']);
        }
    }
}

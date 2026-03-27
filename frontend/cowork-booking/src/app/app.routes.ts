import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { HomeComponent } from './features/home/home.component';
import { WorkspaceDetailsComponent } from './features/workspace-details/workspace-details.component';
import { BookingFormComponent } from './features/booking-form/booking-form.component';
import { PaymentComponent } from './features/payment/payment.component';
import { TestPaymentComponent } from './features/payment/test-payment.component';
import { MyBookingsComponent } from './features/my-bookings/my-bookings.component';
import { ProfileComponent } from './features/profile/profile.component';
import { AdminPanelEnhancedComponent } from './features/admin-panel/admin-panel-enhanced.component';
import { ScheduleManagementComponent } from './features/admin-panel/schedule-management.component';
import { WorkspaceManagementComponent } from './features/admin-panel/workspace-management.component';
import { OwnerApprovalComponent } from './features/admin-panel/owner-approval.component';
import { WorkspaceApprovalComponent } from './features/admin-panel/workspace-approval.component';
import { OwnerDashboardComponent } from './features/owner-dashboard/owner-dashboard.component';
import { OwnerWorkspaceFormComponent } from './features/owner-dashboard/owner-workspace-form.component';
import { AdminWorkspaceFormComponent } from './features/admin-panel/admin-workspace-form.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { authGuard, adminGuard, ownerGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ─── Public routes (no auth required) ────────────────────────────
  {
    path: '',
    component: LandingComponent    // Public marketing landing page
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]       // Redirect if already logged in
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard]       // Redirect if already logged in
  },

  // ─── Authenticated user routes ────────────────────────────────────
  {
    path: 'workspaces',
    component: HomeComponent,
    canActivate: [authGuard]        // Browse available workspaces
  },
  {
    path: 'workspace/:id',
    component: WorkspaceDetailsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'booking/:roomId',
    component: BookingFormComponent,
    canActivate: [authGuard]        // Require authentication for booking
  },
  {
    path: 'booking/:bookingId/payment',
    component: PaymentComponent,
    canActivate: [authGuard]
  },
  {
    path: 'payment/test',
    component: TestPaymentComponent,
    canActivate: [authGuard]
  },
  {
    path: 'my-bookings',
    component: MyBookingsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },

  // ─── Admin routes ─────────────────────────────────────────────────
  {
    path: 'admin',
    component: AdminPanelEnhancedComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/schedule',
    component: ScheduleManagementComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/workspaces',
    component: WorkspaceManagementComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/workspaces/new',
    component: AdminWorkspaceFormComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/workspaces/edit/:id',
    component: AdminWorkspaceFormComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/owner-approvals',
    component: OwnerApprovalComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/workspace-approvals',
    component: WorkspaceApprovalComponent,
    canActivate: [adminGuard]
  },

  // ─── Owner routes ─────────────────────────────────────────────────
  {
    path: 'owner/dashboard',
    component: OwnerDashboardComponent,
    canActivate: [ownerGuard]
  },
  {
    path: 'owner/workspace/new',
    component: OwnerWorkspaceFormComponent,
    canActivate: [ownerGuard]
  },
  {
    path: 'owner/workspace/edit/:id',
    component: OwnerWorkspaceFormComponent,
    canActivate: [ownerGuard]
  },

  // ─── Fallback ─────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];

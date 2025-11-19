import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { WorkspaceDetailsComponent } from './features/workspace-details/workspace-details.component';
import { BookingFormComponent } from './features/booking-form/booking-form.component';
import { AdminPanelComponent } from './features/admin-panel/admin-panel.component';
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
  { path: '', component: HomeComponent },
  { path: 'workspace/:id', component: WorkspaceDetailsComponent },
  {
    path: 'booking/:roomId',
    component: BookingFormComponent,
    canActivate: [authGuard] // Require authentication for booking
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard] // Redirect if already logged in
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard] // Redirect if already logged in
  },
  {
    path: 'admin',
    component: AdminPanelEnhancedComponent,
    canActivate: [adminGuard] // Admin only
  },
  {
    path: 'admin-simple',
    component: AdminPanelComponent,
    canActivate: [adminGuard] // Admin only
  },
  {
    path: 'admin/schedule',
    component: ScheduleManagementComponent,
    canActivate: [adminGuard] // Admin only
  },
  {
    path: 'admin/workspaces',
    component: WorkspaceManagementComponent,
    canActivate: [adminGuard] // Admin only
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
    canActivate: [adminGuard] // Admin only
  },
  {
    path: 'admin/workspace-approvals',
    component: WorkspaceApprovalComponent,
    canActivate: [adminGuard] // Admin only
  },
  {
    path: 'owner/dashboard',
    component: OwnerDashboardComponent,
    canActivate: [ownerGuard] // Owner only
  },
  {
    path: 'owner/workspace/new',
    component: OwnerWorkspaceFormComponent,
    canActivate: [ownerGuard] // Owner only
  },
  {
    path: 'owner/workspace/edit/:id',
    component: OwnerWorkspaceFormComponent,
    canActivate: [ownerGuard] // Owner only
  },
  { path: '**', redirectTo: '' }
];

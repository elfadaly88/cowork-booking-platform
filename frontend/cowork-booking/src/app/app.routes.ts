import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { WorkspaceDetailsComponent } from './features/workspace-details/workspace-details.component';
import { BookingFormComponent } from './features/booking-form/booking-form.component';
import { AdminPanelComponent } from './features/admin-panel/admin-panel.component';
import { AdminPanelEnhancedComponent } from './features/admin-panel/admin-panel-enhanced.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'workspace/:id', component: WorkspaceDetailsComponent },
  { path: 'booking/:roomId', component: BookingFormComponent },
  { path: 'admin', component: AdminPanelEnhancedComponent },
  { path: 'admin-simple', component: AdminPanelComponent },
  { path: '**', redirectTo: '' }
];

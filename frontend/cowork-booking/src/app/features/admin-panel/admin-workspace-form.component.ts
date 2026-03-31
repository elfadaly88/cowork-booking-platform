import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '../../core/models/workspace.model';
import { MapLocationPickerComponent } from '../../shared/components/map-location-picker.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-workspace-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MapLocationPickerComponent, TranslateModule],
  template: `
    <div class="admin-workspace-form">
      <div class="panel-header">
        <h1>{{ isEditMode ? ('ADMIN.WORKSPACE_FORM_EDIT' | translate) : ('ADMIN.WORKSPACE_FORM_CREATE' | translate) }}</h1>
        <button class="btn btn-secondary" (click)="cancel()">← {{ 'ADMIN.BACK_TO_LIST' | translate }}</button>
      </div>

      <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>
      <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

      <form [formGroup]="workspaceForm" (ngSubmit)="submitForm()">
        <div class="form-section">
          <h2>{{ 'ADMIN.BASIC_INFO' | translate }}</h2>
          <div class="form-group">
            <label for="name">{{ 'ADMIN.WORKSPACE_NAME' | translate }} <span class="required">*</span></label>
            <input id="name" type="text" formControlName="name" [placeholder]="'ADMIN.WORKSPACE_NAME_PLACEHOLDER' | translate" />
          </div>

          <div class="form-group">
            <label for="description">{{ 'ADMIN.DESCRIPTION' | translate }} <span class="required">*</span></label>
            <textarea id="description" formControlName="description" rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="address">{{ 'ADMIN.ADDRESS' | translate }} <span class="required">*</span></label>
              <input id="address" type="text" formControlName="address" />
            </div>

            <div class="form-group">
              <label for="city">{{ 'ADMIN.CITY' | translate }} <span class="required">*</span></label>
              <input id="city" type="text" formControlName="city" />
            </div>
          </div>

          <div class="form-group map-group">
            <label>{{ 'ADMIN.MAP_LOCATION' | translate }} <span class="required">*</span></label>
            <app-map-location-picker
              [initialLatitude]="workspaceForm.get('latitude')?.value"
              [initialLongitude]="workspaceForm.get('longitude')?.value"
              (locationSelected)="onLocationSelected($event)">
            </app-map-location-picker>
            <span *ngIf="workspaceForm.get('latitude')?.invalid && workspaceForm.get('latitude')?.touched" class="error-text text-danger" style="display: block; margin-top: 5px;">
              {{ 'ADMIN.LOCATION_REQUIRED' | translate }}
            </span>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <h2>{{ 'ADMIN.ROOMS_TITLE' | translate }}</h2>
            <button type="button" class="btn btn-sm btn-primary" (click)="addRoom()">➕ {{ 'ADMIN.ADD_ROOM' | translate }}</button>
          </div>

          <div formArrayName="rooms">
            <div *ngFor="let room of rooms.controls; let i = index" [formGroupName]="i" class="room-card">
              <div class="room-header">
                <h3>{{ 'ADMIN.ROOM_HASH' | translate: {num: i + 1} }}</h3>
                <button type="button" class="btn btn-sm btn-danger" (click)="removeRoom(i)">🗑️ {{ 'COMMON.REMOVE' | translate }}</button>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>{{ 'ADMIN.ROOM_NAME' | translate }} *</label>
                  <input type="text" formControlName="name" />
                </div>
                <div class="form-group">
                  <label>{{ 'ADMIN.CAPACITY' | translate }} *</label>
                  <input type="number" formControlName="capacity" min="1" />
                </div>
                <div class="form-group">
                  <label>{{ 'ADMIN.PRICE_LABEL' | translate }} *</label>
                  <input type="number" formControlName="pricePerHour" min="0" step="0.01" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">{{ 'COMMON.CANCEL' | translate }}</button>
          <button type="submit" class="btn btn-primary">{{ isEditMode ? ('ADMIN.SAVE_UPDATE' | translate) : ('ADMIN.SAVE_CREATE' | translate) }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
    .admin-workspace-form { max-width: 900px; margin: 0 auto; padding: 1rem; }
    .panel-header { display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem }
    .form-section { background: #fff; padding:1rem; border-radius:8px; margin-bottom:1rem; }
    .form-row { display:flex; gap:1rem; }
    .form-group { flex:1; display:flex; flex-direction:column; gap:0.25rem }
    .room-card { border:1px solid #eee; padding:0.75rem; border-radius:6px; margin-bottom:0.5rem }
    .form-actions { display:flex; gap:0.5rem; justify-content:flex-end }
    `
  ]
})
export class AdminWorkspaceFormComponent implements OnInit {
  workspaceForm: FormGroup;
  isEditMode = false;
  workspaceId: number | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private workspaceService: WorkspaceService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.workspaceForm = this.createWorkspaceForm();
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.workspaceId = Number(idParam);
      this.loadWorkspace(this.workspaceId);
    }
  }

  createWorkspaceForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      rooms: this.fb.array([])
    });
  }

  onLocationSelected(location: {lat: number, lng: number}): void {
    this.workspaceForm.patchValue({
      latitude: location.lat,
      longitude: location.lng
    });
  }

  get rooms(): FormArray {
    return this.workspaceForm.get('rooms') as FormArray;
  }

  addRoom(): void {
    this.rooms.push(this.fb.group({ name: ['', Validators.required], capacity: [1, Validators.required], pricePerHour: [0, Validators.required] }));
  }

  removeRoom(index: number): void {
    this.rooms.removeAt(index);
  }

  loadWorkspace(id: number): void {
    this.workspaceService.getWorkspaceById(id).subscribe({
      next: (ws: any) => {
        this.workspaceForm.patchValue({
          name: ws.name,
          description: ws.description,
          address: ws.address,
          city: ws.city,
          latitude: ws.latitude,
          longitude: ws.longitude
        });
        this.rooms.clear();
        if (ws.rooms) {
          ws.rooms.forEach((r: any) => this.rooms.push(this.fb.group({ id: [r.id], name: [r.name, Validators.required], capacity: [r.capacity, Validators.required], pricePerHour: [r.pricePerHour, Validators.required] })));
        }
      },
      error: (err: any) => { this.errorMessage = 'Failed to load workspace'; console.error(err); }
    });
  }
  submitForm(): void {
    if (this.workspaceForm.invalid) { this.workspaceForm.markAllAsTouched(); return; }
    const v = this.workspaceForm.value;
    if (this.isEditMode && this.workspaceId) {
      const dto: UpdateWorkspaceDto = { id: this.workspaceId, ...v } as UpdateWorkspaceDto;
      this.workspaceService.updateWorkspace(this.workspaceId, dto).subscribe({ next: () => { this.successMessage = 'Workspace updated'; this.router.navigate(['/admin/workspaces']); }, error: (err: any) => { this.errorMessage = 'Failed to update workspace'; console.error(err); } });
    } else {
      const dto: CreateWorkspaceDto = v as CreateWorkspaceDto;
      this.workspaceService.createWorkspace(dto).subscribe({ next: () => { this.successMessage = 'Workspace created'; this.router.navigate(['/admin/workspaces']); }, error: (err: any) => { this.errorMessage = 'Failed to create workspace'; console.error(err); } });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/workspaces']);
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '../../core/models/workspace.model';
import { catchError, throwError } from 'rxjs';
import { MapPickerComponent } from '../../shared/components/map-picker.component';

@Component({
  selector: 'app-admin-panel-enhanced',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapPickerComponent],
  templateUrl: './admin-panel-enhanced.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelEnhancedComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly baseUrl = environment.apiBaseUrl;

  workspaces = signal<Workspace[]>([]);
  workspaceForm!: FormGroup;
  isEditMode = signal(false);
  selectedWorkspaceId = signal<number | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadWorkspaces();
  }

  private initForm(): void {
    this.workspaceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      latitude: [null],
      longitude: [null],
      rooms: this.fb.array([])
    });
  }

  get rooms(): FormArray {
    return this.workspaceForm.get('rooms') as FormArray;
  }

  getDevices(roomIndex: number): FormArray {
    return this.rooms.at(roomIndex).get('devices') as FormArray;
  }

  addRoom(): void {
    const roomGroup = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      capacity: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
      pricePerHour: [0, [Validators.required, Validators.min(0)]],
      devices: this.fb.array([])
    });
    this.rooms.push(roomGroup);
  }

  removeRoom(index: number): void {
    if (confirm('Are you sure you want to remove this room?')) {
      this.rooms.removeAt(index);
    }
  }

  addDevice(roomIndex: number): void {
    const deviceGroup = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      extraCostPerHour: [0, [Validators.required, Validators.min(0)]]
    });
    this.getDevices(roomIndex).push(deviceGroup);
  }

  removeDevice(roomIndex: number, deviceIndex: number): void {
    if (confirm('Are you sure you want to remove this device?')) {
      this.getDevices(roomIndex).removeAt(deviceIndex);
    }
  }

  loadWorkspaces(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<Workspace[]>(`${this.baseUrl}/workspaces`)
      .pipe(
        catchError(err => {
          this.errorMessage.set('Failed to load workspaces');
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe(data => {
        this.workspaces.set(data);
        this.isLoading.set(false);
      });
  }

  onSubmit(): void {
    if (this.workspaceForm.invalid) {
      this.markFormGroupTouched(this.workspaceForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.isEditMode()) {
      this.updateWorkspace();
    } else {
      this.createWorkspace();
    }
  }

  private createWorkspace(): void {
    const formData = this.workspaceForm.value;
    const workspaceData: CreateWorkspaceDto = {
      name: formData.name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      latitude: formData.latitude,
      longitude: formData.longitude,
      rooms: formData.rooms
    };

    this.http.post<Workspace>(`${this.baseUrl}/workspaces/with-rooms`, workspaceData)
      .pipe(
        catchError(err => {
          this.errorMessage.set(err.error?.message || 'Failed to create workspace');
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe(() => {
        this.successMessage.set('Workspace created successfully with rooms and devices!');
        this.isLoading.set(false);
        this.resetForm();
        this.loadWorkspaces();
      });
  }

  private updateWorkspace(): void {
    const id = this.selectedWorkspaceId();
    if (!id) return;

    const formData = this.workspaceForm.value;
    const workspaceData: UpdateWorkspaceDto = {
      id,
      name: formData.name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      latitude: formData.latitude,
      longitude: formData.longitude,
      rooms: formData.rooms
    };

    this.http.put<Workspace>(`${this.baseUrl}/workspaces/${id}/with-rooms`, workspaceData)
      .pipe(
        catchError(err => {
          this.errorMessage.set(err.error?.message || 'Failed to update workspace');
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe(() => {
        this.successMessage.set('Workspace updated successfully with all changes!');
        this.isLoading.set(false);
        this.resetForm();
        this.loadWorkspaces();
      });
  }

  editWorkspace(workspace: Workspace): void {
    this.isEditMode.set(true);
    this.selectedWorkspaceId.set(workspace.id!);

    // Clear existing rooms
    while (this.rooms.length) {
      this.rooms.removeAt(0);
    }

    // Patch basic workspace data
    this.workspaceForm.patchValue({
      name: workspace.name,
      description: workspace.description,
      address: workspace.address,
      city: workspace.city,
      latitude: workspace.latitude,
      longitude: workspace.longitude
    });

    // Add rooms and devices
    if (workspace.rooms && workspace.rooms.length > 0) {
      workspace.rooms.forEach(room => {
        const roomGroup = this.fb.group({
          id: [room.id],
          name: [room.name, [Validators.required, Validators.minLength(2)]],
          capacity: [room.capacity, [Validators.required, Validators.min(1), Validators.max(1000)]],
          pricePerHour: [room.pricePerHour, [Validators.required, Validators.min(0)]],
          devices: this.fb.array([])
        });

        // Add devices for this room
        if (room.devices && room.devices.length > 0) {
          const devicesArray = roomGroup.get('devices') as FormArray;
          room.devices.forEach(device => {
            const deviceGroup = this.fb.group({
              id: [device.id],
              name: [device.name, [Validators.required, Validators.minLength(2)]],
              extraCostPerHour: [device.extraCostPerHour, [Validators.required, Validators.min(0)]]
            });
            devicesArray.push(deviceGroup);
          });
        }

        this.rooms.push(roomGroup);
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteWorkspace(id: number): void {
    if (!confirm('Are you sure you want to delete this workspace? This will also delete all associated rooms and devices.')) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.delete(`${this.baseUrl}/workspaces/${id}`)
      .pipe(
        catchError(err => {
          this.errorMessage.set('Failed to delete workspace');
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe(() => {
        this.successMessage.set('Workspace deleted successfully!');
        this.isLoading.set(false);
        this.loadWorkspaces();
      });
  }

  resetForm(): void {
    this.workspaceForm.reset();
    while (this.rooms.length) {
      this.rooms.removeAt(0);
    }
    this.isEditMode.set(false);
    this.selectedWorkspaceId.set(null);
    this.workspaceForm.markAsUntouched();
    this.workspaceForm.markAsPristine();
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.workspaceForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isRoomFieldInvalid(roomIndex: number, fieldName: string): boolean {
    const field = this.rooms.at(roomIndex).get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isDeviceFieldInvalid(roomIndex: number, deviceIndex: number, fieldName: string): boolean {
    const field = this.getDevices(roomIndex).at(deviceIndex).get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.workspaceForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return `${this.capitalize(fieldName)} is required`;
    }
    if (field.hasError('minlength')) {
      return `${this.capitalize(fieldName)} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    }
    if (field.hasError('min')) {
      return `${this.capitalize(fieldName)} must be greater than ${field.errors?.['min'].min}`;
    }
    if (field.hasError('max')) {
      return `${this.capitalize(fieldName)} must be less than ${field.errors?.['max'].max}`;
    }
    return '';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  onLocationSelected(coordinates: { lat: number; lng: number }): void {
    this.workspaceForm.patchValue({
      latitude: coordinates.lat,
      longitude: coordinates.lng
    });
  }
}

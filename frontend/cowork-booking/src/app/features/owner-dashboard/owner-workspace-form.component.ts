import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkspaceService } from '../../core/services/workspace.service';
import { CreateWorkspaceDto, CreateRoomDto, CreateDeviceDto } from '../../core/models/workspace.model';
import { MapLocationPickerComponent } from '../../shared/components/map-location-picker.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-owner-workspace-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapLocationPickerComponent],
  templateUrl: './owner-workspace-form.component.html',
  styleUrls: ['./owner-workspace-form.component.scss']
})
export class OwnerWorkspaceFormComponent implements OnInit {
  workspaceForm!: FormGroup;
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  isEditMode = signal(false);
  workspaceId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private workspaceService: WorkspaceService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.workspaceId = +id;
      this.isEditMode.set(true);
      // TODO: Load workspace data for editing
    }
  }

  initializeForm(): void {
    this.workspaceForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      rooms: this.fb.array([])
    });

    // Add one room by default
    this.addRoom();
  }

  get rooms(): FormArray {
    return this.workspaceForm.get('rooms') as FormArray;
  }

  getDevices(roomIndex: number): FormArray {
    return this.rooms.at(roomIndex).get('devices') as FormArray;
  }

  addRoom(): void {
    const roomForm = this.fb.group({
      name: ['', Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      pricePerHour: [0, [Validators.required, Validators.min(0)]],
      devices: this.fb.array([])
    });
    this.rooms.push(roomForm);
  }

  removeRoom(index: number): void {
    if (this.rooms.length > 1) {
      this.rooms.removeAt(index);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'At least one room is required'
      });
    }
  }

  addDevice(roomIndex: number): void {
    const deviceForm = this.fb.group({
      name: ['', Validators.required],
      extraCostPerHour: [0, [Validators.required, Validators.min(0)]]
    });
    this.getDevices(roomIndex).push(deviceForm);
  }

  removeDevice(roomIndex: number, deviceIndex: number): void {
    this.getDevices(roomIndex).removeAt(deviceIndex);
  }

  onLocationSelected(location: {lat: number, lng: number}): void {
    this.workspaceForm.patchValue({
      latitude: location.lat,
      longitude: location.lng
    });
  }

  onSubmit(): void {
    if (this.workspaceForm.invalid) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.workspaceForm.value;
    const workspaceData: CreateWorkspaceDto = {
      name: formValue.name,
      description: formValue.description,
      address: formValue.address,
      city: formValue.city,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      rooms: formValue.rooms.map((room: any) => ({
        name: room.name,
        capacity: room.capacity,
        pricePerHour: room.pricePerHour,
        devices: room.devices.map((device: any) => ({
          name: device.name,
          extraCostPerHour: device.extraCostPerHour
        }))
      }))
    };

    // For now, just use create - TODO: Implement update
    this.createWorkspace(workspaceData);
  }

  createWorkspace(data: CreateWorkspaceDto): void {
    this.workspaceService.createWorkspaceWithRooms(data).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set('Workspace created successfully! It will be visible to users after admin approval.');

        // Redirect to owner dashboard after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/owner/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.message || 'Failed to create workspace');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/owner/dashboard']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.workspaceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isRoomFieldInvalid(roomIndex: number, fieldName: string): boolean {
    const field = this.rooms.at(roomIndex).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isDeviceFieldInvalid(roomIndex: number, deviceIndex: number, fieldName: string): boolean {
    const field = this.getDevices(roomIndex).at(deviceIndex).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}

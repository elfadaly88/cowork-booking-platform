import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto, CreateRoomDto, UpdateRoomDto } from '../../core/models/workspace.model';

@Component({
  selector: 'app-workspace-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './workspace-management.component.html',
  styleUrls: ['./workspace-management.component.scss']
})
export class WorkspaceManagementComponent implements OnInit {
  private readonly workspaceService = inject(WorkspaceService);
  private readonly fb = inject(FormBuilder);

  // Signals for reactive state management
  workspaces = signal<Workspace[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  viewMode = signal<'list' | 'form'>('list');
  isEditMode = signal<boolean>(false);
  selectedWorkspaceId = signal<number | null>(null);

  // Form for workspace creation/editing
  workspaceForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    latitude: [null],
    longitude: [null],
    rooms: this.fb.array([])
  });

  // Getters for form access
  get rooms(): FormArray {
    return this.workspaceForm.get('rooms') as FormArray;
  }

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    this.workspaceService.getWorkspaces().subscribe({
      next: (data) => {
        this.workspaces.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load workspaces');
        this.isLoading.set(false);
      }
    });
  }

  // Switch to add new workspace mode
  addNewWorkspace(): void {
    this.viewMode.set('form');
    this.isEditMode.set(false);
    this.selectedWorkspaceId.set(null);
    this.workspaceForm.reset();
    
    // Clear rooms array
    while (this.rooms.length) {
      this.rooms.removeAt(0);
    }
    
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // Switch to edit workspace mode
  editWorkspace(workspace: Workspace): void {
    this.viewMode.set('form');
    this.isEditMode.set(true);
    this.selectedWorkspaceId.set(workspace.id!);
    this.errorMessage.set(null);
    this.successMessage.set(null);

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

    // Add rooms if available
    if (workspace.rooms && workspace.rooms.length > 0) {
      workspace.rooms.forEach(room => {
        const roomGroup = this.fb.group({
          id: [room.id],
          name: [room.name, [Validators.required, Validators.minLength(2)]],
          capacity: [room.capacity, [Validators.required, Validators.min(1)]],
          pricePerHour: [room.pricePerHour, [Validators.required, Validators.min(0)]]
        });
        this.rooms.push(roomGroup);
      });
    }
  }

  // Add a new room to the form
  addRoom(): void {
    const roomGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      capacity: [1, [Validators.required, Validators.min(1)]],
      pricePerHour: [0, [Validators.required, Validators.min(0)]]
    });
    this.rooms.push(roomGroup);
  }

  // Remove a room from the form
  removeRoom(index: number): void {
    this.rooms.removeAt(index);
  }

  // Cancel form and return to list view
  cancelForm(): void {
    this.viewMode.set('list');
    this.workspaceForm.reset();
  }

  // Submit the form (create or update)
  onSubmit(): void {
    if (this.workspaceForm.invalid) {
      this.markFormGroupTouched(this.workspaceForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValue = this.workspaceForm.value;

    if (this.isEditMode()) {
      // Update existing workspace
      const updateDto: UpdateWorkspaceDto = {
        id: this.selectedWorkspaceId()!,
        name: formValue.name,
        description: formValue.description,
        address: formValue.address,
        city: formValue.city,
        latitude: formValue.latitude,
        longitude: formValue.longitude,
        rooms: formValue.rooms as UpdateRoomDto[]
      };

      // Mock update for now - would connect to actual service
      console.log('Updating workspace:', updateDto);
      setTimeout(() => {
        this.isLoading.set(false);
        this.successMessage.set('Workspace updated successfully');
        this.loadWorkspaces();
        this.viewMode.set('list');
      }, 1000);
    } else {
      // Create new workspace
      const createDto: CreateWorkspaceDto = {
        name: formValue.name,
        description: formValue.description,
        address: formValue.address,
        city: formValue.city,
        latitude: formValue.latitude,
        longitude: formValue.longitude,
        rooms: formValue.rooms as CreateRoomDto[]
      };

      // Mock create for now - would connect to actual service
      console.log('Creating workspace:', createDto);
      setTimeout(() => {
        this.isLoading.set(false);
        this.successMessage.set('Workspace created successfully');
        this.loadWorkspaces();
        this.viewMode.set('list');
      }, 1000);
    }
  }

  // Helper to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }
}

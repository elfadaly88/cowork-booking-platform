import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Workspace, Room, CreateWorkspaceDto, UpdateWorkspaceDto } from '../../../core/models/workspace.model';

@Component({
  selector: 'app-workspace-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  // Router used for navigating to the separate form page
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './workspace-management.component.html',
  styleUrls: ['./workspace-management.component.scss']
})
export class WorkspaceManagementComponent implements OnInit {
  workspaces = signal<Workspace[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  viewMode = signal<'list' | 'form'>('list');
  editMode = signal<boolean>(false);
  selectedWorkspace = signal<Workspace | null>(null);

  workspaceForm: FormGroup;

  constructor(
    private workspaceService: WorkspaceService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.workspaceForm = this.createWorkspaceForm();
  }

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    this.loading.set(true);
    this.error.set(null);

    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces.set(workspaces);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load workspaces. Please try again.');
        this.loading.set(false);
        console.error('Error loading workspaces:', err);
      }
    });
  }

  createWorkspaceForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      latitude: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [0, [Validators.required, Validators.min(-180), Validators.max(180)]],
      rooms: this.fb.array([])
    });
  }

  get roomsFormArray(): FormArray {
    return this.workspaceForm.get('rooms') as FormArray;
  }

  addRoom(): void {
    const roomForm = this.fb.group({
      name: ['', Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      pricePerHour: [0, [Validators.required, Validators.min(0)]]
    });

    this.roomsFormArray.push(roomForm);
  }

  removeRoom(index: number): void {
    this.roomsFormArray.removeAt(index);
  }

  addNewWorkspace(): void {
    // Navigate to the dedicated form route for creating a new workspace
    this.router.navigate(['/admin/workspaces/new']);
  }

  editWorkspace(workspace: Workspace): void {
    // Navigate to the dedicated edit form route
    this.router.navigate(['/admin/workspaces/edit', workspace.id]);
  }

  cancelEdit(): void {
    this.viewMode.set('list');
    this.editMode.set(false);
    this.selectedWorkspace.set(null);
    this.error.set(null);
    this.success.set(null);
  }

  submitForm(): void {
    if (this.workspaceForm.invalid) {
      this.workspaceForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const formValue = this.workspaceForm.value;

    if (this.editMode()) {
      const updateDto: UpdateWorkspaceDto = {
        id: this.selectedWorkspace()?.id ?? 0,
        name: formValue.name,
        description: formValue.description,
        address: formValue.address,
        city: formValue.city,
        latitude: formValue.latitude,
        longitude: formValue.longitude,
        rooms: formValue.rooms
      };

      this.workspaceService.updateWorkspace(updateDto.id, updateDto).subscribe({
        next: () => {
          this.success.set('Workspace updated successfully!');
          this.loading.set(false);
          this.loadWorkspaces();
          this.viewMode.set('list');
        },
        error: (err) => {
          this.error.set('Failed to update workspace. Please try again.');
          this.loading.set(false);
          console.error('Error updating workspace:', err);
        }
      });
    } else {
      const createDto: CreateWorkspaceDto = {
        name: formValue.name,
        description: formValue.description,
        address: formValue.address,
        city: formValue.city,
        latitude: formValue.latitude,
        longitude: formValue.longitude,
        rooms: formValue.rooms
      };

      this.workspaceService.createWorkspace(createDto).subscribe({
        next: () => {
          this.success.set('Workspace created successfully!');
          this.loading.set(false);
          this.loadWorkspaces();
          this.viewMode.set('list');
        },
        error: (err) => {
          this.error.set('Failed to create workspace. Please try again.');
          this.loading.set(false);
          console.error('Error creating workspace:', err);
        }
      });
    }
  }
}

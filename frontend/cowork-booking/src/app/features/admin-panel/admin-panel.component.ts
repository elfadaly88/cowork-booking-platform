import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Workspace } from '../../core/models/workspace.model';
import { catchError, throwError } from 'rxjs';
import { MapPickerComponent } from '../../shared/components/map-picker.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MapPickerComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly baseUrl = environment.apiBaseUrl;

  workspaces = signal<Workspace[]>([]);
  workspaceForm!: FormGroup;
  isEditMode = signal(false);
  viewMode = signal<'list' | 'form'>('list');
  selectedWorkspaceId = signal<number | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  searchTerm = signal<string>('');
  originalWorkspaceData = signal<Workspace | null>(null);
  hasUnsavedChanges = signal(false);

  ngOnInit(): void {
    this.initForm();
    this.loadWorkspaces();
    this.setupFormChangeTracking();
  }

  private initForm(): void {
    this.workspaceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      latitude: [null],
      longitude: [null]
    });
  }

  private setupFormChangeTracking(): void {
    this.workspaceForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  private checkForChanges(): void {
    if (!this.isEditMode()) return;

    const currentValues = this.workspaceForm.value;
    const originalValues = this.originalWorkspaceData();

    if (!originalValues) return;

    const hasChanges = Object.keys(currentValues).some(key => {
      const current = currentValues[key];
      const original = originalValues[key as keyof Workspace];
      return current !== original && !(current === '' && original === null);
    });

    this.hasUnsavedChanges.set(hasChanges);
  }

  loadWorkspaces(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<Workspace[]>(`${this.baseUrl}/workspaces`)
      .pipe(
        catchError(err => {
          console.warn('Backend API not available:', err);
          this.errorMessage.set('Unable to connect to backend. Please ensure the API server is running.');
          this.isLoading.set(false);
          // Return empty array instead of throwing error to prevent app crash
          return [[]];
        })
      )
      .subscribe(data => {
        this.workspaces.set(data || []);
        this.isLoading.set(false);
      });
  }

  onSubmit(): void {
    if (this.workspaceForm.invalid) {
      Object.keys(this.workspaceForm.controls).forEach(key => {
        this.workspaceForm.get(key)?.markAsTouched();
      });
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.',
        confirmButtonColor: '#007bff'
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formData = this.workspaceForm.value;
    const workspaceData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null
    };

    if (this.isEditMode()) {
      this.updateWorkspace(workspaceData);
    } else {
      this.createWorkspace(workspaceData);
    }
  }

  private createWorkspace(data: any): void {
    this.http.post<Workspace>(`${this.baseUrl}/workspaces`, data)
      .pipe(
        catchError(err => {
          console.error('Failed to create workspace:', err);
          const errorMsg = err?.error?.message || 'Failed to create workspace. Please check if the API server is running.';
          this.errorMessage.set(errorMsg);
          Swal.fire({
            icon: 'error',
            title: 'Creation Failed',
            text: errorMsg,
            confirmButtonColor: '#dc3545'
          });
          this.isLoading.set(false);
          return []; // Return empty observable instead of throwing
        })
      )
      .subscribe(() => {
        this.successMessage.set('Workspace created successfully!');
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Workspace created successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        this.isLoading.set(false);
        this.resetForm();
        this.viewMode.set('list');
        this.loadWorkspaces();
      });
  }

  private updateWorkspace(data: any): void {
    const id = this.selectedWorkspaceId();
    if (!id) return;

    const payload = { ...data, id };

    this.http.put(`${this.baseUrl}/workspaces/${id}`, payload)
      .pipe(
        catchError(err => {
          console.error('Failed to update workspace:', err);
          const errorMsg = err?.error?.message || 'Failed to update workspace. Please check if the API server is running.';
          this.errorMessage.set(errorMsg);
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: errorMsg,
            confirmButtonColor: '#dc3545'
          });
          this.isLoading.set(false);
          return []; // Return empty observable instead of throwing
        })
      )
      .subscribe(() => {
        this.successMessage.set('Workspace updated successfully!');
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Workspace updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        this.isLoading.set(false);
        this.resetForm();
        this.viewMode.set('list');
        this.loadWorkspaces();
      });
  }

  editWorkspace(workspace: Workspace): void {
    this.isEditMode.set(true);
    this.viewMode.set('form');
    this.selectedWorkspaceId.set(workspace.id!);

    // Store original data for change tracking
    this.originalWorkspaceData.set({ ...workspace });

    this.workspaceForm.patchValue({
      name: workspace.name,
      description: workspace.description || '',
      address: workspace.address || '',
      city: workspace.city || '',
      latitude: typeof workspace.latitude === 'number' ? workspace.latitude : null,
      longitude: typeof workspace.longitude === 'number' ? workspace.longitude : null
    });

    this.hasUnsavedChanges.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteWorkspace(id: number): void {
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'Do you want to delete this workspace? This action cannot be undone!',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.isLoading.set(true);
      this.errorMessage.set(null);

      this.http.delete(`${this.baseUrl}/workspaces/${id}`)
        .pipe(
          catchError(err => {
            console.error('Failed to delete workspace:', err);
            const errorMsg = err?.error?.message || 'Failed to delete workspace. Please check if the API server is running.';
            this.errorMessage.set(errorMsg);
            Swal.fire({
              icon: 'error',
              title: 'Deletion Failed',
              text: errorMsg,
              confirmButtonColor: '#dc3545'
            });
            this.isLoading.set(false);
            return []; // Return empty observable instead of throwing
          })
        )
        .subscribe(() => {
          this.successMessage.set('Workspace deleted successfully!');
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Workspace has been deleted successfully.',
            timer: 2000,
            showConfirmButton: false
          });
          this.isLoading.set(false);
          this.loadWorkspaces();
        });
    });
  }

  resetForm(): void {
    this.workspaceForm.reset();
    this.isEditMode.set(false);
    this.selectedWorkspaceId.set(null);
    this.originalWorkspaceData.set(null);
    this.hasUnsavedChanges.set(false);
    Object.keys(this.workspaceForm.controls).forEach(key => {
      this.workspaceForm.get(key)?.setErrors(null);
    });
  }

  startNewWorkspace(): void {
    this.resetForm();
    this.viewMode.set('form');
    // Auto-focus first field after a short delay
    setTimeout(() => {
      const firstInput = document.querySelector('#name') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 100);
  }

  showWorkspaceList(): void {
    this.viewMode.set('list');
  }

  cancelToList(): void {
    if (this.hasUnsavedChanges()) {
      Swal.fire({
        icon: 'warning',
        title: 'Unsaved Changes',
        text: 'You have unsaved changes. Are you sure you want to leave?',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Leave',
        cancelButtonText: 'Stay'
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetForm();
          this.viewMode.set('list');
        }
      });
    } else {
      this.resetForm();
      this.viewMode.set('list');
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.workspaceForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.workspaceForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field.hasError('minlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 3 characters`;
    }
    if (field.hasError('pattern')) {
      return `Invalid ${fieldName} format`;
    }
    return '';
  }

  onLocationSelected(coordinates: { lat: number; lng: number }): void {
    this.workspaceForm.patchValue({
      latitude: coordinates.lat,
      longitude: coordinates.lng
    });
  }

  onWorkspaceSelect(value: string): void {
    if (!value) {
      // Switch to create new workspace mode
      this.startNewWorkspace();
      return;
    }
    const id = parseInt(value, 10);
    if (isNaN(id)) return;
    const ws = this.workspaces().find(w => w.id === id);
    if (ws) {
      this.editWorkspace(ws);
    }
  }

  isFieldChanged(fieldName: string): boolean {
    if (!this.isEditMode() || !this.originalWorkspaceData()) return false;

    const currentValue = this.workspaceForm.get(fieldName)?.value;
    const originalValue = this.originalWorkspaceData()![fieldName as keyof Workspace];

    return currentValue !== originalValue && !(currentValue === '' && originalValue === null);
  }

  getFieldChangeIndicator(fieldName: string): string {
    if (this.isFieldChanged(fieldName)) {
      return '🔄'; // Changed
    }
    return '';
  }

  filteredWorkspaces(): Workspace[] {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.workspaces();
    if (!term) return list;
    return list.filter(w => {
      const name = w.name?.toLowerCase() ?? '';
      const city = w.city?.toLowerCase() ?? '';
      const address = w.address?.toLowerCase() ?? '';
      return name.includes(term) || city.includes(term) || address.includes(term);
    });
  }
}

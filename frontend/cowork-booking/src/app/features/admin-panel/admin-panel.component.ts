import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Workspace } from '../../core/models/workspace.model';
import { catchError, throwError } from 'rxjs';
import { MapPickerComponent } from '../../shared/components/map-picker.component';

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
      latitude: ['', [Validators.pattern(/^-?([0-8]?[0-9]|90)(\.[0-9]{1,10})?$/)]],
      longitude: ['', [Validators.pattern(/^-?((1[0-7][0-9])|([0-9]?[0-9]))(\.[0-9]{1,10})?$/)]]
    });
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
      Object.keys(this.workspaceForm.controls).forEach(key => {
        this.workspaceForm.get(key)?.markAsTouched();
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
          this.errorMessage.set('Failed to create workspace');
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe(() => {
        this.successMessage.set('Workspace created successfully!');
        this.isLoading.set(false);
        this.resetForm();
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
          this.errorMessage.set('Failed to update workspace');
          this.isLoading.set(false);
          return throwError(() => err);
        })
      )
      .subscribe(() => {
        this.successMessage.set('Workspace updated successfully!');
        this.isLoading.set(false);
        this.resetForm();
        this.loadWorkspaces();
      });
  }

  editWorkspace(workspace: Workspace): void {
    this.isEditMode.set(true);
    this.selectedWorkspaceId.set(workspace.id!);
    this.workspaceForm.patchValue({
      name: workspace.name,
      description: workspace.description || '',
      address: workspace.address || '',
      city: workspace.city || '',
      latitude: workspace.latitude || '',
      longitude: workspace.longitude || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteWorkspace(id: number): void {
    if (!confirm('Are you sure you want to delete this workspace?')) {
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
    this.isEditMode.set(false);
    this.selectedWorkspaceId.set(null);
    Object.keys(this.workspaceForm.controls).forEach(key => {
      this.workspaceForm.get(key)?.setErrors(null);
    });
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
}

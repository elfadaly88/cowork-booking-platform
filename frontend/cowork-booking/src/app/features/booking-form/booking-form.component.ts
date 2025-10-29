import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { BookingService } from '../../core/services/booking.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { BookingRequest } from '../../core/models/booking.model';
import { Room, Device, Workspace } from '../../core/models/workspace.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message.component';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatIconModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent
  ],
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.scss']
})
export class BookingFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  bookingForm!: FormGroup;
  roomId: number | null = null;
  workspaceId: number | null = null;
  room: Room | null = null;
  workspace: Workspace | null = null;
  availableDevices: Device[] = [];
  selectedDevices: number[] = [];
  minDate = new Date();

  loading = false;
  submitting = false;
  error: string | null = null;

  ngOnInit(): void {
    // Try to get state from navigation
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (history.state?.room ? history.state : null);

    if (state?.room) {
      // State passed from workspace-details
      this.room = state.room;
      this.workspace = state.workspace;
      this.roomId = this.room?.id || null;
      this.workspaceId = this.workspace?.id || null;
      this.availableDevices = this.room?.devices || [];
    } else {
      // Fallback: get from route params and fetch data
      const id = this.route.snapshot.paramMap.get('roomId');
      if (id) {
        this.roomId = +id;
        this.loadRoomDetails();
      } else {
        this.error = 'No room information available';
        this.router.navigate(['/']);
      }
    }

    this.initForm();
  }

  initForm(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.bookingForm = this.fb.group({
      bookingDate: [tomorrow, Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required],
      userId: [1] // Default user ID - in a real app, this would come from auth
    });
  }

  loadRoomDetails(): void {
    // Fetch room details from workspace by ID
    if (!this.roomId) return;

    this.loading = true;
    this.error = null;

    // Find workspace that contains this room
    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        for (const ws of workspaces) {
          const foundRoom = ws.rooms?.find(r => r.id === this.roomId);
          if (foundRoom) {
            this.room = foundRoom;
            this.workspace = ws;
            this.availableDevices = foundRoom.devices || [];
            break;
          }
        }
        if (!this.room) {
          this.error = 'Room not found';
        }
        this.loading = false;
      },
      error: (err) => {
        console.warn('Backend API not available for room details:', err);
        this.error = 'Unable to connect to backend. Please ensure the API server is running.';
        this.room = null;
        this.workspace = null;
        this.availableDevices = [];
        this.loading = false;
      }
    });
  }

  get totalPrice(): number {
    if (!this.room || !this.bookingForm) return 0;

    const formValue = this.bookingForm.value;
    if (!formValue.startTime || !formValue.endTime) return 0;

    const [startHour, startMinute] = formValue.startTime.split(':').map(Number);
    const [endHour, endMinute] = formValue.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const durationHours = (endMinutes - startMinutes) / 60;

    if (durationHours <= 0) return 0;

    let total = this.room.pricePerHour * durationHours;

    // Add device costs
    this.selectedDevices.forEach(deviceId => {
      const device = this.availableDevices.find(d => d.id === deviceId);
      if (device) {
        total += device.extraCostPerHour * durationHours;
      }
    });

    return total;
  }

  toggleDevice(deviceId: number): void {
    const index = this.selectedDevices.indexOf(deviceId);
    if (index > -1) {
      this.selectedDevices.splice(index, 1);
    } else {
      this.selectedDevices.push(deviceId);
    }
  }

  isDeviceSelected(deviceId: number): boolean {
    return this.selectedDevices.includes(deviceId);
  }

  onSubmit(): void {
    if (this.bookingForm.invalid || !this.roomId) {
      return;
    }

    const formValue = this.bookingForm.value;
    const bookingDate = new Date(formValue.bookingDate);

    // Parse start and end times
    const [startHour, startMinute] = formValue.startTime.split(':').map(Number);
    const [endHour, endMinute] = formValue.endTime.split(':').map(Number);

    const startTime = new Date(bookingDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(bookingDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    const booking: BookingRequest = {
      roomId: this.roomId,
      userId: formValue.userId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      deviceIds: this.selectedDevices.length > 0 ? this.selectedDevices : undefined
    };

    this.submitting = true;
    this.error = null;

    this.bookingService.createBooking(booking).subscribe({
      next: (response) => {
        this.submitting = false;
        this.snackBar.open('Booking created successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.message;
        this.snackBar.open('Failed to create booking', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  goBack(): void {
    if (this.workspaceId) {
      this.router.navigate(['/workspace', this.workspaceId]);
    } else {
      this.router.navigate(['/']);
    }
  }
}

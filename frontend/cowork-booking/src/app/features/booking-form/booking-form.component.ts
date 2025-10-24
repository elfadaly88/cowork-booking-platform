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
import { Room, Device } from '../../core/models/workspace.model';
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
  room: Room | null = null;
  availableDevices: Device[] = [];
  selectedDevices: number[] = [];

  loading = false;
  submitting = false;
  error: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('roomId');
    if (id) {
      this.roomId = +id;
      this.loadRoomDetails();
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
    // In a real app, you'd fetch room details from an API
    // For now, we'll set availableDevices when room data is available
    this.loading = true;
    this.error = null;

    // Simulating: you could extend WorkspaceService to have getRoomById
    // or embed room details in the route state
    // For this demo, we'll use a placeholder
    this.room = {
      id: this.roomId!,
      name: `Room ${this.roomId}`,
      capacity: 10,
      pricePerHour: 100,
      devices: []
    };
    this.availableDevices = this.room.devices || [];
    this.loading = false;
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
    this.router.navigate(['/']);
  }
}

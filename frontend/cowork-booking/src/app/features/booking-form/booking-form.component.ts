import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { Subject, of, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
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
export class BookingFormComponent implements OnInit, OnDestroy {
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
  timeOptions: string[] = [];

  loading = false;
  submitting = false;
  error: string | null = null;
  conflictError: string | null = null;
  checkingAvailability = false;
  private readonly destroy$ = new Subject<void>();

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

    this.generateTimeOptions();
    this.initForm();
    this.setupAvailabilityCheck();
  }

  generateTimeOptions(): void {
    this.timeOptions = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0');
        const min = m.toString().padStart(2, '0');
        this.timeOptions.push(`${hour}:${min}`);
      }
    }
  }

  initForm(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Use local date components — toISOString() converts to UTC and can
    // produce yesterday's date for users east of UTC (e.g. UTC+2 at midnight).
    const pad = (n: number) => n.toString().padStart(2, '0');
    const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

    this.bookingForm = this.fb.group({
      bookingDate: [tomorrowStr, Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required]
      // userId is extracted from JWT on the backend — never sent from client
    }, { validators: this.timeValidator });
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
        // Re-run the schedule validator now that workspace data is available,
        // so a non-working default date is flagged immediately without user interaction.
        this.bookingForm?.updateValueAndValidity();
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

  timeValidator = (group: FormGroup) => {
    const dateStr = group.get('bookingDate')?.value;
    const startStr = group.get('startTime')?.value;
    const endStr = group.get('endTime')?.value;

    if (!dateStr || !startStr || !endStr) return null;

    const bookingDate = this.parseLocalDate(dateStr);
    const now = new Date();

    const [startHour, startMinute] = startStr.split(':').map(Number);
    const [endHour, endMinute] = endStr.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    const errors: any = {};

    if (endMinutes <= startMinutes) {
      errors.endTimeBeforeStartTime = true;
    }

    // Check if start time is in the past when booking today
    if (bookingDate.toDateString() === now.toDateString()) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMinutes <= currentMinutes) {
        errors.startTimeInPast = true;
      }
    }

    // Workspace schedule validation
    if (this.workspace && this.workspace.currentSchedulePeriod) {
      const dayOfWeekInt = bookingDate.getDay();
      const sched = this.workspace.currentSchedulePeriod.schedules.find((s: any) => {
          if (typeof s.dayOfWeek === 'number' || !isNaN(Number(s.dayOfWeek))) {
              return Number(s.dayOfWeek) === dayOfWeekInt;
          }
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return s.dayOfWeek === days[dayOfWeekInt] || s.dayOfWeek.toLowerCase() === days[dayOfWeekInt].toLowerCase();
      });

      if (!sched) {
         errors.notScheduled = true;
      } else if (sched.isWeekend) {
         errors.isWeekend = true;
      } else if (sched.openTime && sched.closeTime) {
         const openParts = sched.openTime.split(':').map(Number);
         const closeParts = sched.closeTime.split(':').map(Number);
         const openMinutes = openParts[0] * 60 + openParts[1];
         // CloseTime might be 00:00:00 (which is midnight). If closeTime is 0, we can interpret it as 24:00 (1440 minutes).
         const closeMinutes = (closeParts[0] === 0 && closeParts[1] === 0) ? 1440 : (closeParts[0] * 60 + closeParts[1]);

         if (startMinutes < openMinutes || endMinutes > closeMinutes) {
            errors.outsideWorkingHours = true;
         }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Reactively checks room availability whenever date/time changes (debounced 500 ms). */
  private setupAvailabilityCheck(): void {
    this.bookingForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((a, b) =>
        a.bookingDate === b.bookingDate &&
        a.startTime === b.startTime &&
        a.endTime === b.endTime
      ),
      switchMap(values => {
        const { bookingDate, startTime, endTime } = values;
        if (!bookingDate || !startTime || !endTime || !this.roomId) {
          this.conflictError = null;
          return of(null);
        }

        const [sh, sm] = (startTime as string).split(':').map(Number);
        const [eh, em] = (endTime as string).split(':').map(Number);
        // Don't call API when end <= start (timeValidator handles that error)
        if (eh * 60 + em <= sh * 60 + sm) {
          this.conflictError = null;
          return of(null);
        }

        const parts = String(bookingDate).split('-').map(Number);
        const start = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1, sh, sm, 0, 0);
        const end   = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1, eh, em, 0, 0);

        this.checkingAvailability = true;
        this.conflictError = null;
        return this.bookingService.checkAvailability(
          this.roomId!,
          this.toLocalISOString(start),
          this.toLocalISOString(end)
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: result => {
        this.checkingAvailability = false;
        if (result === null) return;
        this.conflictError = result.available ? null : result.message;
      },
      error: () => {
        // Silently swallow availability-check network errors;
        // the backend's create endpoint will still enforce the constraint.
        this.checkingAvailability = false;
      }
    });
  }

  private parseLocalDate(dateStr: string): Date {
    // Expecting `YYYY-MM-DD` from the date input. Construct a local Date
    // using numeric components to avoid Date parsing as UTC which can
    // introduce timezone shifts when later converting to ISO strings.
    if (!dateStr) return new Date();
    const parts = String(dateStr).split('-').map(Number);
    const year = parts[0] || new Date().getFullYear();
    const month = (parts[1] || 1) - 1; // JS months are 0-based
    const day = parts[2] || 1;
    return new Date(year, month, day);
  }

  /**
   * Formats a Date as a local ISO-8601 string WITHOUT a UTC offset ("Z").
   * e.g. 2026-03-26T09:00:00
   *
   * Using `.toISOString()` would convert to UTC first, so a local 09:00
   * in UTC+2 would become "07:00Z" — the backend stores that shifted value.
   * Sending a string without the Z causes ASP.NET to parse it as
   * DateTimeKind.Unspecified and store the exact value the user chose.
   */
  private toLocalISOString(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
           `T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  }

  /** Local YYYY-MM-DD string used as the [min] attribute of the date input. */
  get minDateStr(): string {
    const d = this.minDate;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  getDayName(day: any): string {
    if (typeof day === 'number' || !isNaN(Number(day))) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[Number(day)] || '';
    }
    return String(day);
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
    if (this.bookingForm.invalid || !this.roomId || this.conflictError || this.checkingAvailability) {
      return;
    }

    const formValue = this.bookingForm.value;

    // Build local Date objects from the date string and selected times. This
    // prevents creating a Date from an ISO date-only string which some engines
    // parse as UTC and leads to timezone offsets when serializing with
    // `toISOString()` (observed as a -2 hour shift for UTC+2 clients).
    const dateParts = String(formValue.bookingDate).split('-').map(Number);
    const year = dateParts[0];
    const month = (dateParts[1] || 1) - 1;
    const day = dateParts[2] || 1;

    const [startHour, startMinute] = formValue.startTime.split(':').map(Number);
    const [endHour, endMinute] = formValue.endTime.split(':').map(Number);

    const startTime = new Date(year, month, day, startHour, startMinute, 0, 0);
    const endTime = new Date(year, month, day, endHour, endMinute, 0, 0);

    const booking: BookingRequest = {
      roomId: this.roomId,
      startTime: this.toLocalISOString(startTime),
      endTime: this.toLocalISOString(endTime),
      totalPrice: this.totalPrice,
      deviceIds: this.selectedDevices.length > 0 ? this.selectedDevices : undefined
    };

    this.submitting = true;
    this.error = null;

    this.bookingService.createBooking(booking).subscribe({
      next: (response) => {
        this.submitting = false;

        let newBookingId = (response as any)?.id;

        if (newBookingId) {
          this.router.navigate(['/booking', newBookingId, 'payment']);
        } else {
          this.snackBar.open('Booking created successfully! View it in My Bookings.', 'My Bookings', {
            duration: 5000,
            panelClass: ['success-snackbar']
          }).onAction().subscribe(() => this.router.navigate(['/my-bookings']));
          this.router.navigate(['/workspaces']);
        }
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
      this.router.navigate(['/workspaces']);
    }
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace, WorkspaceSchedulePeriod, WorkspaceSchedule } from '../../core/models/workspace.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-schedule-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './schedule-management.component.html',
  styleUrls: ['./schedule-management.component.scss']
})
export class ScheduleManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly router = inject(Router);

  workspaces = signal<Workspace[]>([]);
  selectedWorkspace = signal<Workspace | null>(null);
  scheduleForm!: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadWorkspaces();
  }

  private initForm(): void {
    this.scheduleForm = this.fb.group({
      workspaceId: [null, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      schedules: this.fb.array([])
    });

    // Initialize with all 7 days after form is created
    this.initializeDays();
  }

  private initializeDays(): void {
    // Clear any existing schedules
    while (this.schedules.length) {
      this.schedules.removeAt(0);
    }

    // Add all 7 days
    this.daysOfWeek.forEach(day => {
      this.addDaySchedule(day.value, day.label);
    });
  }

  get schedules(): FormArray {
    return this.scheduleForm.get('schedules') as FormArray;
  }

  private addDaySchedule(dayOfWeek: number, dayLabel: string): void {
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday and Saturday
    const scheduleGroup = this.fb.group({
      dayOfWeek: [dayOfWeek, Validators.required],
      dayLabel: [dayLabel],
      isWeekend: [isWeekend],
      openTime: [isWeekend ? '' : '09:00'],
      closeTime: [isWeekend ? '' : '18:00']
    });
    this.schedules.push(scheduleGroup);
  }

  loadWorkspaces(): void {
    this.isLoading.set(true);
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

  onWorkspaceChange(value: any): void {
    const workspaceId = value ? parseInt(value, 10) : null;
    if (!workspaceId) {
      this.selectedWorkspace.set(null);
      return;
    }

    const workspace = this.workspaces().find(w => w.id === workspaceId);
    this.selectedWorkspace.set(workspace || null);
    this.loadExistingSchedule(workspaceId);
  }

  loadExistingSchedule(workspaceId: number): void {
    this.isLoading.set(true);
    this.workspaceService.getActiveSchedule(workspaceId).subscribe({
      next: (schedule) => {
        if (schedule) {
          this.populateScheduleForm(schedule);
        }
        this.isLoading.set(false);
      },
      error: () => {
        // No existing schedule, keep default values
        this.isLoading.set(false);
      }
    });
  }

  private populateScheduleForm(period: WorkspaceSchedulePeriod): void {
    this.scheduleForm.patchValue({
      startDate: period.startDate?.toString().split('T')[0],
      endDate: period.endDate?.toString().split('T')[0]
    });

    // Clear and rebuild schedules
    while (this.schedules.length) {
      this.schedules.removeAt(0);
    }

    if (period.schedules && period.schedules.length > 0) {
      // Sort by day of week to ensure correct order
      const sortedSchedules = [...period.schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      sortedSchedules.forEach(schedule => {
        const dayLabel = this.daysOfWeek.find(d => d.value === schedule.dayOfWeek)?.label || '';
        const scheduleGroup = this.fb.group({
          dayOfWeek: [schedule.dayOfWeek, Validators.required],
          dayLabel: [dayLabel],
          isWeekend: [schedule.isWeekend],
          openTime: [schedule.openTime || '09:00'],
          closeTime: [schedule.closeTime || '18:00']
        });
        this.schedules.push(scheduleGroup);
      });
    } else {
      // If no schedules exist, initialize with defaults
      this.initializeDays();
    }
  }

  toggleWeekend(index: number): void {
    const schedule = this.schedules.at(index);
    const isWeekend = schedule.get('isWeekend')?.value;
    schedule.patchValue({ isWeekend: !isWeekend });
  }

  applyToAllWeekdays(): void {
    const firstWeekday = this.schedules.controls.find(control => !control.get('isWeekend')?.value);
    if (!firstWeekday) return;

    const openTime = firstWeekday.get('openTime')?.value;
    const closeTime = firstWeekday.get('closeTime')?.value;

    this.schedules.controls.forEach(control => {
      if (!control.get('isWeekend')?.value) {
        control.patchValue({ openTime, closeTime });
      }
    });
    this.successMessage.set('Applied times to all weekdays');
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  onSubmit(): void {
    if (this.scheduleForm.invalid) {
      this.errorMessage.set('Please fill all required fields');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formData = this.scheduleForm.value;
    const workspaceId = formData.workspaceId;

    const scheduleData: WorkspaceSchedulePeriod = {
      workspaceId: workspaceId,
      startDate: formData.startDate, // Already ISO string from date input
      endDate: formData.endDate, // Already ISO string from date input
      schedules: formData.schedules.map((schedule: any) => ({
        dayOfWeek: schedule.dayOfWeek,
        isWeekend: schedule.isWeekend,
        openTime: schedule.isWeekend ? null : schedule.openTime,
        closeTime: schedule.isWeekend ? null : schedule.closeTime
      }))
    };

    this.workspaceService.addOrReplaceSchedule(workspaceId, scheduleData).subscribe({
      next: () => {
        this.successMessage.set('Schedule saved successfully!');
        this.isLoading.set(false);
        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 2000);
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Failed to save schedule');
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}

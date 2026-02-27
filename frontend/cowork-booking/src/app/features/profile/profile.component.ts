import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly http = inject(HttpClient);

    currentUser = this.authService.currentUser;
    loading = signal(false);
    savingProfile = signal(false);
    savingPassword = signal(false);
    profileSuccess = signal<string | null>(null);
    profileError = signal<string | null>(null);
    passwordSuccess = signal<string | null>(null);
    passwordError = signal<string | null>(null);
    showCurrentPw = signal(false);
    showNewPw = signal(false);
    showConfirmPw = signal(false);
    activeTab = signal<'profile' | 'password' | 'preferences'>('profile');

    profileForm!: FormGroup;
    passwordForm!: FormGroup;

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }
        const user = this.currentUser();
        this.profileForm = this.fb.group({
            firstName: [user?.firstName ?? '', [Validators.required, Validators.minLength(2)]],
            lastName: [user?.lastName ?? '', [Validators.required, Validators.minLength(2)]],
            email: [user?.email ?? '', [Validators.required, Validators.email]],
            phone: [user?.phone ?? ''],
        });

        this.passwordForm = this.fb.group({
            currentPassword: ['', [Validators.required, Validators.minLength(6)]],
            newPassword: ['', [Validators.required, Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(g: AbstractControl) {
        const pw = g.get('newPassword')?.value;
        const confirm = g.get('confirmPassword')?.value;
        return pw === confirm ? null : { mismatch: true };
    }

    saveProfile(): void {
        if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
        this.savingProfile.set(true);
        this.profileError.set(null);

        const payload = this.profileForm.value;
        this.http.put(`${environment.apiBaseUrl}/auth/profile`, payload).subscribe({
            next: (res: any) => {
                this.savingProfile.set(false);
                this.profileSuccess.set('Profile updated successfully!');
                // Update cached user
                if (res?.user) {
                    localStorage.setItem('auth_user', JSON.stringify(res.user));
                    window.location.reload(); // refresh signals
                }
                setTimeout(() => this.profileSuccess.set(null), 4000);
            },
            error: (err) => {
                this.savingProfile.set(false);
                this.profileError.set(err?.error?.message ?? 'Failed to update profile. Please try again.');
            }
        });
    }

    changePassword(): void {
        if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
        this.savingPassword.set(true);
        this.passwordError.set(null);

        const payload = {
            currentPassword: this.passwordForm.value.currentPassword,
            newPassword: this.passwordForm.value.newPassword
        };
        this.http.post(`${environment.apiBaseUrl}/auth/change-password`, payload).subscribe({
            next: () => {
                this.savingPassword.set(false);
                this.passwordSuccess.set('Password changed successfully!');
                this.passwordForm.reset();
                setTimeout(() => this.passwordSuccess.set(null), 4000);
            },
            error: (err) => {
                this.savingPassword.set(false);
                this.passwordError.set(err?.error?.message ?? 'Failed to change password. Please check your current password.');
            }
        });
    }

    getUserInitials(): string {
        const u = this.currentUser();
        const f = u?.firstName?.[0] ?? '';
        const l = u?.lastName?.[0] ?? '';
        return (f + l).toUpperCase() || (u?.email?.[0]?.toUpperCase() ?? '?');
    }

    getRoleLabel(): string {
        const r = this.currentUser()?.roles ?? [];
        if (r.includes('Admin')) return '🛡️ Administrator';
        if (r.includes('Owner')) return '🏢 Space Owner';
        return '👤 Member';
    }

    isInvalid(form: FormGroup, field: string): boolean {
        const c = form.get(field);
        return !!(c && c.invalid && (c.dirty || c.touched));
    }

    goBack(): void { this.router.navigate(['/workspaces']); }
}

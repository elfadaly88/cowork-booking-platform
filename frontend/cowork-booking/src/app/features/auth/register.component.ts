import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

// Custom validator for password match
function passwordMatchValidator(g: FormGroup) {
  const password = g.get('password')?.value;
  const confirmPassword = g.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordStrength = signal<'weak' | 'medium' | 'strong' | null>(null);
  passwordRequirements = signal({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecialChar: false
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      userType: ['User', [Validators.required]]
    }, { validators: passwordMatchValidator });

    // Watch password changes for validation
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.validatePassword(password);
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        this.isLoading.set(false);

        // If owner account, show approval pending message and redirect to login
        if (response.user.roles.includes('Owner') && !response.user.isApproved) {
          Swal.fire({
            icon: 'success',
            title: 'Registration successful!',
            text: 'Your owner account is pending admin approval. You will be notified once approved.'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Registration failed', error);
        this.isLoading.set(false);
        const errorMsg = error.error?.message || 'Registration failed. Please try again.';
        const errors = error.error?.errors;
        if (errors && Array.isArray(errors)) {
          this.errorMessage.set(`${errorMsg}: ${errors.join(', ')}`);
        } else {
          this.errorMessage.set(errorMsg);
        }
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Must be at least ${minLength} characters`;
    }
    if (fieldName === 'confirmPassword' && this.registerForm.hasError('mismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  validatePassword(password: string): void {
    if (!password) {
      this.passwordStrength.set(null);
      this.passwordRequirements.set({
        minLength: false,
        hasNumber: false,
        hasLetter: false,
        hasSpecialChar: false
      });
      return;
    }

    // Check requirements
    const requirements = {
      minLength: password.length >= 6,
      hasNumber: /\d/.test(password),
      hasLetter: /[a-zA-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    this.passwordRequirements.set(requirements);

    // Calculate strength
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    if (metRequirements <= 2) {
      this.passwordStrength.set('weak');
    } else if (metRequirements === 3) {
      this.passwordStrength.set('medium');
    } else {
      this.passwordStrength.set('strong');
    }
  }

  getPasswordStrengthColor(): string {
    const strength = this.passwordStrength();
    if (strength === 'weak') return '#e53e3e';
    if (strength === 'medium') return '#dd6b20';
    if (strength === 'strong') return '#38a169';
    return '#e2e8f0';
  }

  getPasswordStrengthWidth(): string {
    const strength = this.passwordStrength();
    if (strength === 'weak') return '33%';
    if (strength === 'medium') return '66%';
    if (strength === 'strong') return '100%';
    return '0%';
  }
}

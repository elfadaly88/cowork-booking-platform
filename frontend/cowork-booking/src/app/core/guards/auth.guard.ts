import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // If token is missing, null, or empty string, redirect to login
  if (token && token.trim() !== '') {
    return true;
  }

  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Admin Guard - Protects routes that require Admin role
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Redirect to home or unauthorized page
  router.navigate(['/']);
  return false;
};

/**
 * Owner Guard - Protects routes that require Owner role
 */
export const ownerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isOwner()) {
    return true;
  }

  // Redirect to home or unauthorized page
  router.navigate(['/']);
  return false;
};

/**
 * Guest Guard - Redirects authenticated users away from login/register pages
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect authenticated users based on their role
  if (authService.isAdmin()) {
    router.navigate(['/admin']);
  } else if (authService.isOwner()) {
    router.navigate(['/owner/dashboard']);
  } else {
    router.navigate(['/']);
  }
  return false;
};

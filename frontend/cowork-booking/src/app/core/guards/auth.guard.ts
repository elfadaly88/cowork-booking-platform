import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

// ─── Helper: validate JWT expiry without a library ──────────────────────────
function isTokenExpired(token: string): boolean {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Base64URL decode the payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // 'exp' is seconds since Unix epoch
    if (!payload.exp) return false; // no expiry claim = treat as valid
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp < nowSec; // true = expired
  } catch {
    return true; // malformed token → treat as expired
  }
}

/**
 * Auth Guard - Protects routes that require authentication
 * ✅ FIX #2 — validates token is present AND not expired
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Check token exists and is not expired
  if (token && token.trim() !== '' && !isTokenExpired(token)) {
    return true;
  }

  // Token missing or expired → clean up and redirect
  if (token) {
    authService.logout(); // clear stale/expired token
  }

  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Admin Guard - Protects routes that require Admin role
 * ✅ FIX #2 — also checks token validity
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token && !isTokenExpired(token) && authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  router.navigate(['/']);
  return false;
};

/**
 * Owner Guard - Protects routes that require Owner role
 * ✅ FIX #2 — also checks token validity
 */
export const ownerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token && !isTokenExpired(token) && authService.isAuthenticated() && authService.isOwner()) {
    return true;
  }

  router.navigate(['/']);
  return false;
};

/**
 * Guest Guard - Redirects authenticated users away from login/register pages
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // If user has a valid (non-expired) token, they're authenticated
  if (!authService.isAuthenticated() || !token || isTokenExpired(token)) {
    // Clean up expired token silently
    if (token && isTokenExpired(token)) {
      authService.logout();
    }
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

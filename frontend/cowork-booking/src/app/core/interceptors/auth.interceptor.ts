import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Clone request and add Authorization header if token exists and is not empty
  if (token && token.trim() !== '') {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // Handle 401 Unauthorized - token expired or invalid
      // ⚠️ Skip if this IS the logout request — avoids triggering logout() recursively
      const isLogoutRequest = req.url.includes('/auth/logout');
      if (error.status === 401 && !isLogoutRequest) {
        console.error('Unauthorized request - logging out');
        authService.logout(); // AuthService.isLoggingOut guard also protects here
      }
      return throwError(() => error);
    })
  );
};

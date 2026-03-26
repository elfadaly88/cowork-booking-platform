import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
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
      // Handle 401: attempt token refresh once, then retry original request.
      const isLogoutRequest = req.url.includes('/auth/logout');
      const isRefreshRequest = req.url.includes('/auth/refresh');
      const isLoginRequest = req.url.includes('/auth/login');
      const isRegisterRequest = req.url.includes('/auth/register');

      if (error.status === 401 && !isLogoutRequest && !isRefreshRequest && !isLoginRequest && !isRegisterRequest) {
        return authService.refreshAccessToken().pipe(
          switchMap((response) => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.token}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

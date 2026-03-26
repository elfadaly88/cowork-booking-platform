import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, finalize, shareReplay } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiBaseUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';
  private readonly EXPIRES_AT_KEY = 'auth_expires_at';

  // Re-entrancy guard — prevents logout() from being called while already logging out
  private isLoggingOut = false;
  private sessionTimerId: ReturnType<typeof setInterval> | null = null;
  private refreshRequest$: Observable<AuthResponse> | null = null;

  // Signals for reactive state
  private currentUserSignal = signal<User | null>(this.getUserFromStorage());
  private tokenSignal = signal<string | null>(this.getTokenFromStorage());
  private expiresAtSignal = signal<number | null>(this.getExpiresAtFromStorage());
  private nowSignal = signal<number>(Date.now());

  // Computed signals
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.tokenSignal());
  isAdmin = computed(() => this.currentUserSignal()?.roles.includes('Admin') ?? false);
  isOwner = computed(() => this.currentUserSignal()?.roles.includes('Owner') ?? false);
  sessionRemainingSeconds = computed(() => {
    const expiresAt = this.expiresAtSignal();
    if (!expiresAt) return 0;
    const remaining = Math.floor((expiresAt - this.nowSignal()) / 1000);
    return Math.max(0, remaining);
  });
  sessionCountdown = computed(() => {
    const total = this.sessionRemainingSeconds();
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeSessionTimer();
  }

  /**
   * Login user and store token
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user info from server
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`).pipe(
      tap(user => {
        this.currentUserSignal.set(user);
        this.saveUserToStorage(user);
      }),
      catchError(error => {
        console.error('Get current user error:', error);
        // ⚠️ Do NOT call logout() here — it would trigger the interceptor
        // which would call logout() again (infinite loop). Let the interceptor handle 401.
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Re-entrancy guard — prevent infinite loop if logout HTTP call itself triggers a 401
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    const refreshToken = this.getRefreshToken();

    // ✅ Clear local state FIRST — before the HTTP call —
    // so the interceptor won't attach a stale token to the logout request
    this.clearAuth();

    // Notify backend (fire-and-forget, don't trigger another logout on error)
    this.http.post(`${this.API_URL}/logout`, { refreshToken }).subscribe({
      next: () => console.log('Logged out from server'),
      error: (err) => console.warn('Backend logout notification failed (ignored):', err)
    });

    this.isLoggingOut = false;
    this.router.navigate(['/login']);
  }

  /**
   * Get token for HTTP requests
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  refreshAccessToken(): Observable<AuthResponse> {
    if (this.refreshRequest$) return this.refreshRequest$;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    this.refreshRequest$ = this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(response => this.handleAuthResponse(response)),
      finalize(() => {
        this.refreshRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshRequest$;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return user?.roles.includes(role) ?? false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserSignal();
    return roles.some(role => user?.roles.includes(role)) ?? false;
  }

  /**
   * Get pending owner accounts (Admin only)
   */
  getPendingOwners(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/pending-owners`);
  }

  /**
   * Approve or reject owner account (Admin only)
   */
  approveOwner(userId: string, approve: boolean): Observable<any> {
    return this.http.post(`${this.API_URL}/approve-owner/${userId}`, approve);
  }

  /**
   * Handle successful authentication response
   */
  private handleAuthResponse(response: AuthResponse): void {
    this.tokenSignal.set(response.token);
    this.currentUserSignal.set(response.user);
    this.expiresAtSignal.set(new Date(response.expiresAt).getTime());
    this.saveTokenToStorage(response.token);
    this.saveRefreshTokenToStorage(response.refreshToken);
    this.saveUserToStorage(response.user);
    this.saveExpiresAtToStorage(response.expiresAt);
  }

  /**
   * Clear authentication state
   */
  private clearAuth(): void {
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.expiresAtSignal.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  private initializeSessionTimer(): void {
    this.pruneExpiredSession();

    this.sessionTimerId = setInterval(() => {
      this.nowSignal.set(Date.now());

      if (this.tokenSignal() && this.sessionRemainingSeconds() <= 0) {
        this.logout();
      }
    }, 1000);
  }

  private pruneExpiredSession(): void {
    const expiresAt = this.expiresAtSignal();
    if (!expiresAt) return;

    if (Date.now() >= expiresAt) {
      this.clearAuth();
    }
  }

  // Storage helpers
  private getTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private saveTokenToStorage(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private saveRefreshTokenToStorage(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  private getExpiresAtFromStorage(): number | null {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    if (!expiresAt) return null;

    const parsed = new Date(expiresAt).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  private saveExpiresAtToStorage(expiresAt: string): void {
    localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}

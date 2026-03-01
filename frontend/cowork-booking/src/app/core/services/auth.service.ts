import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiBaseUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // Re-entrancy guard — prevents logout() from being called while already logging out
  private isLoggingOut = false;

  // Signals for reactive state
  private currentUserSignal = signal<User | null>(this.getUserFromStorage());
  private tokenSignal = signal<string | null>(this.getTokenFromStorage());

  // Computed signals
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.tokenSignal());
  isAdmin = computed(() => this.currentUserSignal()?.roles.includes('Admin') ?? false);
  isOwner = computed(() => this.currentUserSignal()?.roles.includes('Owner') ?? false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

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

    // ✅ Clear local state FIRST — before the HTTP call —
    // so the interceptor won't attach a stale token to the logout request
    this.clearAuth();

    // Notify backend (fire-and-forget, don't trigger another logout on error)
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({
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
    this.saveTokenToStorage(response.token);
    this.saveUserToStorage(response.user);
  }

  /**
   * Clear authentication state
   */
  private clearAuth(): void {
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Storage helpers
  private getTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private saveTokenToStorage(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}

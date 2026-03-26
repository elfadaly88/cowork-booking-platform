
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <a routerLink="/" class="navbar-brand">
          <span class="brand-icon">🏢</span>
          <span class="brand-text">Cowork Booking</span>
        </a>

        <div class="navbar-menu">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link home-link" *ngIf="!authService.isOwner()">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Home</span>
          </a>
          <a routerLink="/owner/dashboard" routerLinkActive="active" class="nav-link" *ngIf="authService.isOwner()">
            <span class="nav-icon">🏢</span>
            <span class="nav-text">My Workspaces</span>
          </a>
          <a routerLink="/admin" routerLinkActive="active" class="nav-link" *ngIf="authService.isAdmin()">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Admin Panel</span>
          </a>

          <!-- ─── User info chip ──────────────────────────────────────── -->
          <div class="user-chip" *ngIf="authService.isAuthenticated() && authService.currentUser() as user">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-info">
              <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
              <span class="user-role">{{ roleLabel() }}</span>
            </div>
          </div>

          <div class="session-chip" *ngIf="authService.isAuthenticated()" title="Session remaining time">
            <span class="session-label">Session</span>
            <span class="session-time">{{ authService.sessionCountdown() }}</span>
          </div>

          <button class="logout-btn" (click)="logout()" *ngIf="authService.isAuthenticated()" aria-label="Logout">
            <span class="nav-icon svg-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="nav-text">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
        background-color: #ffffff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        position: relative;
        width: 100%;
        border-bottom: 1px solid #e2e8f0;
    }

    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #0f172a;
      font-size: 1.25rem;
      font-weight: 800;
      transition: opacity 0.2s;
      letter-spacing: -0.025em;
    }

    .navbar-brand:hover { opacity: 0.8; }

    .brand-icon {
      font-size: 1.5rem;
      display: flex;
      align-items: center;
    }

    .brand-text { display: none; }

    @media (min-width: 640px) {
      .brand-text { display: inline; }
    }

    .navbar-menu {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      border-radius: 0.5rem;
      text-decoration: none;
      color: #475569;
      font-weight: 500;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .nav-link:hover {
      background: #f8fafc;
      color: #0f172a;
    }

    .nav-link.active {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }

    .nav-icon {
      font-size: 1rem;
      display: flex;
      align-items: center;
      line-height: 1;
    }

    .nav-text { display: inline; }

    @media (max-width: 640px) {
      .navbar-container { padding: 1rem; }
      .nav-link { padding: 0.5rem; }
      .nav-text { display: none; }
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      border-radius: 0.5rem;
      text-decoration: none;
      color: #e11d48;
      font-weight: 500;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      background: transparent;
      border: 1px solid #ffe4e6;
      cursor: pointer;
      font-size: 0.875rem;
      margin-left: 0.5rem;
    }

    .logout-btn:hover {
      background: #fff1f2;
      color: #be123c;
      border-color: #fecdd3;
    }

    .logout-btn:active { transform: translateY(0); }

    .svg-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ─── User chip ─────────────────────────────────────────────────── */
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.35rem 0.85rem 0.35rem 0.35rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      cursor: default;
      margin-right: 0.25rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.03em;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .user-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
    }

    .user-role {
      font-size: 0.7rem;
      color: #6366f1;
      font-weight: 500;
    }

    .session-chip {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #0f172a;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
      margin-right: 0.25rem;
      white-space: nowrap;
    }

    .session-label {
      color: #64748b;
      font-weight: 500;
    }

    .session-time {
      font-variant-numeric: tabular-nums;
      color: #0f172a;
    }

    @media (max-width: 640px) {
      .user-info { display: none; }
      .user-chip { padding: 0.25rem; background: transparent; border-color: transparent; }
      .session-label { display: none; }
      .session-chip { padding: 0.35rem 0.5rem; margin-right: 0; }
      .logout-btn { padding: 0.5rem; margin-left: 0; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);

  initials = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return '';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  roleLabel = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return '';
    if (u.roles?.includes('Admin')) return 'Admin';
    if (u.roles?.includes('Owner')) return 'Owner';
    return 'Member';
  });

  logout(): void {
    this.authService.logout();
  }
}

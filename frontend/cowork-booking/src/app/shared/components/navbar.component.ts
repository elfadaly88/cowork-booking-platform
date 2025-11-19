
import { Component, inject } from '@angular/core';
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
            <button class="logout-btn" (click)="logout()" *ngIf="authService.isAuthenticated()" aria-label="Logout">
              <span class="nav-icon svg-icon" aria-hidden="true">
                <!-- simple logout SVG -->
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
        background: linear-gradient(90deg, rgba(37,99,235,0.08) 0%, rgba(220,38,38,0.06) 100%);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        position: relative;
        width: 100%;
      border-bottom: 1px solid rgba(15,23,42,0.04);
    }

    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.5rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      text-decoration: none;
      color: #0f172a;
      font-size: 1.125rem;
      font-weight: 700;
      transition: opacity 0.2s;
    }

    .navbar-brand:hover { opacity: 0.9; }

    .brand-icon {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
    }

    .brand-text { display: none; }

    @media (min-width: 640px) {
      .brand-text { display: inline; }
    }

    .navbar-menu {
      display: flex;
      gap: 0.625rem;
      align-items: center;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      color: white;
      font-weight: 500;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      cursor: pointer;
      font-size: 0.8125rem;
      white-space: nowrap;
    }

    /* Make home button more visible */
    .home-link {
      background: rgba(37,99,235,0.08);
      color: #0f172a;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(37,99,235,0.06);
    }

    .home-link::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 18px;
      background: #2563EB;
      border-radius: 2px;
      margin-right: 6px;
      vertical-align: middle;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      padding: 0.4rem 0.8rem;
    }

    .nav-link.active {
      color: #0f172a;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      font-weight: 600;
    }

    .nav-icon {
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      line-height: 1;
    }

    .nav-text { display: inline; font-size: 0.85rem; }

    @media (max-width: 640px) {
      .navbar-container { padding: 1rem; }
      .nav-link { padding: 0.5rem 0.75rem; }
      .nav-text { display: none; }
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.35rem 0.6rem;
      border-radius: 6px;
      text-decoration: none;
      color: #0f172a;
      font-weight: 500;
      transition: all 0.3s ease;
      background: rgba(220, 38, 38, 0.9);
      cursor: pointer;
      font-size: 0.8125rem;
    }

    .logout-btn:hover {
      background: rgba(185, 28, 28, 1);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .logout-btn:active { transform: translateY(0); }

    @media (max-width: 640px) {
      .logout-btn { padding: 0.5rem 0.75rem; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}


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
    
    @media (max-width: 640px) {
      .logout-btn { padding: 0.5rem; margin-left: 0; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}

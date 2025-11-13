
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
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" *ngIf="!authService.isOwner()">
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
          <button class="logout-btn" (click)="logout()" *ngIf="authService.isAuthenticated()">
            <span class="nav-icon">🚪</span>
            <span class="nav-text">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      width: 100%;
      z-index: 1000;
    }

    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.9;
      }
    }

    .brand-icon {
      font-size: 2rem;
      display: flex;
      align-items: center;
    }

    .brand-text {
      display: none;

      @media (min-width: 640px) {
        display: inline;
      }
    }

    .navbar-menu {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      text-decoration: none;
      color: white;
      font-weight: 500;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      cursor: pointer;
      font-size: 0.95rem;
      white-space: nowrap;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &.active {
        background: rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        font-weight: 600;
      }
    }

    .nav-icon {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      line-height: 1;
    }

    .nav-text {
      display: inline;
    }

    @media (max-width: 640px) {
      .navbar-container {
        padding: 1rem;
      }

      .nav-link {
        padding: 0.5rem 0.75rem;
      }

      .nav-text {
        display: none;
      }
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      text-decoration: none;
      color: white;
      font-weight: 500;
      transition: all 0.3s ease;
      background: rgba(231, 76, 60, 0.9);
      border: none;
      cursor: pointer;
      font-size: 0.95rem;
      white-space: nowrap;

      &:hover {
        background: rgba(192, 57, 43, 1);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      &:active {
        transform: translateY(0);
      }
    }

    @media (max-width: 640px) {
      .logout-btn {
        padding: 0.5rem 0.75rem;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}

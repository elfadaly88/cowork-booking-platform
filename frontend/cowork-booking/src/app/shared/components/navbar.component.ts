import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
            <span class="nav-icon">🏠</span>
            Home
          </a>
          <a routerLink="/admin" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">⚙️</span>
            Admin Panel
          </a>
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
      z-index: 1000;
    }

    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      text-decoration: none;
      color: white;
      font-weight: 500;
      transition: all 0.2s;
      background: rgba(255, 255, 255, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }

      &.active {
        background: rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    }

    .nav-icon {
      font-size: 1.2rem;
    }

    @media (max-width: 640px) {
      .navbar-container {
        padding: 1rem;
      }

      .nav-link span:not(.nav-icon) {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="right-sidebar" [class.collapsed]="isCollapsed">
      <div class="toggle-area">
        <button class="collapse-toggle" (click)="toggleCollapse()" aria-label="Toggle right menu">
          <span *ngIf="!isCollapsed">➡️</span>
          <span *ngIf="isCollapsed">⬅️</span>
        </button>
      </div>

      <nav class="rs-nav">
        <a routerLink="/" routerLinkActive="active" class="rs-item">
          <span class="icon">🏠</span>
          <span class="label" *ngIf="!isCollapsed">Home</span>
        </a>

        <a routerLink="/workspaces" routerLinkActive="active" class="rs-item" *ngIf="auth.isAuthenticated()">
          <span class="icon">📋</span>
          <span class="label" *ngIf="!isCollapsed">Workspaces</span>
        </a>

        <a routerLink="/owner/dashboard" routerLinkActive="active" class="rs-item" *ngIf="auth.isOwner()">
          <span class="icon">🏢</span>
          <span class="label" *ngIf="!isCollapsed">My Workspaces</span>
        </a>

        <a routerLink="/admin" routerLinkActive="active" class="rs-item" *ngIf="auth.isAdmin()">
          <span class="icon">⚙️</span>
          <span class="label" *ngIf="!isCollapsed">Admin Panel</span>
        </a>

        <a routerLink="/create-workspace" routerLinkActive="active" class="rs-item" *ngIf="auth.isOwner() || auth.isAdmin()">
          <span class="icon">➕</span>
          <span class="label" *ngIf="!isCollapsed">Create Workspace</span>
        </a>

        <a routerLink="/profile" routerLinkActive="active" class="rs-item" *ngIf="auth.isAuthenticated()">
          <span class="icon">👤</span>
          <span class="label" *ngIf="!isCollapsed">Profile</span>
        </a>

        <a routerLink="/login" class="rs-item" *ngIf="!auth.isAuthenticated()">
          <span class="icon">🔐</span>
          <span class="label" *ngIf="!isCollapsed">Login</span>
        </a>
      </nav>

      <div class="rs-footer" *ngIf="!isCollapsed && auth.isAuthenticated()">
        <button class="rs-logout" (click)="logout()">🚪 Logout</button>
      </div>
    </aside>
  `,
  styles: [
    `
    .right-sidebar {
      position: fixed;
      right: 0;
      top: 0;
      height: 100dvh;
      width: var(--right-sidebar-width);
      background: #ffffff;
      border-left: 1px solid rgba(30,41,59,0.06);
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: transform 0.22s ease, width 0.22s ease;
      z-index: 1200;
    }

    .right-sidebar.collapsed {
      width: var(--right-sidebar-collapsed-width);
    }

    .toggle-area {
      display: flex;
      justify-content: flex-start;
      padding: 0.25rem;
    }

    .collapse-toggle {
      background: transparent;
      border: 1px solid rgba(37,99,235,0.08);
      padding: 0.35rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
    }

    .rs-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.25rem;
      flex: 1;
      overflow: auto;
    }

    .rs-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      color: #374151;
      text-decoration: none;
      font-weight: 600;
    }

    .rs-item .icon { width: 28px; text-align: center; font-size: 1.05rem; }

    .rs-item:hover { background: rgba(37,99,235,0.06); transform: translateY(-1px); }

    .rs-item.active { background-color: #e11d48; color: #fff; }

    .rs-footer { padding: 0.5rem; border-top: 1px solid rgba(30,41,59,0.04); }

    .rs-logout { width: 100%; padding: 0.5rem; border-radius: 8px; border: none; background-color: #e11d48; color: #fff; font-weight: 700; cursor: pointer; }

    @media (max-width: 900px) {
      .right-sidebar { transform: translateX(0); position: fixed; }
      .right-sidebar.collapsed { transform: translateX(var(--right-sidebar-width)); }
    }

    @media (max-width: 640px) {
      .right-sidebar { width: 64px; }
      .right-sidebar.collapsed { transform: translateX(var(--right-sidebar-width)); }
    }
    `
  ]
})
export class RightSidebarComponent {
  auth = inject(AuthService);
  isCollapsed = false;

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.auth.logout();
  }
}

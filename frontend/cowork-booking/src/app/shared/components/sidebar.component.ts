import { Component, inject, HostBinding, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <div class="sidebar-top">
        <button class="collapse-btn" (click)="toggleCollapse()" aria-label="Toggle sidebar">
          <span *ngIf="!isCollapsed" class="collapse-icon">◀</span>
          <span *ngIf="isCollapsed" class="collapse-icon">▶</span>
        </button>
        <a routerLink="/" class="brand" *ngIf="!isCollapsed">
          <span class="brand-icon">🏢</span>
          <span class="brand-text">{{ 'COMMON.BRAND' | translate }}</span>
        </a>
      </div>

      <nav class="sidebar-nav">
        <a routerLink="/" routerLinkActive="active" class="nav-item">
          <span class="icon">🏠</span>
          <span class="label" *ngIf="!isCollapsed">{{ 'NAV.HOME' | translate }}</span>
        </a>

        <a routerLink="/workspaces" routerLinkActive="active" class="nav-item" *ngIf="auth.isAuthenticated()">
          <span class="icon">📋</span>
          <span class="label" *ngIf="!isCollapsed">{{ 'NAV.WORKSPACES' | translate }}</span>
        </a>

        <a routerLink="/owner/dashboard" routerLinkActive="active" class="nav-item" *ngIf="auth.isOwner()">
          <span class="icon">🏢</span>
          <span class="label" *ngIf="!isCollapsed">{{ 'NAV.MY_WORKSPACES' | translate }}</span>
        </a>

        <a routerLink="/business-dashboard" routerLinkActive="active" class="nav-item" *ngIf="auth.hasAnyRole(['Owner', 'Admin'])">
          <span class="icon">📈</span>
          <span class="label" *ngIf="!isCollapsed">{{ 'NAV.BUSINESS_DASHBOARD' | translate }}</span>
        </a>

        <a routerLink="/admin" routerLinkActive="active" class="nav-item" *ngIf="auth.isAdmin()">
          <span class="icon">⚙️</span>
          <span class="label" *ngIf="!isCollapsed">{{ 'NAV.ADMIN_PANEL' | translate }}</span>
        </a>

        <a routerLink="/profile" routerLinkActive="active" class="nav-item" *ngIf="auth.isAuthenticated()">
          <span class="icon">👤</span>
          <span class="label" *ngIf="!isCollapsed">{{ 'NAV.PROFILE' | translate }}</span>
        </a>

        <a routerLink="/login" class="nav-item" *ngIf="!auth.isAuthenticated()">
          <span class="icon">🔐</span>
          <span class="label" *ngIf="!isCollapsed">{{ 'NAV.LOGIN' | translate }}</span>
        </a>

      </nav>

      <div class="sidebar-footer" *ngIf="!isCollapsed">
        <button class="lang-toggle" (click)="langService.toggleLanguage()">
          🌐 {{ langService.currentLanguage() === 'en' ? 'عربي' : 'English' }}
        </button>
        <button class="logout-small" (click)="logout()" *ngIf="auth.isAuthenticated()">🚪 {{ 'COMMON.LOGOUT' | translate }}</button>
      </div>
    </aside>
  `,
  styles: [
    `
    .sidebar {
      width: var(--sidebar-width);
      min-width: 64px;
      background-color: #f8fafc;
      border-right: 1px solid rgba(30,41,59,0.06);
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      height: 100dvh;
      display: flex;
      flex-direction: column;
      padding: 0.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.03);
      transition: width 0.22s ease, transform 0.2s ease;
      z-index: 1100;
    }

    .sidebar.collapsed {
      width: var(--sidebar-collapsed-width);
    }

    /* when the host has collapsed class, shrink the inner sidebar as well */
    :host(.collapsed) .sidebar {
      width: var(--sidebar-collapsed-width);
    }

    .sidebar-top {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.5rem;
    }

    .collapse-btn {
      background: transparent;
      border: 1px solid rgba(37,99,235,0.08);
      padding: 0.35rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #1f2937;
      font-weight: 700;
      padding-left: 0.5rem;
    }

    .brand-icon { font-size: 1.25rem; }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-top: 0.75rem;
      padding: 0 0.25rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.65rem;
      border-radius: 8px;
      text-decoration: none;
      color: #374151;
      font-weight: 600;
      transition: background 0.18s, transform 0.12s;
    }

    .nav-item .icon { font-size: 1.05rem; width: 24px; text-align: center; }

    .nav-item:hover {
      background: rgba(37,99,235,0.06);
      transform: translateY(-1px);
    }

    .nav-item.active {
      background-color: #2563eb;
      color: #fff;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }

    .label { font-size: 0.9rem; }

    .sidebar-footer {
      padding: 0.5rem;
      border-top: 1px solid rgba(30,41,59,0.04);
    }

    .logout-small {
      width: 100%;
      padding: 0.5rem;
      border-radius: 8px;
      border: none;
      background-color: #dc2626;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    .logout-small:hover {
      background-color: #b91c1c;
    }

    .lang-toggle {
      width: 100%;
      padding: 0.5rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #f1f5f9;
      color: #172554;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
      transition: background 0.2s;
      font-family: 'Inter', 'Cairo', sans-serif;
    }

    .lang-toggle:hover {
      background: #e2e8f0;
    }

    .collapse-icon {
      display: inline-block;
      font-size: 0.75rem;
      line-height: 1;
    }

    :host-context([dir="rtl"]) .collapse-icon {
      transform: scaleX(-1);
    }

    @media (max-width: 768px) {
      .sidebar { position: fixed; z-index: 1200; left: 0; top: 0; }
      .sidebar.collapsed { transform: translateX(-100%); }
      :host(.collapsed) .sidebar { transform: translateX(-100%); }
    }

    :host-context([dir="rtl"]) .sidebar {
      left: auto;
      right: 0;
      border-right: none;
      border-left: 1px solid rgba(30,41,59,0.06);
    }

    :host-context([dir="rtl"]) .brand {
      padding-left: 0;
      padding-right: 0.5rem;
    }

    @media (max-width: 768px) {
      :host-context([dir="rtl"]) .sidebar {
        right: 0;
        left: auto;
      }
      :host-context([dir="rtl"]) .sidebar.collapsed {
        transform: translateX(100%);
      }
      :host-context([dir="rtl"]):host(.collapsed) .sidebar {
        transform: translateX(100%);
      }
    }
    `
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  langService = inject(LanguageService);
  private router = inject(Router);
  isCollapsed = false;
  private routerSub?: Subscription;

  @HostBinding('class.collapsed')
  get hostCollapsed(): boolean {
    return this.isCollapsed;
  }

  ngOnInit(): void {
    // On mobile, auto-close the sidebar whenever navigation completes.
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (window.innerWidth <= 768) {
          this.isCollapsed = true;
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.auth.logout();
  }
}

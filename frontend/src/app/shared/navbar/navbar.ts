import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PushService } from '../../core/services/push.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  private pushService = inject(PushService);
  private router = inject(Router);
  menuOpen = signal(false);
  adminMenuOpen = signal(false);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd && this.authService.currentUser()) {
        this.notificationService.refreshUnreadCount();
      }
    });
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.adminMenuOpen.set(false);
  }

  isAdminSection(): boolean {
    const url = this.router.url;
    return (
      url.startsWith('/admin/reports') ||
      url.startsWith('/admin/catalogs') ||
      url.startsWith('/admin/settings') ||
      url.startsWith('/admin/audit')
    );
  }

  logout(): void {
    this.closeMenu();
    this.notificationService.unreadCount.set(0);
    this.pushService.forgetDevice();
    this.authService.logout();
  }

  panelUrl(): string {
    const user = this.authService.currentUser();
    if (!user) {
      return '/';
    }
    return this.authService.homeForRole(user.role);
  }
}

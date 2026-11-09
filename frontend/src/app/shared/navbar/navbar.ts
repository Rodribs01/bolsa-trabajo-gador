import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {
  authService = inject(AuthService);
  menuOpen = signal(false);

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
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

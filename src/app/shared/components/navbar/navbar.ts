import { NgClass } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [NgClass, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  host: { class: 'contents' },
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  protected readonly isMobileNavOpen = signal(false);
  private readonly router = inject(Router);

  protected toggleMobileNav(): void {
    this.isMobileNavOpen.update((open) => !open);
  }

  protected closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }

  protected logout(): void {
    this.closeMobileNav();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('window:keydown.escape')
  protected handleEscape(): void {
    this.closeMobileNav();
  }
}

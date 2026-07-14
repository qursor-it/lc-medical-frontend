import { NgClass } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { inject } from '@angular/core';
import { ToastModule } from 'primeng/toast';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [NgClass, RouterLink, RouterLinkActive, RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
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

import { Component, inject, signal, ChangeDetectionStrategy, HostListener, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnDestroy {
  private router = inject(Router);

  mobileOpen = signal(false);
  aboutOpen  = signal(false);
  currentUrl = signal('');

  constructor() {
    // Set initial URL on load
    this.currentUrl.set(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.closeMobile();
      });

    // Prevent body scrolling when mobile menu is open, restore when closed
    effect(() => {
      if (this.mobileOpen()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  @HostListener('window:keydown.escape')
  handleEscape() {
    if (this.mobileOpen()) {
      this.closeMobile();
    }
  }

  ngOnDestroy() {
    // Ensure body scroll is restored on destroy
    document.body.style.overflow = '';
  }

  isHome(): boolean { return this.currentUrl() === '/'; }

  /** Returns true if the current URL starts with the given prefix (exact match for '/') */
  isActiveRoute(prefix: string): boolean {
    const url = this.currentUrl();
    if (prefix === '/') return url === '/';
    return url === prefix || url.startsWith(prefix + '/');
  }

  /** Returns true when any About Us sub-page is active */
  isAboutActive(): boolean {
    return this.currentUrl().startsWith('/about');
  }

  /** Navigate to route, or scroll to section if already on home page */
  goto(route: string): void {
    this.mobileOpen.set(false);
    this.aboutOpen.set(false);
    this.router.navigate([route]).then(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  /** Scroll to section on home page, or navigate home first then scroll */
  scrollTo(id: string): void {
    this.mobileOpen.set(false);
    this.aboutOpen.set(false);
    if (this.isHome()) {
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50);
    } else {
      this.router.navigate(['/']).then(() =>
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 200)
      );
    }
  }

  toggleAbout(): void   { this.aboutOpen.update(v => !v); }
  toggleMobile(): void  { this.mobileOpen.update(v => !v); }
  closeMobile(): void   { this.mobileOpen.set(false); this.aboutOpen.set(false); }
}

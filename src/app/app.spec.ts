import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { App } from './app';

describe('App', () => {
  const storageKey = 'lc-medical-auth';

  beforeEach(async () => {
    localStorage.removeItem(storageKey);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideAnimationsAsync(), provideRouter([]), MessageService],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render sidebar navigation', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        token: 'test-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        user: {
          id: 1,
          email: 'admin@example.com',
          fullName: 'Admin',
          role: 'ADMIN',
          active: true,
        },
      }),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav')?.textContent).toContain('Dashboard');
    expect(compiled.querySelector('nav')?.textContent).toContain('Pagamenti');
    expect(compiled.querySelector('nav')?.textContent).toContain('Importa ordini');
    expect(compiled.querySelector('nav')?.textContent).toContain('Importa pagamenti');
  });
});

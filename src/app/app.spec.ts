import { provideRouter } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { App } from './app';
import { AuthService } from './core/services/auth.service';

class AuthServiceStub {
  readonly token$ = of(null);
  readonly currentUser$ = of(null);

  isAuthenticated(): boolean {
    return false;
  }

  logout(): void {}
}

describe('App', () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, RouterTestingModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
  });

  it('creates the shell', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the brand link', () => {
    fixture.detectChanges();
    const brand = fixture.nativeElement.querySelector('.shell__brand');
    expect(brand?.textContent?.trim()).toBe('TweetApp');
  });
});

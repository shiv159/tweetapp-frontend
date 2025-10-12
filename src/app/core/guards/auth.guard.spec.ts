import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authenticated = false;

  beforeEach(() => {
    authenticated = false;

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => authenticated
          }
        }
      ]
    });
  });

  it('allows access when authenticated', () => {
    authenticated = true;

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, { url: '/feed' } as any));

    expect(result).toBeTrue();
  });

  it('redirects to login when not authenticated', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, { url: '/feed' } as any));

    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/feed' } });
  });
});

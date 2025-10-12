import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-response';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

class TokenStorageStub {
  private token: string | null = null;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  hasToken(): boolean {
    return this.token !== null;
  }
}

const JWT_HEADER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const JWT_PAYLOAD = 'eyJ1c2VySWQiOiIxMjMiLCJ1c2VybmFtZSI6ImFsaWNlIn0';
const JWT_SIGNATURE = 'signature';
const SAMPLE_TOKEN = `${JWT_HEADER}.${JWT_PAYLOAD}.${JWT_SIGNATURE}`;

describe('AuthService', () => {
  let http: HttpTestingController;
  let tokenStorage: TokenStorageStub;
  let router: Router;

  beforeEach(() => {
    tokenStorage = new TokenStorageStub();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: TokenStorageService, useValue: tokenStorage }
      ]
    });

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
  });

  it('stores token and user details on successful login', () => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    const service = TestBed.inject(AuthService);

    service.login({ username: 'alice', password: 'secret' }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/api/auth/login`);
    const response: ApiResponse<string> = {
      data: SAMPLE_TOKEN,
      error: null,
      message: 'OK'
    };
    request.flush(response);

    expect(tokenStorage.getToken()).toBe(SAMPLE_TOKEN);
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getCurrentUser()).toEqual({ userId: '123', username: 'alice' });
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('clears token on logout', () => {
    tokenStorage.setToken(SAMPLE_TOKEN);
    const service = TestBed.inject(AuthService);
    service.logout();

    expect(tokenStorage.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('hydrates existing token from storage on creation', () => {
    tokenStorage.setToken(SAMPLE_TOKEN);

    const hydratedService = TestBed.inject(AuthService);

    expect(hydratedService.isAuthenticated()).toBeTrue();
    expect(hydratedService.getCurrentUser()).toEqual({ userId: '123', username: 'alice' });
  });
});

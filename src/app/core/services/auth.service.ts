import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-response';
import { LoginRequest, RegisterRequest } from '../../models/auth';
import { User } from '../../models/user';
import { TokenStorageService } from './token-storage.service';
import { MockAuthService } from '../mocks/mock-auth.service';

interface JwtClaims {
  userId?: string;
  username?: string;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);

  readonly token$ = this.tokenSubject.asObservable();
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly tokenStorage: TokenStorageService
  ) {
    // Inject mock service lazily
    this.mockAuth = inject(MockAuthService);
    this.hydrateFromStorage();
  }

  private readonly mockAuth?: MockAuthService;

  register(request: RegisterRequest): Observable<ApiResponse<string>> {
    if (environment.useMockApi && this.mockAuth) {
      return this.mockAuth.register(request) as Observable<ApiResponse<string>>;
    }
    return this.http.post<ApiResponse<string>>(`${environment.apiBaseUrl}/api/auth/register`, request);
  }

  login(request: LoginRequest): Observable<ApiResponse<string>> {
    if (environment.useMockApi && this.mockAuth) {
            this.currentUserSubject.next({ userId: request.username, username: request.username });
            console.log("logged with {}",request.username);
      return of({ data: 'mock.token.payload', error: null, message: 'Logged in' });
    }

    return this.http
      .post<ApiResponse<string>>(`${environment.apiBaseUrl}/api/auth/login`, request)
      .pipe(tap((response) => this.handleLoginResponse(response)));
  }

  logout(): void {
    if (environment.useMockApi && this.mockAuth) {
      this.mockAuth.logout();
    }

    this.tokenStorage.clearToken();
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    void this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.tokenSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private handleLoginResponse(response: ApiResponse<string>): void {
    if (!response.data) {
      console.warn('Login response contained no token.');
      return;
    }

    const token = response.data;
    const claims = this.decodeClaims(token);
    this.tokenStorage.setToken(token);
    this.tokenSubject.next(token);
    if (claims?.userId && claims?.username) {
      this.currentUserSubject.next({ userId: claims.userId, username: claims.username });
    } else {
      this.currentUserSubject.next(null);
    }
  }

  private hydrateFromStorage(): void {
    const token = this.tokenStorage.getToken();

    if (!token) {
      return;
    }

    const claims = this.decodeClaims(token);

    if (claims?.exp && claims.exp * 1000 < Date.now()) {
      this.tokenStorage.clearToken();
      return;
    }

    this.tokenSubject.next(token);
    if (claims?.userId && claims?.username) {
      this.currentUserSubject.next({ userId: claims.userId, username: claims.username });
    } else {
      this.currentUserSubject.next(null);
    }
  }

  private decodeClaims(token: string): JwtClaims | null {
    try {
      const payload = token.split('.')[1];

      if (!payload) {
        return null;
      }

      const decoded = this.base64Decode(this.padBase64(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return JSON.parse(decoded) as JwtClaims;
    } catch {
      return null;
    }
  }

  private padBase64(payload: string): string {
    const padLength = 4 - (payload.length % 4);
    if (padLength === 4) {
      return payload;
    }

    return `${payload}${'='.repeat(padLength)}`;
  }

  private base64Decode(payload: string): string {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(payload);
    }

    if (typeof globalThis !== 'undefined') {
      const candidate = (globalThis as { atob?: (value: string) => string }).atob;
      if (typeof candidate === 'function') {
        return candidate(payload);
      }

      type NodeBufferLike = {
        from(input: string, encoding: string): { toString(encoding: string): string };
      };

      const globalRecord = globalThis as Record<string, unknown>;
      const bufferCandidate = globalRecord['Buffer'] as unknown;

      if (bufferCandidate && typeof bufferCandidate === 'function') {
        const bufferCtor = bufferCandidate as unknown as NodeBufferLike;
        if (typeof bufferCtor.from === 'function') {
          return bufferCtor.from(payload, 'base64').toString('binary');
        }
      }
    }

    throw new Error('Unable to decode base64 payload.');
  }
}

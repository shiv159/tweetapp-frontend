import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

import { ApiResponse } from '../../models/api-response';
import { LoginRequest, RegisterRequest } from '../../models/auth';
import { User } from '../../models/user';
import { TokenStorageService } from '../services/token-storage.service';

const NETWORK_DELAY = 200;

@Injectable({ providedIn: 'root' })
export class MockAuthService {
  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);

  readonly token$ = this.tokenSubject.asObservable();
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly tokenStorage = inject(TokenStorageService);

  register(_: RegisterRequest): Observable<ApiResponse<string>> {
    // Return a fake token
    const token = 'mock.token.payload';
    return of({ data: token, error: null, message: 'Registered' }).pipe(
      delay(NETWORK_DELAY),
      tap((res) => {
        this.tokenStorage.setToken(res.data ?? '');
        this.setTokenAndUser(res.data);
      })
    );
  }

  login(_: LoginRequest): Observable<ApiResponse<string>> {
    const token = 'mock.token.payload';
    return of({ data: token, error: null, message: 'Logged in' }).pipe(
      delay(NETWORK_DELAY),
      tap((res) => {
        this.tokenStorage.setToken(res.data ?? '');
        this.setTokenAndUser(res.data);
      })
    );
  }

  logout(): void {
    this.tokenStorage.clearToken();
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.tokenSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setTokenAndUser(token: string | null) {
    this.tokenSubject.next(token);
    if (token) {
      this.currentUserSubject.next({ userId: 'bob', username: 'bob' });
    } else {
      this.currentUserSubject.next(null);
    }
  }
}

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

const AUTH_SEGMENT = '/api/auth';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);
  const router = inject(Router);

  let request = req;
  const isAuthRequest = normalizeUrl(req.url).startsWith(`${environment.apiBaseUrl}${AUTH_SEGMENT}`);
  const token = tokenStorage.getToken();

  if (token && !isAuthRequest) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        if (router.url !== '/login') {
          void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        }
      }

      return throwError(() => error);
    })
  );
};

function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${environment.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}
